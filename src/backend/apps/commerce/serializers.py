from rest_framework import serializers

from apps.authn.models import User
from apps.catalog.models import Product
from apps.coupons.models import Coupon
from .models import Cart, CartItem, Inventory, InventoryTransaction, Order, OrderItem, Payment
from .services import STATUS_LABELS, evaluate_customer_actions


# ── Helper tra tên dùng chung ──
# Cache trong context của serializer → serialize danh sách N dòng chỉ tốn N query, không N×2.


def _lookup_product_name(serializer, product_id):
    """Tên sản phẩm theo product_id (admin cần tên, không chỉ mã số)."""
    cache = serializer.context.setdefault("_product_names", {})
    if product_id not in cache:
        product = Product.objects.filter(product_id=product_id).only("name").first()
        cache[product_id] = product.name if product else None
    return cache[product_id]


def _lookup_user_name(serializer, user_id):
    """Tên người dùng theo user_id — ưu tiên full_name, không có thì username."""
    cache = serializer.context.setdefault("_user_names", {})
    if user_id not in cache:
        user = User.objects.filter(user_id=user_id).only("full_name", "username").first() if user_id else None
        cache[user_id] = (user.full_name or user.username) if user else None
    return cache[user_id]


class CartSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="cart_id", read_only=True)
    userId = serializers.IntegerField(source="user_id")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "userId", "status", "createdAt", "updatedAt"]


class CartItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="cart_item_id", read_only=True)
    cartId = serializers.IntegerField(source="cart_id")
    productId = serializers.IntegerField(source="product_id")
    unitPrice = serializers.DecimalField(source="unit_price", max_digits=12, decimal_places=2)
    subtotal = serializers.SerializerMethodField()
    productName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "cartId",
            "productId",
            "productName",
            "quantity",
            "unitPrice",
            "subtotal",
            "createdAt",
            "updatedAt",
        ]

    def get_subtotal(self, obj):
        return float(obj.quantity) * float(obj.unit_price)

    def get_productName(self, obj):
        return _lookup_product_name(self, obj.product_id)


class OrderItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="order_item_id", read_only=True)
    orderId = serializers.IntegerField(source="order_id", read_only=True)
    productId = serializers.IntegerField(source="product_id")
    unitPrice = serializers.DecimalField(source="unit_price", max_digits=12, decimal_places=2)
    subtotal = serializers.SerializerMethodField()
    productName = serializers.SerializerMethodField()
    productStatus = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "orderId", "productId", "productName", "productStatus", "quantity", "unitPrice", "subtotal"]

    def get_subtotal(self, obj):
        return float(obj.quantity) * float(obj.unit_price)

    def get_productName(self, obj):
        return _lookup_product_name(self, obj.product_id)

    def get_productStatus(self, obj):
        # Cache trong context → serialize danh sách không bị N+1 query
        cache = self.context.setdefault("_product_statuses", {})
        if obj.product_id not in cache:
            product = Product.objects.filter(product_id=obj.product_id).only("status").first()
            cache[obj.product_id] = product.status if product else None
        return cache[obj.product_id]


class OrderSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="order_id", read_only=True)
    userId = serializers.IntegerField(source="user_id")
    userName = serializers.SerializerMethodField()
    totalAmount = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2)
    discountAmount = serializers.DecimalField(source="discount_amount", max_digits=12, decimal_places=2, default=0)
    couponId = serializers.IntegerField(source="coupon_id", allow_null=True, required=False)
    couponCode = serializers.SerializerMethodField()
    paymentId = serializers.IntegerField(source="payment_id", allow_null=True, required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="created_at", read_only=True)
    note = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    # Luật huỷ/hoàn tiền do BACKEND quyết định → FE chỉ hiển thị theo các cờ này
    statusLabel = serializers.SerializerMethodField()
    canCancel = serializers.SerializerMethodField()
    cancelBlockedReason = serializers.SerializerMethodField()
    canRequestRefund = serializers.SerializerMethodField()
    refundBlockedReason = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "userId",
            "userName",
            "status",
            "statusLabel",
            "canCancel",
            "cancelBlockedReason",
            "canRequestRefund",
            "refundBlockedReason",
            "totalAmount",
            "discountAmount",
            "couponId",
            "couponCode",
            "paymentId",
            "note",
            "items",
            "createdAt",
            "updatedAt",
        ]

    def get_userName(self, obj):
        """Tên khách đặt đơn (admin cần biết ai đặt)."""
        return _lookup_user_name(self, obj.user_id)

    def get_note(self, _obj):
        return None

    def _customer_actions(self, obj):
        """Tính luật 1 lần cho mỗi đơn (tránh 4 getter phải tính lại)."""
        cache = self.context.setdefault("_order_actions", {})
        if obj.order_id not in cache:
            cache[obj.order_id] = evaluate_customer_actions(obj)
        return cache[obj.order_id]

    def get_statusLabel(self, obj):
        return STATUS_LABELS.get(obj.status, obj.status)

    def get_canCancel(self, obj):
        return self._customer_actions(obj)["canCancel"]

    def get_cancelBlockedReason(self, obj):
        return self._customer_actions(obj)["cancelBlockedReason"]

    def get_canRequestRefund(self, obj):
        return self._customer_actions(obj)["canRequestRefund"]

    def get_refundBlockedReason(self, obj):
        return self._customer_actions(obj)["refundBlockedReason"]

    def get_couponCode(self, obj):
        if not obj.coupon_id:
            return None
        coupon = Coupon.objects.filter(id=obj.coupon_id).only("code").first()
        return coupon.code if coupon else None

    def get_items(self, obj):
        items = OrderItem.objects.filter(order_id=obj.order_id)
        return OrderItemSerializer(items, many=True).data


class PaymentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="payment_id", read_only=True)
    orderId = serializers.IntegerField(source="order_id")
    method = serializers.CharField(source="payment_method")
    status = serializers.CharField(source="payment_status", required=False, default="pending")
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    transactionCode = serializers.SerializerMethodField()
    note = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "orderId",
            "method",
            "status",
            "amount",
            "transactionCode",
            "note",
            "createdAt",
            "updatedAt",
        ]

    def get_transactionCode(self, _obj):
        return None

    def get_note(self, _obj):
        return None


class InventorySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="inventory_id", read_only=True)
    productId = serializers.IntegerField(source="product_id")
    productName = serializers.SerializerMethodField()
    totalQuantity = serializers.IntegerField(source="total_quantity")
    # `lastUpdated` là tên field admin đang dùng cho cột "Cập nhật cuối"
    lastUpdated = serializers.DateTimeField(source="updated_at", read_only=True)
    createdAt = serializers.DateTimeField(source="updated_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Inventory
        fields = [
            "id",
            "productId",
            "productName",
            "totalQuantity",
            "lastUpdated",
            "createdAt",
            "updatedAt",
        ]

    def get_productName(self, obj):
        """Tra tên sản phẩm theo product_id."""
        return _lookup_product_name(self, obj.product_id)


class InventoryTransactionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="transaction_id", read_only=True)
    productId = serializers.IntegerField(source="product_id")
    productName = serializers.SerializerMethodField()
    userId = serializers.IntegerField(source="user_id", allow_null=True, required=False)
    userName = serializers.SerializerMethodField()
    quantityChange = serializers.IntegerField(source="quantity_change")
    transactionType = serializers.CharField(source="transaction_type")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = [
            "id",
            "productId",
            "productName",
            "userId",
            "userName",
            "quantityChange",
            "transactionType",
            "note",
            "createdAt",
            "updatedAt",
        ]

    def get_productName(self, obj):
        """Tên sản phẩm — admin hiển thị tên thay vì chỉ mã số."""
        return _lookup_product_name(self, obj.product_id)

    def get_userName(self, obj):
        """Người thực hiện phiếu nhập/xuất (None = hệ thống tự động)."""
        return _lookup_user_name(self, obj.user_id)
