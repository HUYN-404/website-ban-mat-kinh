from rest_framework import serializers

from .models import Coupon, CouponUsage


class CouponSerializer(serializers.ModelSerializer):
    """Serializer cho mã giảm giá (admin CRUD)"""
    id = serializers.IntegerField(read_only=True)
    discountType = serializers.CharField(source="discount_type")
    discountValue = serializers.DecimalField(
        source="discount_value", max_digits=12, decimal_places=2
    )
    validFrom = serializers.DateTimeField(source="valid_from", allow_null=True, required=False)
    validTo = serializers.DateTimeField(source="valid_to", allow_null=True, required=False)
    usageLimit = serializers.IntegerField(source="usage_limit", allow_null=True, required=False)
    usedCount = serializers.IntegerField(source="used_count", read_only=True)
    isActive = serializers.BooleanField(source="is_active", required=False)

    class Meta:
        model = Coupon
        fields = [
            "id",
            "code",
            "discountType",
            "discountValue",
            "validFrom",
            "validTo",
            "usageLimit",
            "usedCount",
            "isActive",
        ]

    def validate_discount_value(self, value):
        if value < 0:
            raise serializers.ValidationError("Giá trị giảm giá không được âm.")
        return value


class ValidateCouponSerializer(serializers.Serializer):
    """Khách gửi mã để áp dụng — chỉ cần code"""
    code = serializers.CharField()
