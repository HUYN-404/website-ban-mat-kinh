from django.db import models


class Coupon(models.Model):
    """Mã giảm giá — bảng mới do Django quản lý"""
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, default="percent")  # "percent" | "fixed"
    discount_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_to = models.DateTimeField(null=True, blank=True)
    usage_limit = models.IntegerField(null=True, blank=True)   # null = không giới hạn
    used_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "coupons"


class CouponUsage(models.Model):
    """Ghi lại ai đã dùng mã nào + vòng đời sử dụng"""
    id = models.AutoField(primary_key=True)
    coupon_id = models.IntegerField()
    user_id = models.IntegerField()
    order_id = models.IntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        default="reserved",  # reserved → consumed/released/revoked
    )
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "coupon_usage"
        indexes = [
            models.Index(fields=["user_id"]),
            models.Index(fields=["coupon_id"]),
            models.Index(fields=["order_id"]),
        ]
