from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.http import HttpResponse
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.common.permissions import is_admin, require_admin
from apps.common.responses import envelope, error
from apps.common.xlsx import build_xlsx
from apps.authn.models import User
from apps.catalog.models import Product
from apps.coupons.models import CouponUsage
from apps.coupons.services import (
    CouponError,
    apply_coupon,
    cancel_coupon_usage,
    complete_coupon_usage,
)

from .invoice import build_invoice_pdf
from .services import (
    ORDER_STATUSES,
    STATUS_CANCELLED,
    STATUS_COMPLETED,
    STATUS_LABELS,
    STATUS_REFUNDED,
    apply_date_filter,
    sync_payment_status_for_order,
    validate_customer_transition,
)
from .vnpay import build_payment_url, verify_return_params
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


def _own_order_or_403(request, order):
    """Khách chỉ được thao tác trên đơn của CHÍNH MÌNH; admin/staff được tất cả."""
    if is_admin(request.user):
        return None
    if getattr(request.user, "user_id", None) != order.user_id:
        return error("Bạn không có quyền truy cập đơn hàng này.", status=403)
    return None


def _own_cart_or_403(request, cart):
    """Khách chỉ được thao tác trên giỏ hàng của CHÍNH MÌNH; admin/staff được tất cả."""
    if is_admin(request.user):
        return None
    if getattr(request.user, "user_id", None) != cart.user_id:
        return error("Bạn không có quyền truy cập giỏ hàng này.", status=403)
    return None


def _check_user_scope(request, user_id):
    """Khách chỉ xem dữ liệu của chính mình; admin/staff được tất cả."""
    if is_admin(request.user):
        return None
    if getattr(request.user, "user_id", None) != user_id:
        return error("Bạn không có quyền truy cập dữ liệu của người khác.", status=403)
    return None


class OrderCreateError(Exception):
    """Lỗi khi tạo đơn — dùng exception để transaction.atomic() rollback sạch"""


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_invoice(request, order_id: int):
    """Xuất hoá đơn PDF của một đơn hàng (nút "Xuất hoá đơn" ở admin)."""
    order = Order.objects.filter(order_id=order_id).first()
    if not order:
        return error("Không tìm thấy đơn hàng.", status=404)
    denied = _own_order_or_403(request, order)
    if denied:
        return denied

    order_items = list(OrderItem.objects.filter(order_id=order.order_id))
    product_names = {
        product.product_id: product.name
        for product in Product.objects.filter(
            product_id__in=[item.product_id for item in order_items]
        )
    }
    items = [
        {
            "name": product_names.get(item.product_id, f"Sản phẩm #{item.product_id}"),
            "quantity": item.quantity,
            "unit_price": item.unit_price,
        }
        for item in order_items
    ]
    customer = User.objects.filter(user_id=order.user_id).first()

    try:
        pdf_bytes = build_invoice_pdf(order, items, customer)
    except Exception as exc:  # pragma: no cover - tránh 500 trần cho admin
        return error(f"Không tạo được hoá đơn: {exc}", status=500)

    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    # inline: mở xem trước trên trình duyệt
    response["Content-Disposition"] = f'inline; filename="hoa-don-{order.order_id}.pdf"'
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reports_export(request):
    """Xuất báo cáo thống kê ra Excel (.xlsx) — sinh file trực tiếp, KHÔNG cần thư viện ngoài.

    `type`: revenue (mặc định) | top-products | inventory | orders-status
    `from`, `to`: lọc theo ngày đặt hàng (YYYY-MM-DD), dùng cho 2 báo cáo đầu.
    """
    denied = require_admin(request.user, request)
    if denied:
        return denied

    report_type = request.query_params.get("type", "revenue")
    date_from = request.query_params.get("from") or None
    date_to = request.query_params.get("to") or None

    orders = Order.objects.all()
    try:
        orders = apply_date_filter(orders, date_from, date_to)
    except ValueError:
        return error("Ngày lọc không hợp lệ — cần định dạng YYYY-MM-DD.", status=400)

    if report_type == "top-products":
        title = "Thống kê sản phẩm bán chạy"
        headers = ["Mã sản phẩm", "Tên sản phẩm", "Số lượng bán", "Doanh thu"]
        order_ids = list(orders.values_list("order_id", flat=True))
        agg = {}
        for item in OrderItem.objects.filter(order_id__in=order_ids).values(
            "product_id", "quantity", "unit_price"
        ):
            entry = agg.setdefault(item["product_id"], {"sold": 0, "revenue": Decimal("0")})
            entry["sold"] += item["quantity"]
            entry["revenue"] += item["unit_price"] * item["quantity"]
        product_names = dict(
            Product.objects.filter(product_id__in=list(agg.keys())).values_list("product_id", "name")
        )
        rows = [
            [product_id, product_names.get(product_id, f"Sản phẩm #{product_id}"), value["sold"], float(value["revenue"])]
            for product_id, value in sorted(agg.items(), key=lambda kv: -kv[1]["sold"])
        ]

    elif report_type == "inventory":
        title = "Thống kê tồn kho"
        headers = ["Mã sản phẩm", "Tên sản phẩm", "Tồn kho"]
        inventories = list(Inventory.objects.order_by("product_id"))
        product_names = dict(
            Product.objects.filter(
                product_id__in=[row.product_id for row in inventories]
            ).values_list("product_id", "name")
        )
        rows = [
            [row.product_id, product_names.get(row.product_id, ""), row.total_quantity]
            for row in inventories
        ]

    elif report_type == "orders-status":
        title = "Thống kê đơn hàng theo trạng thái"
        headers = ["Trạng thái", "Số đơn", "Tổng giá trị"]
        agg = {}
        for order in orders.values("status", "total_amount"):
            entry = agg.setdefault(order["status"], {"count": 0, "total": Decimal("0")})
            entry["count"] += 1
            entry["total"] += order["total_amount"] or Decimal("0")
        rows = [
            [STATUS_LABELS.get(status, status), value["count"], float(value["total"])]
            for status, value in sorted(agg.items(), key=lambda kv: -kv[1]["count"])
        ]

    else:  # revenue
        title = "Thống kê doanh thu theo thời gian"
        headers = ["Ngày", "Số đơn", "Doanh thu"]
        agg = {}
        for order in orders.values("created_at", "total_amount"):
            day = timezone.localtime(order["created_at"]).date().isoformat() if order["created_at"] else "Chưa rõ"
            entry = agg.setdefault(day, {"count": 0, "total": Decimal("0")})
            entry["count"] += 1
            entry["total"] += order["total_amount"] or Decimal("0")
        rows = [
            [day, value["count"], float(value["total"])]
            for day, value in sorted(agg.items())
        ]

    content = build_xlsx(title, headers, rows)
    response = HttpResponse(
        content,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    # attachment: trình duyệt tải file về thay vì mở
    response["Content-Disposition"] = f'attachment; filename="{report_type}.xlsx"'
    return response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def vnpay_create_url(request):
    """Tạo URL thanh toán VNPay cho một đơn hàng (storefront gọi rồi redirect sang VNPay)."""
    order_id = request.data.get("orderId")
    order = Order.objects.filter(order_id=order_id).first() if order_id else None
    if not order:
        return error("Không tìm thấy đơn hàng.", status=404)
    denied = _own_order_or_403(request, order)
    if denied:
        return denied

    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    ip_address = forwarded_for.split(",")[0].strip() or request.META.get("REMOTE_ADDR", "127.0.0.1")

    try:
        payment_url = build_payment_url(
            order_id=order.order_id,
            amount=order.total_amount,
            order_info=f"Thanh toan don hang {order.order_id}",
            ip_address=ip_address,
            bank_code=request.data.get("bankCode"),
        )
    except ValueError as exc:
        return error(str(exc), status=503)

    return envelope({"provider": "vnpay", "paymentUrl": payment_url})


@api_view(["GET"])
@permission_classes([AllowAny])
def vnpay_return(request):
    """VNPay redirect về đây sau khi khách thanh toán (đặt làm `vnp_ReturnUrl`)."""
    params = request.query_params.dict()

    if not verify_return_params(params):
        return redirect(f"{settings.FRONTEND_BASE_URL}/payment/result?status=invalid-signature")

    order_id = params.get("vnp_TxnRef")
    response_code = params.get("vnp_ResponseCode")
    is_success = response_code == "00"
    order = Order.objects.filter(order_id=order_id).first() if order_id else None

    if order and is_success:
        with transaction.atomic():
            payment = Payment.objects.create(
                order_id=order.order_id,
                payment_method="vnpay",
                payment_status="completed",
                amount=order.total_amount,
            )
            order.payment_id = payment.payment_id
            order.status = "paid"
            order.save(update_fields=["payment_id", "status"])
            # Đơn chuyển sang đã thanh toán → đồng bộ trạng thái giao dịch
            sync_payment_status_for_order(order)

    status = "success" if is_success else "failed"
    return redirect(f"{settings.FRONTEND_BASE_URL}/payment/result?status={status}&orderId={order_id or ''}")


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def carts(request):
    if request.method == "GET":
        # Admin xem tất cả; khách chỉ xem giỏ của chính mình
        queryset = (
            Cart.objects.all()
            if is_admin(request.user)
            else Cart.objects.filter(user_id=request.user.user_id)
        )
        return envelope(CartSerializer(queryset, many=True).data)
    payload = dict(request.data)
    if not is_admin(request.user):
        payload["userId"] = request.user.user_id  # khách chỉ tạo giỏ cho chính mình
    serializer = CartSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data, status=201)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def cart_detail(request, cart_id: int):
    cart = Cart.objects.filter(cart_id=cart_id).first()
    if not cart:
        return error("Cart not found", status=404)
    denied = _own_cart_or_403(request, cart)
    if denied:
        return denied
    if request.method == "GET":
        return envelope(CartSerializer(cart).data)
    cart.status = request.data.get("status", cart.status)
    cart.save(update_fields=["status"])
    return envelope(CartSerializer(cart).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def active_cart_by_user(request, user_id: int):
    denied = _check_user_scope(request, user_id)
    if denied:
        return denied
    cart = Cart.objects.filter(user_id=user_id, status="active").order_by("-cart_id").first()
    if not cart:
        return error("Active cart not found", status=404)
    return envelope(CartSerializer(cart).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def carts_history(request, user_id: int):
    denied = _check_user_scope(request, user_id)
    if denied:
        return denied
    carts_qs = Cart.objects.filter(user_id=user_id).exclude(status="active").order_by("-cart_id")
    return envelope(CartSerializer(carts_qs, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def cart_items(request, cart_id: int):
    cart = Cart.objects.filter(cart_id=cart_id).first()
    if not cart:
        return error("Cart not found", status=404)
    denied = _own_cart_or_403(request, cart)
    if denied:
        return denied
    if request.method == "GET":
        items = CartItem.objects.filter(cart_id=cart_id).order_by("cart_item_id")
        return envelope(CartItemSerializer(items, many=True).data)
    payload = dict(request.data)
    payload["cartId"] = cart_id
    # Lấy giá từ DB — không tin FE
    try:
        product = Product.objects.get(product_id=payload["productId"])
    except Product.DoesNotExist:
        return error("Sản phẩm không tồn tại.", status=404)
    payload["unitPrice"] = float(product.price)
    serializer = CartItemSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    serializer.save(cart_id=cart_id)
    return envelope(serializer.data, status=201)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def cart_item_detail(request, cart_id: int, cart_item_id: int):
    cart = Cart.objects.filter(cart_id=cart_id).first()
    if not cart:
        return error("Cart not found", status=404)
    denied = _own_cart_or_403(request, cart)
    if denied:
        return denied
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
        date_from = request.query_params.get("from") or None
        date_to = request.query_params.get("to") or None
        if not is_admin(request.user):
            # Khách chỉ được xem đơn của CHÍNH MÌNH — không xem được toàn bộ đơn
            if not user_id or int(user_id) != request.user.user_id:
                return error("Bạn không có quyền xem đơn hàng của người khác.", status=403)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        try:
            queryset = apply_date_filter(queryset, date_from, date_to)
        except ValueError:
            return error("Ngày lọc không hợp lệ — cần định dạng YYYY-MM-DD.", status=400)
        return envelope(OrderSerializer(queryset, many=True).data)

    payload = request.data
    items = payload.get("items", [])
    if not items:
        return error("Order must include at least one item", status=400)

    user_id = payload.get("userId")
    if user_id is None:
        return error("Thiếu userId.", status=400)
    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return error("Người dùng không tồn tại.", status=400)

    coupon_code = (payload.get("couponCode") or "").strip() or None

    try:
        with transaction.atomic():
            # 1. Đọc sản phẩm từ DB → tính tổng tiền GỐC (không tin FE gửi giá)
            lines = []
            subtotal = Decimal("0")
            for item in items:
                try:
                    product = Product.objects.get(product_id=item["productId"])
                except Product.DoesNotExist:
                    raise OrderCreateError(f"Sản phẩm #{item['productId']} không tồn tại.")
                quantity = int(item.get("quantity", 1))
                if quantity <= 0:
                    raise OrderCreateError("Số lượng sản phẩm không hợp lệ.")
                unit_price = Decimal(product.price)
                subtotal += unit_price * quantity
                lines.append((product, quantity, unit_price))

            # 2. Áp mã giảm giá (nếu có)
            #    apply_coupon khóa dòng coupon (select_for_update) → chống vượt limit khi 2 đơn cùng lúc
            coupon = None
            discount = Decimal("0")
            if coupon_code:
                coupon, discount = apply_coupon(user, coupon_code, subtotal)

            # 3. Tạo order — lưu snapshot: total = gốc - giảm, discount_amount, coupon_id
            order = Order.objects.create(
                user_id=user_id,
                status="pending",
                total_amount=subtotal - discount,
                discount_amount=discount,
                coupon_id=coupon.id if coupon else None,
            )

            for product, quantity, unit_price in lines:
                OrderItem.objects.create(
                    order_id=order.order_id,
                    product_id=product.product_id,
                    quantity=quantity,
                    unit_price=unit_price,
                )

            # 4. Ghi nhận lượt dùng mã (reserved) + tăng used_count — cùng transaction với đơn
            if coupon:
                coupon.used_count += 1
                coupon.save(update_fields=["used_count"])
                CouponUsage.objects.create(
                    coupon_id=coupon.id,
                    user_id=user_id,
                    order_id=order.order_id,
                    status="reserved",
                )
    except OrderCreateError as exc:
        return error(str(exc), status=400)
    except CouponError as exc:
        # Ném ra từ apply_coupon → atomic() tự rollback, không sót đơn/usage dở dang
        return error(str(exc), status=exc.status)

    return envelope(OrderSerializer(Order.objects.get(order_id=order.order_id)).data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id: int):
    order = Order.objects.filter(order_id=order_id).first()
    if not order:
        return error("Order not found", status=404)
    denied = _own_order_or_403(request, order)
    if denied:
        return denied
    return envelope(OrderSerializer(order).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def order_status(request, order_id: int):
    order = Order.objects.filter(order_id=order_id).first()
    if not order:
        return error("Order not found", status=404)

    new_status = request.data.get("status", order.status)
    if new_status == order.status:
        return envelope(OrderSerializer(order).data)

    if new_status not in ORDER_STATUSES:
        return error(f"Trạng thái '{new_status}' không hợp lệ.", status=400)

    # ── Phân quyền ──
    # Admin/staff: đổi mọi trạng thái (linh hoạt cho vận hành).
    # Khách: chỉ đơn của CHÍNH MÌNH, và chỉ được HUỶ (đơn chưa thanh toán)
    # hoặc YÊU CẦU HOÀN TIỀN (đơn đã thanh toán, hàng chưa gửi).
    requester = getattr(request, "user", None)
    if not is_admin(requester):
        if getattr(requester, "user_id", None) != order.user_id:
            return error("Bạn không có quyền thay đổi đơn hàng này.", status=403)
        allowed, message = validate_customer_transition(order, new_status)
        if not allowed:
            return error(message, status=400)

    with transaction.atomic():
        order.status = new_status
        order.save(update_fields=["status"])

        # Giữ `payments.payment_status` khớp trạng thái đơn:
        # đơn đã thu tiền → `completed`; đơn hoàn tiền → `refunded`
        sync_payment_status_for_order(order)

        # Đồng bộ vòng đời lượt dùng coupon khi đơn có dùng mã
        if order.coupon_id:
            if new_status == STATUS_COMPLETED:
                complete_coupon_usage(order.order_id, order.coupon_id)
            elif new_status in (STATUS_CANCELLED, STATUS_REFUNDED):
                user = User.objects.filter(user_id=order.user_id).first()
                if user:
                    cancel_coupon_usage(user, order.coupon_id, order.order_id)

    return envelope(OrderSerializer(Order.objects.get(order_id=order.order_id)).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def order_payment(request, order_id: int):
    order = Order.objects.filter(order_id=order_id).first()
    if not order:
        return error("Order not found", status=404)
    denied = _own_order_or_403(request, order)
    if denied:
        return denied
    order.payment_id = request.data.get("paymentId")
    order.save(update_fields=["payment_id"])
    # Gắn giao dịch vào đơn đã thanh toán → giao dịch đó cũng phải là `completed`
    sync_payment_status_for_order(order)
    return envelope(OrderSerializer(order).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def order_items(request, order_id: int):
    denied = require_admin(request.user, request)
    if denied:
        return denied
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
    denied = require_admin(request.user, request)
    if denied:
        return denied
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
    denied = require_admin(request.user, request)
    if denied:
        return denied
    if request.method == "GET":
        queryset = Payment.objects.all().order_by("-payment_id")
        # Lọc theo ngày giao dịch (`payments.payment_date`) — admin chọn khoảng ngày ở trang Thanh toán
        try:
            queryset = apply_date_filter(
                queryset,
                request.query_params.get("from") or None,
                request.query_params.get("to") or None,
            )
        except ValueError:
            return error("Ngày lọc không hợp lệ — cần định dạng YYYY-MM-DD.", status=400)
        return envelope(PaymentSerializer(queryset, many=True).data)
    serializer = PaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data, status=201)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def payment_detail(request, payment_id: int):
    denied = require_admin(request.user, request)
    if denied:
        return denied
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
    denied = require_admin(_request.user, _request)
    if denied:
        return denied
    queryset = Payment.objects.filter(order_id=order_id).order_by("-payment_id")
    return envelope(PaymentSerializer(queryset, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_payment_url(request):
    """Tạo URL thanh toán.

    - `provider = "vnpay"` + đã cấu hình VNPay → trả URL cổng VNPay thật.
    - Ngược lại → giữ luồng mô phỏng cũ (an toàn khi chưa có tài khoản sandbox).
    """
    payment_id = request.data.get("paymentId")
    order_id = request.data.get("orderId")
    return_url = request.data.get("returnUrl")
    provider = str(request.data.get("provider") or "mock").lower()

    if provider == "vnpay" and order_id:
        order = Order.objects.filter(order_id=order_id).first()
        if not order:
            return error("Không tìm thấy đơn hàng.", status=404)
        denied = _own_order_or_403(request, order)
        if denied:
            return denied

        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
        ip_address = forwarded_for.split(",")[0].strip() or request.META.get("REMOTE_ADDR", "127.0.0.1")
        try:
            vnpay_url = build_payment_url(
                order_id=order.order_id,
                amount=order.total_amount,
                order_info=f"Thanh toan don hang {order.order_id}",
                ip_address=ip_address,
                bank_code=request.data.get("bankCode"),
            )
            return envelope({"provider": "vnpay", "paymentUrl": vnpay_url})
        except ValueError:
            # Chưa cấu hình VNPay → rơi xuống luồng mô phỏng bên dưới
            pass

    payment_url = f"{return_url}?paymentId={payment_id}&status=success"
    return envelope({"paymentUrl": payment_url, "transactionId": f"tx-{payment_id}"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory(request):
    denied = require_admin(request.user, request)
    if denied:
        return denied
    queryset = Inventory.objects.all().order_by("-inventory_id")
    return envelope(InventorySerializer(queryset, many=True).data)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def inventory_detail(request, product_id: int):
    denied = require_admin(request.user, request)
    if denied:
        return denied
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
    denied = require_admin(request.user, request)
    if denied:
        return denied
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
    denied = require_admin(_request.user, _request)
    if denied:
        return denied
    tx = InventoryTransaction.objects.filter(transaction_id=transaction_id).first()
    if not tx:
        return error("Transaction not found", status=404)
    return envelope(InventoryTransactionSerializer(tx).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def inventory_transactions_bulk(request):
    denied = require_admin(request.user, request)
    if denied:
        return denied
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
def reports(request):
    """Báo cáo doanh thu. Hỗ trợ lọc `from`/`to` (ngày đặt) và `paymentStatus`."""
    denied = require_admin(request.user, request)
    if denied:
        return denied

    date_from = request.query_params.get("from") or None
    date_to = request.query_params.get("to") or None
    payment_filter = request.query_params.get("paymentStatus") or None

    orders_qs = Order.objects.all()
    try:
        orders_qs = apply_date_filter(orders_qs, date_from, date_to)
    except ValueError:
        return error("Ngày lọc không hợp lệ — cần định dạng YYYY-MM-DD.", status=400)

    orders = list(
        orders_qs.values("order_id", "user_id", "total_amount", "status", "created_at").order_by(
            "-created_at", "-order_id"
        )
    )
    order_ids = [order["order_id"] for order in orders]
    user_ids = [order["user_id"] for order in orders]

    item_totals = {
        item["order_id"]: item["total_items"] or 0
        for item in OrderItem.objects.filter(order_id__in=order_ids).values("order_id").annotate(total_items=Sum("quantity"))
    }
    # Lấy trạng thái thanh toán MỚI NHẤT của mỗi đơn (payment_id lớn nhất) — setdefault = giữ cái đầu tiên.
    payment_statuses = {}
    for payment in Payment.objects.filter(order_id__in=order_ids).order_by("order_id", "-payment_id"):
        payment_statuses.setdefault(payment.order_id, payment.payment_status)
    users = {
        user.user_id: user.full_name or user.username
        for user in User.objects.filter(user_id__in=user_ids)
    }

    records = [
        {
            "orderId": order["order_id"],
            "customerName": users.get(order["user_id"], f"User #{order['user_id']}"),
            "orderDate": timezone.localtime(order["created_at"]).isoformat() if order["created_at"] else "",
            "orderStatus": order["status"],
            "totalOrderValue": float(order["total_amount"] or 0),
            "totalItems": int(item_totals.get(order["order_id"], 0)),
            "paymentStatus": payment_statuses.get(order["order_id"]),
        }
        for order in orders
    ]

    # Lọc theo trạng thái thanh toán (nếu có)
    if payment_filter == "unpaid":
        records = [record for record in records if not record["paymentStatus"]]
    elif payment_filter:
        records = [record for record in records if record["paymentStatus"] == payment_filter]

    return envelope(records)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_items_list(request):
    """Toàn bộ dòng đơn hàng (admin) — dùng cho báo cáo "Top sản phẩm bán chạy"."""
    denied = require_admin(request.user, request)
    if denied:
        return denied
    items = OrderItem.objects.order_by("-order_item_id")
    return envelope(OrderItemSerializer(items, many=True).data)
