from rest_framework import serializers

from .models import Role, User


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(min_length=6)
    email = serializers.EmailField()
    fullName = serializers.CharField(required=False, allow_blank=True)


class UserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user_id", read_only=True)
    fullName = serializers.CharField(source="full_name", allow_null=True, required=False)
    roleId = serializers.IntegerField(source="role_id", allow_null=True, required=False)
    roleName = serializers.CharField(source="role.role_name", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "fullName",
            "email",
            "phone",
            "address",
            "status",
            "roleId",
            "roleName",
            "createdAt",
            "updatedAt",
        ]


class RoleSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="role_id", read_only=True)
    roleName = serializers.CharField(source="role_name")

    class Meta:
        model = Role
        fields = ["id", "roleName", "description"]
