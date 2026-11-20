from decimal import Decimal
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from django.db.models import Q
from apps.users.permissions import IsManagerOrAbove, IsStaffOrAbove
from .models import (
    Supplier, ProductSupplier, PurchaseOrder, PurchaseOrderItem,
    GoodsReceipt, GoodsReceiptItem, StockMovement
)
from .serializers import (
    SupplierSerializer, ProductSupplierSerializer,
    PurchaseOrderSerializer, PurchaseOrderCreateSerializer,
    GoodsReceiptSerializer, GoodsReceiptCreateSerializer,
    StockMovementSerializer
)
from .services import PurchasingService, InventoryService


class SupplierViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Suppliers / Vendors.
    Read: Authenticated staff.
    Write: Managers and Admins.
    """
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'phone', 'email', 'gstin']
    ordering_fields = ['name', 'created_at', 'opening_balance']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManagerOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() in ['true', '1']:
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() in ['false', '0']:
                queryset = queryset.filter(is_active=False)
        return queryset


class ProductSupplierViewSet(viewsets.ModelViewSet):
    """
    ViewSet for associating Products with Suppliers (multi-supplier catalog).
    """
    queryset = ProductSupplier.objects.select_related('product', 'supplier').all()
    serializer_class = ProductSupplierSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'supplier__name', 'supplier_sku']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManagerOrAbove()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')
        supplier_id = self.request.query_params.get('supplier')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        return queryset


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Purchase Orders.
    Includes actions for goods receipt, cancellation, and recalculation.
    """
    queryset = PurchaseOrder.objects.select_related('supplier', 'created_by').prefetch_related(
        'items__product'
    ).all().order_by('-created_at')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'order_number', 'supplier__name', 'supplier_invoice_number', 'notes'
    ]
    ordering_fields = ['order_date', 'total_amount', 'created_at', 'status']

    def get_permissions(self):
        if self.action in ['destroy']:
            return [IsManagerOrAbove()]
        if self.action in ['create', 'update', 'partial_update', 'cancel_order']:
            return [IsManagerOrAbove()]
        return [IsStaffOrAbove()]

    def get_serializer_class(self):
        if self.action == 'create':
            return PurchaseOrderCreateSerializer
        return PurchaseOrderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        supplier_param = self.request.query_params.get('supplier')
        if supplier_param:
            queryset = queryset.filter(supplier_id=supplier_param)
        return queryset

    @action(detail=True, methods=['post'], url_path='receive')
    def receive_goods(self, request, pk=None):
        """
        Receives goods line-by-line against this Purchase Order.
        Increments stock atomically and records an immutable StockMovement entry.
        """
        po = self.get_object()
        serializer = GoodsReceiptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            receipt = PurchasingService.receive_goods(
                purchase_order_or_id=po,
                items_data=serializer.validated_data['items'],
                received_by=request.user,
                delivery_note=serializer.validated_data.get('supplier_delivery_note', ''),
                notes=serializer.validated_data.get('notes', '')
            )
            return Response(
                GoodsReceiptSerializer(receipt).data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)},
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_order(self, request, pk=None):
        """
        Cancels a draft or ordered Purchase Order.
        Cannot cancel an order that has already received goods.
        """
        po = self.get_object()
        if po.status in ['completed', 'partially_received']:
            return Response(
                {'detail': f"Cannot cancel an order with status '{po.get_status_display()}' that has received goods."},
                status=status.HTTP_400_BAD_REQUEST
            )
        po.status = 'cancelled'
        po.save(update_fields=['status', 'updated_at'])
        return Response({'detail': f'Purchase Order {po.order_number} has been cancelled.', 'status': po.status})

    @action(detail=True, methods=['post'], url_path='recalculate')
    def recalculate(self, request, pk=None):
        """
        Recalculates totals from line items.
        """
        po = self.get_object()
        po.recalculate_totals()
        return Response(PurchaseOrderSerializer(po).data)


class GoodsReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only audit view of all Goods Receipts (GRNs).
    Goods receipts are generated through the PO receive workflow.
    """
    queryset = GoodsReceipt.objects.select_related(
        'purchase_order', 'purchase_order__supplier', 'received_by'
    ).prefetch_related('items__product').all().order_by('-received_at')
    serializer_class = GoodsReceiptSerializer
    permission_classes = [IsStaffOrAbove]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'receipt_number', 'purchase_order__order_number',
        'purchase_order__supplier__name', 'supplier_delivery_note'
    ]
    ordering_fields = ['received_at', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        po_id = self.request.query_params.get('purchase_order')
        if po_id:
            queryset = queryset.filter(purchase_order_id=po_id)
        return queryset


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Central immutable audit ledger for all inventory transactions.
    Supports filtering by product, movement type, date range, and staff user.
    Also provides a controlled manual adjustment endpoint for managers.
    """
    queryset = StockMovement.objects.select_related('product', 'created_by').all().order_by('-created_at')
    serializer_class = StockMovementSerializer
    permission_classes = [IsStaffOrAbove]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'product__name', 'product__article_code', 'reference_id', 'reason'
    ]
    ordering_fields = ['created_at', 'resulting_balance']

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        movement_type = self.request.query_params.get('movement_type')
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)

        from_date = self.request.query_params.get('from_date')
        if from_date:
            queryset = queryset.filter(created_at__date__gte=from_date)

        to_date = self.request.query_params.get('to_date')
        if to_date:
            queryset = queryset.filter(created_at__date__lte=to_date)

        return queryset

    @action(detail=False, methods=['post'], permission_classes=[IsManagerOrAbove], url_path='adjust')
    def manual_adjustment(self, request):
        """
        Controlled manual inventory adjustment (Managers and Admins only).
        Payload:
        {
            "product_id": 1,
            "direction": "in" | "out",
            "quantity": 2,
            "reason": "Annual stock audit variance"
        }
        """
        product_id = request.data.get('product_id')
        direction = request.data.get('direction', 'in').lower()
        quantity = int(request.data.get('quantity', 0))
        reason = request.data.get('reason', '').strip()

        if not product_id or quantity <= 0:
            return Response(
                {'detail': 'Valid product_id and positive quantity are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not reason:
            return Response(
                {'detail': 'A documented reason is mandatory for manual stock adjustments.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        qty_in = quantity if direction == 'in' else 0
        qty_out = quantity if direction == 'out' else 0

        try:
            movement = InventoryService.record_movement(
                product_or_id=product_id,
                movement_type='manual_adjustment',
                qty_in=qty_in,
                qty_out=qty_out,
                reference_id=f"ADJ-{request.user.id if request.user.is_authenticated else 'SYS'}",
                reason=reason,
                user=request.user
            )
            return Response(
                StockMovementSerializer(movement).data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)},
                            status=status.HTTP_400_BAD_REQUEST)
