from pathlib import Path
import os
from datetime import timedelta

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from PythonServer/.env if present
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"

ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "apps.common",
    "apps.catalog",
    "apps.chatbot",
    "apps.authn",
    "apps.commerce",
    "apps.reviews",
    "apps.wishlist",
    "apps.coupons",
    "apps.recommendations",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.common.middleware.RequestIdMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME", "eyewear_store"),
        "USER": os.getenv("DB_USER", "root"),
        "PASSWORD": os.getenv("DB_PASS", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "3306"),
        "OPTIONS": {"charset": "utf8mb4"},
    }
}


# Nếu chưa chạy Redis, Django sẽ báo lỗi kết nối khi dùng cache (xem cache_utils để xử lý mềm).
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.getenv("REDIS_URL", "redis://127.0.0.1:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            # Nếu Redis tắt: giới hạn thời gian chờ (mặc định ~2.3s/lần gọi → request rất chậm)
            "SOCKET_CONNECT_TIMEOUT": 1,
            "SOCKET_TIMEOUT": 1,
        },
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("TZ", "Asia/Ho_Chi_Minh")
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/uploads/"
MEDIA_ROOT = BASE_DIR.parent / "uploads"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:5175",
    ).split(",")
    if origin.strip()
]
# Cho phép dev trên MỌI cổng localhost (Vite hay tự đổi port 5173→5174→5175...)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
]
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.authn.authentication.LegacyJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "SeeU Eyewear API",
    "DESCRIPTION": (
        "Django REST API cho website bán kính mắt SeeU (storefront + admin dashboard).\n\n"
        "**Xác thực:** gửi header `Authorization: Bearer <token>` "
        "(lấy token từ `POST /api/auth/login`)."
    ),
    "VERSION": "2.0.0",
    "SCHEMA_PATH_PREFIX": "/api",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SERVERS": [
        {"url": "http://localhost:8000", "description": "Máy local (dev)"},
    ],
    # Cho phép bấm "Authorize" trên Swagger UI và nhập token Bearer
    "SECURITY": [{"Bearer": []}],
    "APPEND_COMPONENTS": {
        "securitySchemes": {
            "Bearer": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"},
        }
    },
    "TAGS": [
        {"name": "auth", "description": "Đăng nhập / đăng ký / quên mật khẩu"},
        {"name": "catalog", "description": "Sản phẩm, danh mục, thương hiệu, tìm kiếm"},
        {"name": "commerce", "description": "Giỏ hàng, đơn hàng, thanh toán, kho"},
        {"name": "reviews", "description": "Đánh giá sản phẩm"},
        {"name": "wishlist", "description": "Sản phẩm yêu thích"},
        {"name": "coupons", "description": "Mã giảm giá"},
        {"name": "recommendations", "description": "Gợi ý sản phẩm"},
        {"name": "chatbot", "description": "Trợ lý tư vấn"},
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "format": '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","request_id":"%(request_id)s","message":"%(message)s"}'
        }
    },
    "filters": {
        "request_id": {
            "()": "apps.common.logging.RequestIdFilter",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "filters": ["request_id"],
        }
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}

# --- VNPay (cổng thanh toán) ---
# Lấy thông tin từ tài khoản sandbox: https://sandbox.vnpayment.vn/merchantv2/
VNPAY_TMN_CODE = os.getenv("VNPAY_TMN_CODE", "")
VNPAY_HASH_SECRET = os.getenv("VNPAY_HASH_SECRET", "")
VNPAY_PAYMENT_URL = os.getenv(
    "VNPAY_PAYMENT_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
)
# VNPay sẽ redirect về URL này sau khi khách thanh toán
VNPAY_RETURN_URL = os.getenv(
    "VNPAY_RETURN_URL", "http://localhost:8000/api/payments/vnpay/return"
)
# Trang storefront để chuyển khách tới sau khi thanh toán xong
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5174")

# --- Email (Gmail SMTP) — gửi link đặt lại mật khẩu ---
# Dùng App Password 16 ký tự của Gmail, KHÔNG dùng mật khẩu Gmail thường.
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "1") == "1"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or "no-reply@seeu.vn")
# Chưa cấu hình Gmail → dùng backend console (in email ra terminal) để vẫn test được luồng
EMAIL_BACKEND = (
    "django.core.mail.backends.smtp.EmailBackend"
    if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
    else "django.core.mail.backends.console.EmailBackend"
)
