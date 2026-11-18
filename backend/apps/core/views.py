"""
Core views - Health check, system status, and audit logs
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from apps.users.permissions import IsManagerOrAbove
from rest_framework.generics import ListAPIView
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db import connection
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from .models import AuditLog, Offer, GalleryItem, Milestone
from .settings_models import BusinessSettings, UserPreferences
from .serializers import (
    AuditLogSerializer, BusinessSettingsSerializer, UserPreferencesSerializer,
    PublicBusinessSettingsSerializer, OfferSerializer, GalleryItemSerializer, MilestoneSerializer
)
from .backup_service import BackupService
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import viewsets
from django.http import FileResponse
import redis
import os


class HealthCheckView(APIView):
    """
    Health check endpoint for monitoring and load balancers.
    Returns status of all critical services.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        health = {
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'version': os.getenv('APP_VERSION', '1.0.0'),
            'services': {}
        }
        
        # Check database
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            health['services']['database'] = {'status': 'up'}
        except Exception as e:
            health['services']['database'] = {'status': 'down', 'error': str(e)}
            health['status'] = 'unhealthy'
        
        # Check Redis
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
            r = redis.from_url(redis_url)
            r.ping()
            health['services']['redis'] = {'status': 'up'}
        except Exception as e:
            health['services']['redis'] = {'status': 'down', 'error': str(e)}
            # Redis down is warning, not critical
            if health['status'] == 'healthy':
                health['status'] = 'degraded'
        
        # Check cache
        try:
            cache.set('health_check', 'ok', 10)
            if cache.get('health_check') == 'ok':
                health['services']['cache'] = {'status': 'up'}
            else:
                health['services']['cache'] = {'status': 'degraded'}
        except Exception as e:
            health['services']['cache'] = {'status': 'down', 'error': str(e)}
        
        status_code = 200 if health['status'] == 'healthy' else 503
        return Response(health, status=status_code)


class ReadinessView(APIView):
    """
    Readiness check - is the app ready to receive traffic?
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        # Check if database is ready
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            return Response({'status': 'ready'})
        except Exception:
            return Response({'status': 'not ready'}, status=503)


class LivenessView(APIView):
    """
    Liveness check - is the app running?
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        return Response({'status': 'alive', 'timestamp': timezone.now().isoformat()})


class SystemInfoView(APIView):
    """
    System information for admins
    """
    
    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        
        return Response({
            'debug_mode': settings.DEBUG,
            'database_engine': connection.vendor,
            'python_version': os.popen('python --version').read().strip(),
            'django_version': __import__('django').get_version(),
            'timezone': str(settings.TIME_ZONE),
            'installed_apps': len(settings.INSTALLED_APPS),
        })


class AuditLogListView(ListAPIView):
    """
    List all audit logs (admin only)
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'severity', 'model_name', 'user']
    search_fields = ['message', 'object_repr', 'ip_address']
    ordering_fields = ['timestamp', 'action', 'severity']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        queryset = AuditLog.objects.select_related('user', 'content_type')
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)
        
        return queryset


class AuditLogStatsView(APIView):
    """
    Audit log statistics (admin only)
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        from django.db.models import Count
        from django.db.models.functions import TruncDate
        
        # Action breakdown
        action_stats = AuditLog.objects.values('action').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Recent activity by day
        daily_activity = AuditLog.objects.filter(
            timestamp__gte=timezone.now() - timezone.timedelta(days=30)
        ).annotate(
            date=TruncDate('timestamp')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('-date')[:30]
        
        # Top users by activity
        top_users = AuditLog.objects.values(
            'user__id', 'user__username', 'user__email'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Severity breakdown
        severity_stats = AuditLog.objects.values('severity').annotate(
            count=Count('id')
        )
        
        return Response({
            'action_breakdown': list(action_stats),
            'daily_activity': list(daily_activity),
            'top_users': list(top_users),
            'severity_breakdown': list(severity_stats),
            'total_logs': AuditLog.objects.count(),
        })


class BusinessSettingsView(APIView):
    """
    Get and update business settings (admin only)
    """
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get(self, request):
        settings_obj = BusinessSettings.get_settings()
        serializer = BusinessSettingsSerializer(settings_obj, context={'request': request})
        return Response(serializer.data)
    
    def patch(self, request):
        settings_obj = BusinessSettings.get_settings()
        serializer = BusinessSettingsSerializer(
            settings_obj, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class UserPreferencesView(APIView):
    """
    Get and update user preferences
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        prefs, created = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(prefs)
        return Response(serializer.data)
    
    def patch(self, request):
        prefs, created = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(prefs, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class BackupListView(APIView):
    """
    List all backups and create new backup.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """List all available backups."""
        service = BackupService()
        backups = service.list_backups()
        return Response({
            'backups': backups,
            'count': len(backups)
        })
    
    def post(self, request):
        """Create a new backup."""
        service = BackupService()
        result = service.create_backup(user=request.user)
        
        if result['success']:
            return Response(result)
        return Response(result, status=500)


class BackupDownloadView(APIView):
    """
    Download a backup file.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request, filename):
        """Download a specific backup file."""
        service = BackupService()
        filepath, metadata = service.get_backup(filename)
        
        if not filepath:
            return Response({'error': 'Backup not found'}, status=404)
        
        return FileResponse(
            open(filepath, 'rb'),
            as_attachment=True,
            filename=filename
        )


class BackupRestoreView(APIView):
    """
    Restore from a backup file.
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, filename):
        """Restore database from a backup."""
        service = BackupService()
        result = service.restore_backup(filename, user=request.user)
        
        if result['success']:
            return Response(result)
        return Response(result, status=400)


class BackupDeleteView(APIView):
    """
    Delete a backup file.
    """
    permission_classes = [IsAdminUser]
    
    def delete(self, request, filename):
        """Delete a specific backup file."""
        service = BackupService()
        result = service.delete_backup(filename)
        
        if result['success']:
            return Response(result)
        return Response(result, status=400)


class BackupCleanupView(APIView):
    """
    Clean up old backups.
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """Clean up old backups, keeping only recent ones."""
        keep_count = request.data.get('keep_count', 10)
        service = BackupService()
        result = service.cleanup_old_backups(keep_count=keep_count)
        
        return Response(result)


class ImageUploadView(APIView):
    """
    Secure Image Upload endpoint.
    Handles upload to Cloudinary (or local media storage fallback).
    Requires staff authentication to prevent unauthenticated flooding and DoS.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file') or request.FILES.get('image')
        if not file_obj:
            return Response({'error': 'No image file provided'}, status=400)

        # Validate file size (max 5MB)
        if file_obj.size > 5 * 1024 * 1024:
            return Response({'error': 'File size exceeds maximum 5MB limit'}, status=400)

        # Validate extension
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif']
        ext = os.path.splitext(file_obj.name.lower())[1]
        if ext not in allowed_extensions:
            return Response({'error': f'Unsupported format {ext}. Allowed: {", ".join(allowed_extensions)}'}, status=400)

        from .cloudinary_service import CloudinaryMediaService
        service = CloudinaryMediaService()
        
        # Whitelist allowed upload folders
        allowed_folders = {'meghani-watches', 'meghani-cms', 'receipts', 'products'}
        requested_folder = request.data.get('folder', 'meghani-watches')
        folder = requested_folder if requested_folder in allowed_folders else 'meghani-watches'
        
        result = service.upload_image(file_obj, folder=folder)

        if result.get('success'):
            return Response(result, status=201)
        return Response(result, status=500)


class PublicBusinessSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings_obj = BusinessSettings.get_settings()
        serializer = PublicBusinessSettingsSerializer(settings_obj, context={'request': request})
        return Response(serializer.data)


class OfferViewSet(viewsets.ModelViewSet):
    serializer_class = OfferSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'badge', 'code', 'discount']
    ordering_fields = ['display_order', 'id']
    ordering = ['display_order', 'id']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsManagerOrAbove()]

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            return Offer.objects.all()
        return Offer.objects.filter(is_active=True)


class GalleryItemViewSet(viewsets.ModelViewSet):
    serializer_class = GalleryItemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'category', 'caption']
    ordering_fields = ['display_order', 'id']
    ordering = ['display_order', 'id']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsManagerOrAbove()]

    def get_queryset(self):
        qs = GalleryItem.objects.all() if (self.request.user and self.request.user.is_authenticated) else GalleryItem.objects.filter(is_active=True)
        cat = self.request.query_params.get('category')
        if cat and cat != 'all':
            qs = qs.filter(category=cat)
        return qs.order_by('display_order', 'id')


class MilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = MilestoneSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['year', 'title', 'description']
    ordering_fields = ['display_order', 'year']
    ordering = ['display_order', 'year']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsManagerOrAbove()]

    def get_queryset(self):
        return Milestone.objects.all().order_by('display_order', 'year')


class PublicOfferView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = OfferSerializer
    queryset = Offer.objects.filter(is_active=True)


class PublicGalleryView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = GalleryItemSerializer
    queryset = GalleryItem.objects.filter(is_active=True)

    def get_queryset(self):
        qs = super().get_queryset()
        cat = self.request.query_params.get('category')
        if cat and cat != 'all':
            qs = qs.filter(category=cat)
        return qs


class PublicMilestoneView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = MilestoneSerializer
    queryset = Milestone.objects.filter(is_active=True)

