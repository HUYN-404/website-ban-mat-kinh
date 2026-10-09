from django.db import models

from .search import build_search_text


class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    parent_id = models.IntegerField(null=True, blank=True)
    type = models.CharField(max_length=20, default="eyewear")  # "eyewear" | "accessory"

    class Meta:
        managed = False
        db_table = "categories"


class Brand(models.Model):
    brand_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    country = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "brands"


class Supplier(models.Model):
    supplier_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "suppliers"


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=32, default="available")
    category = models.ForeignKey(Category, db_column="category_id", on_delete=models.DO_NOTHING)
    brand = models.ForeignKey(Brand, db_column="brand_id", on_delete=models.DO_NOTHING)
    supplier = models.ForeignKey(Supplier, db_column="supplier_id", on_delete=models.DO_NOTHING)
    materials = models.JSONField(null=True, blank=True)
    highlights = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    # Bản name+brand+description đã BỎ DẤU → phục vụ tìm kiếm tiếng Việt (xem apps/catalog/search.py)
    search_text = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "products"

    def save(self, *args, **kwargs):
        # Tự ghi search_text mỗi khi tạo/sửa sản phẩm — không cần nhập tay
        brand_name = ""
        if self.brand_id:
            try:
                brand_name = self.brand.name
            except Exception:
                brand_name = ""
        self.search_text = build_search_text(self.name, brand_name, self.description)
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    image_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, db_column="product_id", on_delete=models.CASCADE)
    image_url = models.CharField(max_length=1024)

    class Meta:
        managed = False
        db_table = "products_images"

class BrandImage(models.Model):
    """Ảnh thương hiệu — bảng brands_images (Node đang dùng, Django chưa có)"""
    image_id = models.AutoField(primary_key=True)
    brand = models.ForeignKey(Brand, db_column="brand_id", on_delete=models.CASCADE)
    image_url = models.CharField(max_length=1024)

    class Meta:
        managed = False
        db_table = "brands_images"