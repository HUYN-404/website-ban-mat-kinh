from rest_framework import serializers

from .models import Brand, Category, Product, ProductImage, Supplier


class CategorySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="category_id", read_only=True)
    parentId = serializers.IntegerField(source="parent_id", allow_null=True, required=False)

    class Meta:
        model = Category
        fields = ["id", "name", "description", "parentId"]


class BrandSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="brand_id", read_only=True)

    class Meta:
        model = Brand
        fields = ["id", "name", "description", "country"]


class SupplierSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="supplier_id", read_only=True)

    class Meta:
        model = Supplier
        fields = ["id", "name", "phone", "email", "address"]


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="product_id", read_only=True)
    stockQuantity = serializers.IntegerField(source="stock_quantity", read_only=True)
    categoryId = serializers.IntegerField(source="category_id")
    categoryName = serializers.CharField(source="category.name", read_only=True)
    brandId = serializers.IntegerField(source="brand_id")
    brandName = serializers.CharField(source="brand.name", read_only=True)
    supplierId = serializers.IntegerField(source="supplier_id")
    supplierName = serializers.CharField(source="supplier.name", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "stockQuantity",
            "status",
            "categoryId",
            "categoryName",
            "brandId",
            "brandName",
            "supplierId",
            "supplierName",
            "materials",
            "highlights",
            "createdAt",
            "updatedAt",
        ]


class ProductImageSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="image_id", read_only=True)
    productId = serializers.IntegerField(source="product_id")
    imageUrl = serializers.CharField(source="image_url")

    class Meta:
        model = ProductImage
        fields = ["id", "productId", "imageUrl"]
