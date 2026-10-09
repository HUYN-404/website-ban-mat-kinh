from django.db import IntegrityError
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.authn.models import User
from apps.catalog.models import Product
from apps.commerce.models import Order, OrderItem
from apps.common.permissions import is_admin
from apps.common.responses import envelope, error

from .models import Review
from .serializers import AdminReviewSerializer, CreateReviewSerializer, ReviewSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def product_reviews(request, product_id: int):
    """Lấy review của 1 sản phẩm — ai cũng xem được, nhưng BỎ đánh giá đã bị admin ẩn"""
    reviews = (
        Review.objects.filter(product_id=product_id, status="visible")
        .order_by("-created_at")
    )
    return envelope(ReviewSerializer(reviews, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_review(request):
    """Tạo review — chỉ user đã mua sản phẩm mới được"""
    serializer = CreateReviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user_id = request.user.user_id
    product_id = data["productId"]

    # ── KIỂM TRA: User này đã mua sản phẩm này chưa? ──
    has_purchased = OrderItem.objects.filter(
        order_id__in=Order.objects.filter(
            user_id=user_id,
            status__in=["paid", "shipped", "completed"]
        ).values("order_id"),
        product_id=product_id,
    ).exists()

    if not has_purchased:
        return error(
            "Bạn chỉ có thể đánh giá sản phẩm đã mua.",
            request_id=getattr(request, "request_id", None),
            status=403,
        )

    # ── Tạo review ──
    try:
        review = Review.objects.create(
            user_id=user_id,
            product_id=product_id,
            rating=data["rating"],
            comment=data.get("comment") or "",
        )
    except IntegrityError:
        return error(
            "Bạn đã đánh giá sản phẩm này rồi.",
            request_id=getattr(request, "request_id", None),
            status=409,
        )

    return envelope(ReviewSerializer(review).data, status=201)


# ── Quản trị: quản lý đánh giá ──

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reviews_admin_list(request):
    """ADMIN: xem danh sách + tìm kiếm đánh giá.

    Lọc: `keyword` (nội dung / tên khách / tên sản phẩm) · `rating` (1–5) · `status` (visible|hidden).
    Toàn bộ điều kiện lọc chạy ở tầng DB (không load hết bảng ra Python).
    """
    if not is_admin(request.user):
        return error("Bạn không có quyền truy cập.", status=403)

    queryset = Review.objects.all().order_by("-created_at")

    keyword = (request.query_params.get("keyword") or "").strip()
    rating = request.query_params.get("rating")
    status_filter = request.query_params.get("status")

    if rating:
        queryset = queryset.filter(rating=rating)
    if status_filter in ("visible", "hidden"):
        queryset = queryset.filter(status=status_filter)
    if keyword:
        matching_users = User.objects.filter(
            Q(full_name__icontains=keyword) | Q(username__icontains=keyword)
        ).values("user_id")
        matching_products = Product.objects.filter(name__icontains=keyword).values("product_id")
        queryset = queryset.filter(
            Q(comment__icontains=keyword)
            | Q(user_id__in=matching_users)
            | Q(product_id__in=matching_products)
        )

    return envelope(AdminReviewSerializer(queryset, many=True).data)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def review_admin_detail(request, review_id: int):
    """ADMIN: xem chi tiết · sửa (nội dung + ẩn/hiện) · xoá đánh giá.

    Số sao KHÔNG cho admin sửa — giữ nguyên đánh giá gốc của khách cho khách quan.
    """
    if not is_admin(request.user):
        return error("Bạn không có quyền truy cập.", status=403)

    review = Review.objects.filter(id=review_id).first()
    if not review:
        return error("Không tìm thấy đánh giá.", status=404)

    if request.method == "GET":
        return envelope(AdminReviewSerializer(review).data)

    if request.method == "DELETE":
        review.delete()
        return envelope({"success": True})

    if "comment" in request.data:
        review.comment = request.data.get("comment") or ""
    if "status" in request.data:
        new_status = request.data.get("status")
        if new_status not in ("visible", "hidden"):
            return error("Trạng thái không hợp lệ (visible | hidden).", status=400)
        review.status = new_status

    review.save(update_fields=["comment", "status", "updated_at"])
    return envelope(AdminReviewSerializer(review).data)
