from django.db import IntegrityError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from apps.common.responses import envelope, error

from .models import Wishlist
from .serializers import CreateWishlistSerializer, WishlistSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def wishlist(request):
    """GET: danh sách yêu thích của user | POST: thêm sản phẩm"""
    user_id = request.user.user_id

    if request.method == "GET":
        items = Wishlist.objects.filter(user_id=user_id).order_by("-created_at")
        return envelope(WishlistSerializer(items, many=True).data)

    serializer = CreateWishlistSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    product_id = serializer.validated_data["productId"]

    try:
        item = Wishlist.objects.create(user_id=user_id, product_id=product_id)
    except IntegrityError:
        return error(
            "Sản phẩm đã có trong danh sách yêu thích.",
            request_id=getattr(request, "request_id", None),
            status=409,
        )

    return envelope(WishlistSerializer(item).data, status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def wishlist_detail(request, item_id: int):
    """DELETE: bỏ yêu thích — chỉ user sở hữu mới xóa được"""
    item = Wishlist.objects.filter(id=item_id, user_id=request.user.user_id).first()
    if not item:
        return error("Không tìm thấy sản phẩm yêu thích.", status=404)
    item.delete()
    return envelope({"success": True})
