from rest_framework import serializers

from .models import TryOnSession


class TryOnSessionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="session_id", read_only=True)
    userId = serializers.IntegerField(source="user_id", allow_null=True, required=False)
    productId = serializers.IntegerField(source="product_id", allow_null=True, required=False)
    faceImageUrl = serializers.CharField(source="face_image_url", allow_null=True, required=False)
    resultImageUrl = serializers.CharField(source="result_image_url", allow_null=True, required=False)
    expiresAt = serializers.DateTimeField(source="expires_at", required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = TryOnSession
        fields = [
            "id",
            "userId",
            "productId",
            "faceImageUrl",
            "resultImageUrl",
            "status",
            "expiresAt",
            "createdAt",
            "updatedAt",
        ]
