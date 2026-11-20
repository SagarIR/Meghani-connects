from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupplierViewSet,
    ProductSupplierViewSet,
    PurchaseOrderViewSet,
    GoodsReceiptViewSet,
    StockMovementViewSet,
)

router = DefaultRouter()
router.register('suppliers', SupplierViewSet, basename='supplier')
router.register('orders', PurchaseOrderViewSet, basename='purchase-order')
router.register('receipts', GoodsReceiptViewSet, basename='goods-receipt')
router.register('movements', StockMovementViewSet, basename='stock-movement')
router.register('product-suppliers', ProductSupplierViewSet, basename='product-supplier')

urlpatterns = [
    path('', include(router.urls)),
]
