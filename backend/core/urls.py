from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from apps.products.views import BrandViewSet, CategoryViewSet
from apps.crm.views import EnquiryViewSet
from apps.core.views import OfferViewSet, GalleryItemViewSet, MilestoneViewSet

public_router = DefaultRouter()
public_router.register('brands', BrandViewSet, basename='public-brands')
public_router.register('categories', CategoryViewSet, basename='public-categories')
public_router.register('enquiries', EnquiryViewSet, basename='public-enquiries')
public_router.register('offers', OfferViewSet, basename='public-offers')
public_router.register('gallery', GalleryItemViewSet, basename='public-gallery')
public_router.register('milestones', MilestoneViewSet, basename='public-milestones')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # JWT Auth
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # App URLs
    path('api/users/', include('apps.users.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/sales/', include('apps.sales.urls')),
    path('api/repairs/', include('apps.repairs.urls')),
    path('api/customers/', include('apps.crm.urls')),
    path('api/expenses/', include('apps.expenses.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    
    # Public & Core endpoints
    path('api/', include(public_router.urls)),
    path('api/', include('apps.core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
