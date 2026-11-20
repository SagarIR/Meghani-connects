from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SaleViewSet, WarrantyViewSet, SaleReturnViewSet, WarrantyClaimViewSet

router = DefaultRouter()
router.register('returns', SaleReturnViewSet, basename='sales-returns')
router.register('claims', WarrantyClaimViewSet, basename='warranty-claims')
router.register('warranties', WarrantyViewSet, basename='warranties')
router.register('', SaleViewSet, basename='sales')

urlpatterns = [
    path('', include(router.urls)),
]
