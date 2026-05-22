from rest_framework import serializers

from .models import Cart, CartItem, Inventory, InventoryTransaction, Order, OrderItem, Payment


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

    def get_productName(self, _obj):
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="order_item_id", read_only=True)
    productId = serializers.IntegerField(source="product_id")
    unitPrice = serializers.DecimalField(source="unit_price", max_digits=12, decimal_places=2)
    subtotal = serializers.SerializerMethodField()
    productName = serializers.SerializerMethodField()
    productStatus = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "productId", "productName", "productStatus", "quantity", "unitPrice", "subtotal"]

    def get_subtotal(self, obj):
        return float(obj.quantity) * float(obj.unit_price)

    def get_productName(self, _obj):
        return None

    def get_productStatus(self, _obj):
        return None


class OrderSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="order_id", read_only=True)
    userId = serializers.IntegerField(source="user_id")
    userName = serializers.SerializerMethodField()
    totalAmount = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2)
    paymentId = serializers.IntegerField(source="payment_id", allow_null=True, required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="created_at", read_only=True)
    note = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "userId",
            "userName",
            "status",
            "totalAmount",
            "paymentId",
            "note",
            "items",
            "createdAt",
            "updatedAt",
        ]

    def get_userName(self, _obj):
        return None

    def get_note(self, _obj):
        return None

    def get_items(self, obj):
        items = OrderItem.objects.filter(order_id=obj.order_id)
        return OrderItemSerializer(items, many=True).data


class PaymentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="payment_id", read_only=True)
    orderId = serializers.IntegerField(source="order_id")
    method = serializers.CharField(source="payment_method")
    status = serializers.CharField(source="payment_status")
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
    totalQuantity = serializers.IntegerField(source="total_quantity")
    createdAt = serializers.DateTimeField(source="updated_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Inventory
        fields = ["id", "productId", "totalQuantity", "createdAt", "updatedAt"]


class InventoryTransactionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="transaction_id", read_only=True)
    productId = serializers.IntegerField(source="product_id")
    userId = serializers.IntegerField(source="user_id", allow_null=True, required=False)
    quantityChange = serializers.IntegerField(source="quantity_change")
    transactionType = serializers.CharField(source="transaction_type")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = [
            "id",
            "productId",
            "userId",
            "quantityChange",
            "transactionType",
            "note",
            "createdAt",
            "updatedAt",
        ]
