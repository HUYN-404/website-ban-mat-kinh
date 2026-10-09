from rest_framework import serializers

from apps.catalog.models import Product

from .models import Wishlist


class CreateWishlistSerializer(serializers.Serializer):
    """Thêm vào wishlist — không gắn model vì logic đặc biệt"""
    productId = serializers.IntegerField()


class WishlistSerializer(serializers.ModelSerializer):
    """Trả về wishlist — JOIN sẵn tên + giá sản phẩm"""
    id = serializers.IntegerField(read_only=True)
    userId = serializers.IntegerField(source="user_id")
    productId = serializers.IntegerField(source="product_id")
    productName = serializers.SerializerMethodField()
    productPrice = serializers.SerializerMethodField()
    productImage = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Wishlist
        fields = [
            "id",
            "userId",
            "productId",
            "productName",
            "productPrice",
            "productImage",
            "createdAt",
        ]

    def _get_product(self, obj):
        return Product.objects.filter(product_id=obj.product_id).first()

    def get_productName(self, obj):
        product = self._get_product(obj)
        return product.name if product else None

    def get_productPrice(self, obj):
        product = self._get_product(obj)
        return float(product.price) if product else None

    def get_productImage(self, obj):
        from apps.catalog.models import ProductImage
        img = ProductImage.objects.filter(product_id=obj.product_id).first()
        return img.image_url if img else None
