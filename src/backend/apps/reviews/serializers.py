from rest_framework import serializers

from apps.authn.models import User
from apps.catalog.models import Product
from .models import Review


class CreateReviewSerializer(serializers.Serializer):
    """Tạo review mới — không gắn model vì cần logic đặc biệt"""
    productId = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


class ReviewSerializer(serializers.ModelSerializer):
    """Trả về review — gắn model để serialize dễ dàng"""
    id = serializers.IntegerField(read_only=True)
    userId = serializers.IntegerField(source="user_id")
    productId = serializers.IntegerField(source="product_id")
    userName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "userId", "userName", "productId", "rating", "comment", "createdAt"]

    def get_userName(self, obj):
        user = User.objects.filter(user_id=obj.user_id).first()
        if not user:
            return None
        return user.full_name or user.username


class AdminReviewSerializer(ReviewSerializer):
    """Dùng cho trang quản trị: thêm tên sản phẩm + trạng thái ẩn/hiện."""

    productName = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta(ReviewSerializer.Meta):
        fields = ReviewSerializer.Meta.fields + ["productName", "status", "updatedAt"]

    def get_productName(self, obj):
        product = Product.objects.filter(product_id=obj.product_id).only("name").first()
        return product.name if product else None
