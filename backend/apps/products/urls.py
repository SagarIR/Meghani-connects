from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, ProductImportView, ProductExportTemplateView,
    PublicProductViewSet
)

router = DefaultRouter()
router.register('public', PublicProductViewSet, basename='public-products')
router.register('', ProductViewSet, basename='products')

urlpatterns = [
    path('import/', ProductImportView.as_view(), name='product-import'),
    path('import/template/', ProductExportTemplateView.as_view(), name='product-import-template'),
    path('', include(router.urls)),
]
