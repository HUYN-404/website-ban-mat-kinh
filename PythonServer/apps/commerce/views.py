from django.db import transaction
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from apps.common.responses import envelope, error
from apps.authn.models import User

from .models import Cart, CartItem, Inventory, InventoryTransaction, Order, OrderItem, Payment
from .serializers import (
    CartItemSerializer,
    CartSerializer,
    InventorySerializer,
    InventoryTransactionSerializer,
    OrderItemSerializer,
    OrderSerializer,
    PaymentSerializer,
)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def carts(request):
    if request.method == "GET":
        return envelope(CartSerializer(Cart.objects.all(), many=True).data)
    serializer = CartSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data, status=201)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def cart_detail(request, cart_id: int):
    cart = Cart.objects.filter(cart_id=cart_id).first()
    if not cart:
        return error("Cart not found", status=404)
    if request.method == "GET":
        return envelope(CartSerializer(cart).data)
    cart.status = request.data.get("status", cart.status)
    cart.save(update_fields=["status"])
    return envelope(CartSerializer(cart).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def active_cart_by_user(_request, user_id: int):
    cart = Cart.objects.filter(user_id=user_id, status="active").order_by("-cart_id").first()
    if not cart:
        return error("Active cart not found", status=404)
    return envelope(CartSerializer(cart).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def carts_history(_request, user_id: int):
    carts_qs = Cart.objects.filter(user_id=user_id).exclude(status="active").order_by("-cart_id")
    return envelope(CartSerializer(carts_qs, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def cart_items(request, cart_id: int):
    if request.method == "GET":
        items = CartItem.objects.filter(cart_id=cart_id).order_by("cart_item_id")
        return envelope(CartItemSerializer(items, many=True).data)
    payload = dict(request.data)
    payload["cartId"] = cart_id
    serializer = CartItemSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    serializer.save(cart_id=cart_id)
    return envelope(serializer.data, status=201)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def cart_item_detail(request, cart_id: int, cart_item_id: int):
    item = CartItem.objects.filter(cart_id=cart_id, cart_item_id=cart_item_id).first()
    if not item:
        return error("Cart item not found", status=404)
    if request.method == "DELETE":
        item.delete()
        return envelope({"success": True})
    item.quantity = request.data.get("quantity", item.quantity)
    item.save(update_fields=["quantity"])
    return envelope(CartItemSerializer(item).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def orders(request):
    if request.method == "GET":
        queryset = Order.objects.all().order_by("-order_id")
        user_id = request.query_params.get("userId")
        status_param = request.query_params.get("status")
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return envelope(OrderSerializer(queryset, many=True).data)

    payload = request.data
    items = payload.get("items", [])
    if not items:
        return error("Order must include at least one item", status=400)

    with transaction.atomic():
        order = Order.objects.create(user_id=payload.get("userId"), status="pending", total_amount=0)
        total_amount = 0.0
        for item in items:
            unit_price = float(item.get("unitPrice", 0))
            quantity = int(item.get("quantity", 1))
            total_amount += unit_price * quantity
            OrderItem.objects.create(
                order_id=order.order_id,
                product_id=item["productId"],
                quantity=quantity,
                unit_price=unit_price,
            )
        order.total_amount = total_amount
        order.save(update_fields=["total_amount"])
    return envelope(OrderSerializer(Order.objects.get(order_id=order.order_id)).data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(_request, order_id: int):
    order = Order.objects.filter(order_id=order_id).first()
    if not order:
        return error("Order not found", status=404)
    return envelope(OrderSerializer(order).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def order_status(request, order_id: int):
    order = Order.objects.filter(order_id=order_id).first()
    if not order:
        return error("Order not found", status=404)
    order.status = request.data.get("status", order.status)
    order.save(update_fields=["status"])
    return envelope(OrderSerializer(order).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def order_payment(request, order_id: int):
    order = Order.objects.filter(order_id=order_id).first()
    if not order:
        return error("Order not found", status=404)
    order.payment_id = request.data.get("paymentId")
    order.save(update_fields=["payment_id"])
    return envelope(OrderSerializer(order).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def order_items(request, order_id: int):
    if request.method == "GET":
        items = OrderItem.objects.filter(order_id=order_id).order_by("order_item_id")
        return envelope(OrderItemSerializer(items, many=True).data)
    payload = dict(request.data)
    payload.setdefault("unitPrice", 0)
    serializer = OrderItemSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    serializer.save(order_id=order_id)
    return envelope(serializer.data, status=201)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def order_item_detail(request, order_id: int, order_item_id: int):
    item = OrderItem.objects.filter(order_id=order_id, order_item_id=order_item_id).first()
    if not item:
        return error("Order item not found", status=404)
    if request.method == "DELETE":
        item.delete()
        return envelope({"success": True})
    if "quantity" in request.data:
        item.quantity = request.data["quantity"]
    if "unitPrice" in request.data:
        item.unit_price = request.data["unitPrice"]
    item.save()
    return envelope(OrderItemSerializer(item).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def payments(request):
    if request.method == "GET":
        queryset = Payment.objects.all().order_by("-payment_id")
        return envelope(PaymentSerializer(queryset, many=True).data)
    serializer = PaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data, status=201)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def payment_detail(request, payment_id: int):
    payment = Payment.objects.filter(payment_id=payment_id).first()
    if not payment:
        return error("Payment not found", status=404)
    if request.method == "GET":
        return envelope(PaymentSerializer(payment).data)
    for key, model_field in (("status", "payment_status"), ("transactionCode", "transaction_code"), ("note", "note")):
        if model_field not in {"payment_status"}:
            continue
        if key in request.data:
            setattr(payment, model_field, request.data[key])
    payment.save()
    return envelope(PaymentSerializer(payment).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payments_by_order(_request, order_id: int):
    queryset = Payment.objects.filter(order_id=order_id).order_by("-payment_id")
    return envelope(PaymentSerializer(queryset, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_payment_url(request):
    payment_id = request.data.get("paymentId")
    return_url = request.data.get("returnUrl")
    payment_url = f"{return_url}?paymentId={payment_id}&status=success"
    return envelope({"paymentUrl": payment_url, "transactionId": f"tx-{payment_id}"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory(request):
    queryset = Inventory.objects.all().order_by("-inventory_id")
    return envelope(InventorySerializer(queryset, many=True).data)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def inventory_detail(request, product_id: int):
    inv = Inventory.objects.filter(product_id=product_id).first()
    if not inv:
        return error("Inventory not found", status=404)
    if request.method == "GET":
        return envelope(InventorySerializer(inv).data)
    inv.total_quantity = request.data.get("totalQuantity", inv.total_quantity)
    inv.save(update_fields=["total_quantity"])
    return envelope(InventorySerializer(inv).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def inventory_transactions(request):
    if request.method == "GET":
        queryset = InventoryTransaction.objects.all().order_by("-transaction_id")
        product_id = request.query_params.get("productId")
        tx_type = request.query_params.get("transactionType")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if tx_type:
            queryset = queryset.filter(transaction_type=tx_type)
        return envelope(InventoryTransactionSerializer(queryset, many=True).data)
    serializer = InventoryTransactionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_transaction_detail(_request, transaction_id: int):
    tx = InventoryTransaction.objects.filter(transaction_id=transaction_id).first()
    if not tx:
        return error("Transaction not found", status=404)
    return envelope(InventoryTransactionSerializer(tx).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def inventory_transactions_bulk(request):
    payload_items = request.data if isinstance(request.data, list) else request.data.get("items", [])
    created = []
    for item in payload_items:
        serializer = InventoryTransactionSerializer(data=item)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        created.append(serializer.data)
    return envelope(created, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reports(_request):
    orders = list(
        Order.objects.values("order_id", "user_id", "total_amount", "created_at").order_by("-created_at", "-order_id")
    )
    order_ids = [order["order_id"] for order in orders]
    user_ids = [order["user_id"] for order in orders]

    item_totals = {
        item["order_id"]: item["total_items"] or 0
        for item in OrderItem.objects.filter(order_id__in=order_ids).values("order_id").annotate(total_items=Sum("quantity"))
    }
    payment_statuses = {
        payment.order_id: payment.payment_status
        for payment in Payment.objects.filter(order_id__in=order_ids).order_by("order_id", "-payment_id")
    }
    users = {
        user.user_id: user.full_name or user.username
        for user in User.objects.filter(user_id__in=user_ids)
    }

    records = [
        {
            "orderId": order["order_id"],
            "customerName": users.get(order["user_id"], f"User #{order['user_id']}"),
            "orderDate": order["created_at"].isoformat() if order["created_at"] else "",
            "totalOrderValue": float(order["total_amount"] or 0),
            "totalItems": int(item_totals.get(order["order_id"], 0)),
            "paymentStatus": payment_statuses.get(order["order_id"]),
        }
        for order in orders
    ]
    return envelope(records)
