from django.urls import path
from .views import (
    HealthCheckView, ReadinessView, LivenessView, SystemInfoView,
    AuditLogListView, AuditLogStatsView,
    BusinessSettingsView, UserPreferencesView,
    BackupListView, BackupDownloadView, BackupRestoreView, BackupDeleteView, BackupCleanupView,
    ImageUploadView,
    PublicBusinessSettingsView, PublicOfferView, PublicGalleryView, PublicMilestoneView
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('ready/', ReadinessView.as_view(), name='readiness-check'),
    path('live/', LivenessView.as_view(), name='liveness-check'),
    path('system/', SystemInfoView.as_view(), name='system-info'),
    
    # Audit logs
    path('audit-logs/', AuditLogListView.as_view(), name='audit-log-list'),
    path('audit-logs/stats/', AuditLogStatsView.as_view(), name='audit-log-stats'),
    
    # Settings & Public Store Info
    path('settings/business/', BusinessSettingsView.as_view(), name='business-settings'),
    path('settings/public/', PublicBusinessSettingsView.as_view(), name='public-business-settings'),
    path('settings/preferences/', UserPreferencesView.as_view(), name='user-preferences'),
    
    # Backup
    path('backups/', BackupListView.as_view(), name='backup-list'),
    path('backups/<str:filename>/download/', BackupDownloadView.as_view(), name='backup-download'),
    path('backups/<str:filename>/restore/', BackupRestoreView.as_view(), name='backup-restore'),
    path('backups/<str:filename>/delete/', BackupDeleteView.as_view(), name='backup-delete'),
    # Media & Cloudinary Upload
    path('upload/image/', ImageUploadView.as_view(), name='image-upload'),
]
