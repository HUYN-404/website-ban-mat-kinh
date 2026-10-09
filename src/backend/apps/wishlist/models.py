from django.db import models


class Wishlist(models.Model):
    """Sản phẩm yêu thích — bảng mới do Django quản lý"""
    id = models.AutoField(primary_key=True)
    user_id = models.IntegerField()
    product_id = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wishlist"
        unique_together = [("user_id", "product_id")]
        indexes = [
            models.Index(fields=["user_id"]),   # Tìm nhanh wishlist của 1 user
            models.Index(fields=["user_id", "product_id"]),  # Kiểm tra đã thích chưa
        ]
