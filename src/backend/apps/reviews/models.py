from django.db import models


class Review(models.Model):
    """Đánh giá sản phẩm — bảng mới do Django quản lý"""
    id = models.AutoField(primary_key=True)
    user_id = models.IntegerField()
    product_id = models.IntegerField()
    rating = models.IntegerField()          # 1–5 sao
    comment = models.TextField(null=True, blank=True)
    # Admin ẩn đánh giá vi phạm: "visible" | "hidden"
    status = models.CharField(max_length=16, default="visible")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reviews"
        unique_together = [("user_id", "product_id")]
        indexes = [
            models.Index(fields=["product_id"]),       # Tìm review theo sản phẩm
            models.Index(fields=["product_id", "-created_at"]),  # Sắp xếp mới nhất
        ]
        unique_together = [("user_id", "product_id")]   # Mỗi user chỉ được review 1 lần / sản phẩm
