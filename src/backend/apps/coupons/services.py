from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from apps.authn.models import User
from apps.commerce.models import Order

from .models import Coupon, CouponUsage


class CouponError(Exception):
    """Lỗi coupon — message hiển thị trực tiếp cho khách hàng"""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def _check_coupon(user, code, lock=False):
    """Kiểm tra mã có hiệu lực với user này không.

    lock=True → dùng select_for_update() khoá dòng coupon (chống race condition
    khi 2 đơn cùng dùng lượt cuối). CHỈ dùng khi sắp ghi (đặt đơn có mã),
    và PHẢI gọi bên trong transaction.

    lock=False → chỉ kiểm tra (validate), không khoá.

    Trả về Coupon; ném CouponError(message) nếu không dùng được.
    """
    if getattr(user, "is_coupon_restricted", False):
        raise CouponError("Tài khoản của bạn đã bị hạn chế sử dụng mã giảm giá.", status=403)

    queryset = Coupon.objects.select_for_update() if lock else Coupon.objects
    try:
        coupon = queryset.get(code=code)
    except Coupon.DoesNotExist:
        raise CouponError("Mã giảm giá không hợp lệ.")

    if not coupon.is_active:
        raise CouponError("Mã giảm giá đã bị vô hiệu hóa.")

    now = timezone.now()
    if coupon.valid_from and now < coupon.valid_from:
        raise CouponError("Mã giảm giá chưa có hiệu lực.")
    if coupon.valid_to and now > coupon.valid_to:
        raise CouponError("Mã giảm giá đã hết hạn.")

    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        raise CouponError("Mã giảm giá đã hết lượt sử dụng.")

    already_used = CouponUsage.objects.filter(
        coupon_id=coupon.id,
        user_id=user.user_id,
        # reserved/consumed = đang/đã dùng; revoked = bị phạt vì lạm dụng → cũng chặn
        status__in=["reserved", "consumed", "revoked"],
    ).exists()
    if already_used:
        raise CouponError("Bạn đã sử dụng mã giảm giá này rồi.")

    return coupon


def compute_discount(coupon, subtotal):
    """Tính tiền giảm dựa trên tổng tiền gốc (subtotal) của đơn hàng."""
    subtotal = Decimal(subtotal)
    if coupon.discount_type == "percent":
        return subtotal * coupon.discount_value / Decimal(100)
    # fixed: không giảm vượt quá tổng tiền đơn
    return min(coupon.discount_value, subtotal)


def apply_coupon(user, code, subtotal):
    """Áp mã cho một đơn hàng — PHẢI gọi bên trong transaction.

    Trả về (coupon, discount: Decimal). Ném CouponError nếu mã không hợp lệ.

    KHÔNG tạo CouponUsage / không tăng used_count ở đây
    → caller (commerce khi tạo order) tự làm trong cùng transaction.
    """
    # lock=True: khoá dòng coupon — đã được gọi bên trong transaction.atomic() của orders
    coupon = _check_coupon(user, code, lock=True)
    return coupon, compute_discount(coupon, subtotal)


# ── Vòng đời lượt dùng (khi đơn đổi trạng thái) ──


def abuse_score(cancels, total_orders, account_age_days, repeat_revoked):
    """(THUẦN) Tính điểm nghi ngờ lạm dụng từ các con số — >=5 là nghi ngờ.

    Tách riêng khỏi DB để có thể unit test dễ dàng.
    - cancels: số đơn đã hủy trong 30 ngày
    - total_orders: tổng đơn trong 30 ngày
    - account_age_days: tuổi tài khoản (ngày), None nếu không rõ
    - repeat_revoked: số lần bị revoked mã này trước đó
    """
    score = 0
    # 1. Hủy quá nhiều
    if cancels >= 4:
        score += 5
    elif cancels >= 2:
        score += 2

    # 2. Tỷ lệ hủy >= 70% (đơn ít nhưng toàn hủy cũng nghi)
    if total_orders >= 3 and (cancels / total_orders) >= 0.7:
        score += 4

    # 3. Account mới (dễ lập nick để lạm dụng)
    if account_age_days is not None:
        if account_age_days <= 1:
            score += 3
        elif account_age_days <= 7:
            score += 2

    # 4. Tái phạm: đặt-hủy mã này nhiều lần
    if repeat_revoked >= 2:
        score += 3

    return score


def is_abuse(user: User, coupon: Coupon) -> bool:
    """Đếm số liệu từ DB rồi nhờ abuse_score() quyết định (>=5)."""
    now = timezone.now()
    since = now - timedelta(days=30)

    cancels = Order.objects.filter(
        user_id=user.user_id, status="cancelled", created_at__gte=since
    ).count()
    total = Order.objects.filter(user_id=user.user_id, created_at__gte=since).count()

    account_age_days = None
    if user.created_at:
        account_age_days = max(0.0, (now - user.created_at).total_seconds() / 86400)

    repeat_revoked = CouponUsage.objects.filter(
        user_id=user.user_id, coupon_id=coupon.id, status="revoked"
    ).count()

    return abuse_score(cancels, total, account_age_days, repeat_revoked) >= 5


def complete_coupon_usage(order_id, coupon_id):
    """Đơn hoàn tất (completed): reserved → consumed — lượt dùng chính thức.

    Idempotent: không làm gì nếu đơn không còn usage reserved.
    """
    CouponUsage.objects.filter(
        order_id=order_id, coupon_id=coupon_id, status="reserved"
    ).update(status="consumed")


def cancel_coupon_usage(user, coupon_id, order_id):
    """Đơn bị hủy (cancelled): quyết định HOÀN lượt hay PHẠT.

    - Nghi lạm dụng (is_abuse): usage → revoked, tự bật is_coupon_restricted,
      GIỮ used_count (khách không được hoàn lượt — bị phạt).
    - Bình thường: usage → released, used_count -= 1 (hoàn lượt cho người khác).

    Trả về dict kết quả (để log) hoặc None nếu không có usage reserved (idempotent).
    """
    try:
        coupon = Coupon.objects.select_for_update().get(id=coupon_id)
    except Coupon.DoesNotExist:
        return None

    usage = (
        CouponUsage.objects.select_for_update()
        .filter(order_id=order_id, coupon_id=coupon_id, status="reserved")
        .first()
    )
    if not usage:
        return None  # đã xử lý trước đó → không xử lý lại

    if is_abuse(user, coupon):
        usage.status = "revoked"
        usage.save(update_fields=["status"])
        # Phạt nặng: tự chặn coupon vĩnh viễn (admin có thể gỡ qua toggle)
        if not getattr(user, "is_coupon_restricted", False):
            user.is_coupon_restricted = True
            user.save(update_fields=["is_coupon_restricted"])
        return {"decision": "revoked", "reason": "abuse"}

    usage.status = "released"
    usage.save(update_fields=["status"])
    coupon.used_count = max(0, coupon.used_count - 1)
    coupon.save(update_fields=["used_count"])
    return {"decision": "released"}
