from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.common.responses import envelope, error

from .models import Coupon
from .serializers import CouponSerializer, ValidateCouponSerializer
from .services import _check_coupon, CouponError


def _is_admin(user) -> bool:
    """Kiểm tra user có role admin/staff không"""
    role_name = getattr(user, "role_name", None)
    if role_name is None and getattr(user, "role", None):
        role_name = user.role.role_name
    return bool(role_name and role_name.lower() in ("admin", "staff"))


def _get_coupon_or_404(coupon_id):
    try:
        return Coupon.objects.get(id=coupon_id)
    except Coupon.DoesNotExist:
        return None


# ── Admin CRUD ──

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def coupons(request):
    if not _is_admin(request.user):
        return error("Bạn không có quyền quản trị mã giảm giá.", status=403)

    if request.method == "GET":
        queryset = Coupon.objects.all().order_by("-id")
        return envelope(CouponSerializer(queryset, many=True).data)

    serializer = CouponSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data, status=201)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def coupon_detail(request, coupon_id: int):
    if not _is_admin(request.user):
        return error("Bạn không có quyền quản trị mã giảm giá.", status=403)

    coupon = _get_coupon_or_404(coupon_id)
    if not coupon:
        return error("Mã giảm giá không tồn tại.", status=404)

    if request.method == "GET":
        return envelope(CouponSerializer(coupon).data)

    if request.method == "DELETE":
        coupon.delete()
        return envelope({"success": True})

    serializer = CouponSerializer(coupon, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(CouponSerializer(Coupon.objects.get(id=coupon_id)).data)


# ── Khách áp mã ──

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def validate_coupon(request):
    """Khách gửi mã → kiểm tra còn hiệu lực không → trả tiền giảm"""
    serializer = ValidateCouponSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    code = serializer.validated_data["code"]

    # Dùng chung logic kiểm tra với apply_coupon (services.py) — tránh lệch nhau
    try:
        coupon = _check_coupon(request.user, code)
    except CouponError as exc:
        return error(str(exc), request_id=getattr(request, "request_id", None), status=exc.status)

    return envelope({
        "code": coupon.code,
        "discountType": coupon.discount_type,
        "discountValue": float(coupon.discount_value),
        "message": "Mã giảm giá hợp lệ.",
    })
