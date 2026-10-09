import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from .models import User


class LegacyJWTAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        parts = auth_header.split(" ")
        if len(parts) != 2 or parts[0] != self.keyword:
            raise exceptions.AuthenticationFailed("Invalid Authorization header")

        token = parts[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except jwt.InvalidTokenError as exc:
            raise exceptions.AuthenticationFailed("Invalid or expired token") from exc

        user_id = payload.get("userId")
        if not user_id:
            raise exceptions.AuthenticationFailed("Token missing userId claim")
        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed("User not found") from exc

        return user, token
