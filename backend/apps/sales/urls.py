from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SaleViewSet, WarrantyViewSet

router = DefaultRouter()
router.register('warranties', WarrantyViewSet, basename='warranties')
router.register('', SaleViewSet, basename='sales')

urlpatterns = [
    path('', include(router.urls)),
]
