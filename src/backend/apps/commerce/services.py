"""Luật nghiệp vụ đơn hàng — MỘT nguồn sự thật duy nhất cho cả backend lẫn frontend.

Vòng đời đơn hàng của dự án:

    pending ──(thanh toán)──> paid ──> shipped ──> in_transit ──> completed
       │                        │
       │ (khách tự huỷ)         │ (khách yêu cầu hoàn tiền)
       └──> cancelled           └──> refund_requested ──(admin xác nhận)──> refunded

Quy ước nghiệp vụ:
- `pending`          : đơn vừa đặt, CHƯA thanh toán và CHƯA gửi hàng → khách được tự huỷ.
- `paid`             : đã thanh toán → KHÔNG huỷ được nữa, chỉ được YÊU CẦU HOÀN TIỀN.
- `refund_requested` : khách đã gửi yêu cầu hoàn tiền, chờ cửa hàng xử lý.
- `shipped`          : đã xác nhận & giao cho vận chuyển → KHÔNG huỷ được, nhưng ĐƯỢC yêu cầu hoàn hàng.
- `in_transit`       : đang trên đường giao (giá trị có sẵn trong ENUM của DB) → KHÔNG huỷ được, ĐƯỢC yêu cầu hoàn hàng.
- `completed`        : đã giao thành công → KHÔNG huỷ được, ĐƯỢC yêu cầu hoàn hàng (trả hàng sau khi nhận).
- `cancelled`        : đã huỷ trước khi thanh toán → kết thúc.
- `refunded`         : đã hoàn tiền xong → kết thúc.
- `returned`         : đã trả hàng/hoàn trả (giá trị có sẵn trong ENUM của DB) → kết thúc.

⚠ Cột `orders.status` trong DB là ENUM (không phải varchar như khai báo model),
  nên muốn thêm trạng thái mới phải ALTER TABLE — xem DTB/migration_add_order_refund_status.sql.
"""

from datetime import datetime

from django.utils import timezone

STATUS_PENDING = "pending"
STATUS_PAID = "paid"
STATUS_REFUND_REQUESTED = "refund_requested"
STATUS_SHIPPED = "shipped"
STATUS_COMPLETED = "completed"
STATUS_CANCELLED = "cancelled"
STATUS_REFUNDED = "refunded"
STATUS_IN_TRANSIT = "in_transit"
STATUS_RETURNED = "returned"

#: Mọi trạng thái hợp lệ của `orders.status` (đúng theo ENUM trong MySQL)
ORDER_STATUSES = (
    STATUS_PENDING,
    STATUS_PAID,
    STATUS_REFUND_REQUESTED,
    STATUS_SHIPPED,
    STATUS_IN_TRANSIT,
    STATUS_COMPLETED,
    STATUS_CANCELLED,
    STATUS_REFUNDED,
    STATUS_RETURNED,
)

#: Nhãn hiển thị tiếng Việt (dùng cho cả API và FE)
STATUS_LABELS = {
    STATUS_PENDING: "Chờ xử lý",
    STATUS_PAID: "Đã thanh toán",
    STATUS_REFUND_REQUESTED: "Chờ hoàn tiền",
    STATUS_SHIPPED: "Đã gửi hàng",
    STATUS_IN_TRANSIT: "Đang vận chuyển",
    STATUS_COMPLETED: "Hoàn tất",
    STATUS_CANCELLED: "Đã huỷ",
    STATUS_REFUNDED: "Đã hoàn tiền",
    STATUS_RETURNED: "Đã trả hàng",
}

#: Trạng thái kết thúc vòng đời — không phát sinh thao tác tiếp theo
TERMINAL_STATUSES = (STATUS_COMPLETED, STATUS_CANCELLED, STATUS_REFUNDED, STATUS_RETURNED)

#: Trạng thái của bảng `payments`
PAYMENT_STATUS_PENDING = "pending"
PAYMENT_STATUS_COMPLETED = "completed"
PAYMENT_STATUS_FAILED = "failed"
PAYMENT_STATUS_REFUNDED = "refunded"

#: Trạng thái ĐƠN ⇒ trạng thái THANH TOÁN tương ứng.
#: Đơn đã thu được tiền (paid/shipped/in_transit/completed/returned) thì giao dịch PHẢI là
#: `completed` — nếu không, trang Thanh toán & báo cáo sẽ hiện "Chờ xử lý" dù đơn đã thanh toán.
#: Đơn `pending`/`cancelled` không nằm trong bảng này → giữ nguyên `pending` (chưa thu tiền).
PAYMENT_STATUS_BY_ORDER_STATUS = {
    STATUS_PAID: PAYMENT_STATUS_COMPLETED,
    STATUS_SHIPPED: PAYMENT_STATUS_COMPLETED,
    STATUS_IN_TRANSIT: PAYMENT_STATUS_COMPLETED,
    STATUS_COMPLETED: PAYMENT_STATUS_COMPLETED,
    STATUS_RETURNED: PAYMENT_STATUS_COMPLETED,
    STATUS_REFUNDED: PAYMENT_STATUS_REFUNDED,
}

# ── Luật dành cho KHÁCH HÀNG ──

#: Chỉ được TỰ HUỶ khi đơn CHƯA thanh toán (đồng nghĩa hàng chưa được gửi đi)
CUSTOMER_CANCELLABLE_STATUSES = (STATUS_PENDING,)

#: Được YÊU CẦU HOÀN HÀNG khi: đã thanh toán, đã gửi hàng, đang vận chuyển hoặc đã nhận hàng
CUSTOMER_REFUNDABLE_STATUSES = (STATUS_PAID, STATUS_SHIPPED, STATUS_IN_TRANSIT, STATUS_COMPLETED)

#: Lý do không huỷ được (theo trạng thái) — trả về FE để hiển thị thay vì đoán mò
CANCEL_BLOCK_REASONS = {
    STATUS_PAID: "Đơn đã thanh toán nên không thể huỷ — bạn có thể gửi yêu cầu hoàn tiền.",
    STATUS_REFUND_REQUESTED: "Đơn đang chờ cửa hàng xử lý hoàn tiền nên không thể huỷ.",
    STATUS_SHIPPED: "Đơn đã gửi đi nên không thể huỷ — bạn có thể gửi yêu cầu hoàn hàng.",
    STATUS_IN_TRANSIT: "Đơn đang vận chuyển nên không thể huỷ — bạn có thể gửi yêu cầu hoàn hàng.",
    STATUS_COMPLETED: "Đơn đã giao thành công nên không thể huỷ — bạn có thể gửi yêu cầu hoàn hàng.",
    STATUS_CANCELLED: "Đơn đã được huỷ trước đó.",
    STATUS_REFUNDED: "Đơn đã được hoàn tiền nên không thể huỷ.",
    STATUS_RETURNED: "Đơn đã trả hàng nên không thể huỷ.",
}

#: Lý do không yêu cầu hoàn tiền được (theo trạng thái)
REFUND_BLOCK_REASONS = {
    STATUS_PENDING: "Đơn chưa thanh toán — bạn có thể tự huỷ đơn.",
    STATUS_REFUND_REQUESTED: "Bạn đã gửi yêu cầu hoàn hàng, vui lòng chờ cửa hàng xử lý.",
    STATUS_CANCELLED: "Đơn đã bị huỷ.",
    STATUS_REFUNDED: "Đơn đã được hoàn tiền.",
    STATUS_RETURNED: "Đơn đã được trả hàng.",
}


def evaluate_customer_actions(order) -> dict:
    """Khách được làm gì với đơn này?

    Backend dùng để chặn thao tác sai, serializer trả về FE để FE hiện/ẩn nút
    và hiển thị đúng lý do — tránh việc FE tự đoán luật rồi lệch với backend.
    """
    status = order.status
    can_cancel = status in CUSTOMER_CANCELLABLE_STATUSES
    can_refund = status in CUSTOMER_REFUNDABLE_STATUSES

    return {
        "canCancel": can_cancel,
        "cancelBlockedReason": None
        if can_cancel
        else CANCEL_BLOCK_REASONS.get(status, "Không thể huỷ đơn hàng này."),
        "canRequestRefund": can_refund,
        "refundBlockedReason": None
        if can_refund
        else REFUND_BLOCK_REASONS.get(status, "Không thể yêu cầu hoàn tiền cho đơn này."),
    }


def validate_customer_transition(order, new_status: str):
    """Khách có được đổi đơn sang `new_status` không? → (ok, message lỗi)."""
    if new_status == STATUS_CANCELLED:
        if order.status in CUSTOMER_CANCELLABLE_STATUSES:
            return True, ""
        return False, CANCEL_BLOCK_REASONS.get(order.status, "Không thể huỷ đơn hàng này.")

    if new_status == STATUS_REFUND_REQUESTED:
        if order.status in CUSTOMER_REFUNDABLE_STATUSES:
            return True, ""
        return False, REFUND_BLOCK_REASONS.get(order.status, "Không thể yêu cầu hoàn tiền cho đơn này.")

    return False, "Bạn chỉ có thể huỷ đơn hoặc yêu cầu hoàn tiền cho đơn của mình."


def apply_date_filter(queryset, date_from: str | None = None, date_to: str | None = None):
    """Lọc queryset theo KHOẢNG NGÀY (`YYYY-MM-DD`) trên cột `created_at`.

    Dùng chung cho /api/orders, /api/payments, /api/reports... → một nguồn sự thật,
    admin chọn ngày ở đâu cũng cho ra cùng kết quả.

    ⚠ Bắt buộc so sánh bằng datetime CÓ múi giờ — KHÔNG dùng `created_at__date`:
    MySQL của dự án thiếu bảng timezone nên `CONVERT_TZ()` trả NULL → lọc ra 0 dòng
    (lỗi này từng làm /api/reports luôn rỗng dù có dữ liệu).

    ⚠ Ném `ValueError` nếu ngày sai định dạng → view bắt lại và trả 400 cho FE.
    """
    if date_from:
        queryset = queryset.filter(
            created_at__gte=timezone.make_aware(datetime.fromisoformat(f"{date_from} 00:00:00"))
        )
    if date_to:
        queryset = queryset.filter(
            created_at__lte=timezone.make_aware(datetime.fromisoformat(f"{date_to} 23:59:59"))
        )
    return queryset


def payment_status_for_order_status(order_status: str):
    """Trạng thái thanh toán phải có, ứng với trạng thái đơn. Không có luật → None (giữ nguyên)."""
    return PAYMENT_STATUS_BY_ORDER_STATUS.get(order_status)


def sync_payment_status_for_order(order) -> int:
    """Đồng bộ `payments.payment_status` theo trạng thái đơn hàng.

    Gọi ở MỌI chỗ đổi trạng thái đơn (admin đổi trạng thái, VNPay trả về, gắn payment...)
    để cột "Trạng thái" và "Trạng thái đơn hàng" trên admin không bao giờ lệch nhau.

    - Chỉ sửa khi lệch (`exclude(payment_status=target)`).
    - Nếu đơn đã trỏ tới 1 giao dịch cụ thể thì chỉ đồng bộ đúng giao dịch đó; nếu chưa trỏ
      thì đồng bộ mọi giao dịch của đơn (dữ liệu cũ thường chưa gắn `payment_id`).

    Trả về số bản ghi đã cập nhật.
    """
    target = payment_status_for_order_status(order.status)
    if not target:
        return 0

    from .models import Payment  # import tại chỗ để tránh vòng lặp import khi Django nạp app

    queryset = Payment.objects.filter(order_id=order.order_id)
    if order.payment_id:
        queryset = queryset.filter(payment_id=order.payment_id)
    return queryset.exclude(payment_status=target).update(payment_status=target)
