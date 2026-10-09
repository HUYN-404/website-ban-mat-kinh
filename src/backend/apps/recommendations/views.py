from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.common.responses import envelope, error

from . import services


def _to_limit(request):
    try:
        return int(request.query_params.get("limit", 8))
    except (TypeError, ValueError):
        return 8


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommend_for_user(request):
    """Gợi ý CÁ NHÂN theo lịch sử mua (cold start → popular)."""
    limit = _to_limit(request)
    product_ids, reason = services.recommend_for_user(request.user.user_id, limit)
    return envelope({"productIds": product_ids, "reason": reason})


@api_view(["GET"])
@permission_classes([AllowAny])
def popular_products(request):
    """Sản phẩm phổ biến — dùng khi user chưa đăng nhập / chưa có lịch sử."""
    limit = _to_limit(request)
    return envelope({"productIds": services.popular_product_ids(limit), "reason": "popular"})


@api_view(["GET"])
@permission_classes([AllowAny])
def similar_product(request, product_id: int):
    """Sản phẩm tương tự 1 sản phẩm (trang chi tiết)."""
    limit = _to_limit(request)
    ids = services.similar_product_ids(product_id, limit)
    if not ids:
        return error("Không có sản phẩm tương tự.", status=404)
    return envelope({"productIds": ids, "reason": "similar"})
