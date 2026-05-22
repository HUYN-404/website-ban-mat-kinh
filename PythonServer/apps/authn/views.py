from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.common.responses import envelope, error

from .models import Role, User
from .serializers import LoginSerializer, RegisterSerializer, RoleSerializer, UserSerializer


def _build_token(user: User) -> str:
    payload = {
        "userId": user.user_id,
        "username": user.username,
        "roleId": user.role_id,
        "exp": datetime.now(tz=timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def _auth_response(user: User):
    serialized_user = UserSerializer(user).data
    return {"token": _build_token(user), "user": serialized_user}


def _login_from_data(data, request):
    serializer = LoginSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    username = serializer.validated_data["username"]
    password = serializer.validated_data["password"]
    try:
        user = User.objects.select_related("role").get(username=username)
    except User.DoesNotExist:
        return error("Tên đăng nhập hoặc mật khẩu không đúng.", request_id=getattr(request, "request_id", None), status=401)

    if user.status != "active":
        return error("Tài khoản đã bị vô hiệu hóa.", request_id=getattr(request, "request_id", None), status=403)

    if not bcrypt.checkpw(password.encode("utf-8"), user.password.encode("utf-8")):
        return error("Tên đăng nhập hoặc mật khẩu không đúng.", request_id=getattr(request, "request_id", None), status=401)
    return envelope(_auth_response(user))


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    return _login_from_data(request.data, request)


@api_view(["POST"])
@permission_classes([AllowAny])
def admin_login(request):
    result = _login_from_data(request.data, request)
    if result.status_code != 200:
        return result
    role_name = result.data["data"]["user"].get("roleName")
    if not role_name or role_name.lower() not in ("admin", "staff"):
        return error(
            "Bạn không đủ quyền để đăng nhập vào hệ thống quản trị.",
            request_id=getattr(request, "request_id", None),
            status=403,
        )
    return result


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if User.objects.filter(username=data["username"]).exists():
        return error("username đã tồn tại.", request_id=getattr(request, "request_id", None), status=409)

    role = Role.objects.filter(role_name="customer").first()
    if not role:
        return error('Không tìm thấy role "customer" để đăng ký người dùng mới.', status=500)

    hashed = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User.objects.create(
        username=data["username"],
        password=hashed,
        email=data["email"],
        full_name=data.get("fullName") or None,
        role_id=role.role_id,
        status="active",
    )
    user = User.objects.select_related("role").get(user_id=user.user_id)
    return envelope(_auth_response(user), status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def logout(_request):
    return envelope({"success": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = User.objects.select_related("role").get(user_id=request.user.user_id)
    return envelope(UserSerializer(user).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def roles(request):
    if request.method == "GET":
        return envelope(RoleSerializer(Role.objects.all(), many=True).data)
    serializer = RoleSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data, status=201)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def role_detail(request, role_id: int):
    role = Role.objects.filter(role_id=role_id).first()
    if not role:
        return error("Role not found", status=404)
    if request.method == "GET":
        return envelope(RoleSerializer(role).data)
    if request.method == "DELETE":
        role.delete()
        return envelope({"success": True})
    serializer = RoleSerializer(role, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def users(request):
    if request.method == "GET":
        queryset = User.objects.select_related("role").all().order_by("-user_id")
        return envelope(UserSerializer(queryset, many=True).data)
    data = dict(request.data)
    if "password" in data:
        data["password"] = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    serializer = UserSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    instance = User.objects.create(
        username=data["username"],
        password=data.get("password", ""),
        full_name=data.get("fullName"),
        email=data.get("email"),
        phone=data.get("phone"),
        address=data.get("address"),
        role_id=data.get("roleId"),
        status=data.get("status", "active"),
    )
    created = User.objects.select_related("role").get(user_id=instance.user_id)
    return envelope(UserSerializer(created).data, status=201)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def user_detail(request, user_id: int):
    user = User.objects.select_related("role").filter(user_id=user_id).first()
    if not user:
        return error("User not found", status=404)
    if request.method == "GET":
        return envelope(UserSerializer(user).data)
    if request.method == "DELETE":
        user.status = "inactive"
        user.save(update_fields=["status"])
        return envelope({"success": True})
    payload = dict(request.data)
    if "password" in payload:
        payload["password"] = bcrypt.hashpw(payload["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    for field, attr in (
        ("username", "username"),
        ("password", "password"),
        ("fullName", "full_name"),
        ("email", "email"),
        ("phone", "phone"),
        ("address", "address"),
        ("roleId", "role_id"),
    ):
        if field in payload:
            setattr(user, attr, payload[field])
    user.save()
    return envelope(UserSerializer(User.objects.select_related("role").get(user_id=user.user_id)).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def user_status(request, user_id: int):
    user = User.objects.filter(user_id=user_id).first()
    if not user:
        return error("User not found", status=404)
    user.status = request.data.get("status", user.status)
    user.save(update_fields=["status"])
    return envelope(UserSerializer(User.objects.select_related("role").get(user_id=user.user_id)).data)
