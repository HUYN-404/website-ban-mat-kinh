"""Cấu hình dùng chung cho toàn bộ test.

Lưu ý kiến trúc: các bảng legacy là managed=False (không migration)
→ pytest-django không tạo được "test DB" riêng (thiếu bảng).
→ Mỗi test chạy trong transaction.atomic() rồi ROLLBACK ở cuối (fixture rollback_db),
  nên KHÔNG làm bẩn DB thật.
"""
import bcrypt
import pytest
from django.db import transaction
from django.test import Client

from apps.authn.models import User


@pytest.fixture(scope="session")
def django_db_setup():
    """KHÔNG tạo database test riêng (bảng legacy managed=False không migration).
    → test chạy thẳng DB thật; mỗi test tự rollback (fixture db_rollback)."""
    return None


@pytest.fixture
def db_rollback():
    """Mở transaction → chạy test → ROLLBACK (xoá sạch mọi thay đổi trên DB thật)."""
    with transaction.atomic():
        yield
        transaction.set_rollback(True)


def _request(method, path, data=None, token=None):
    client = Client()
    headers = {"HTTP_HOST": "localhost"}
    if token:
        headers["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return getattr(client, method)(path, data=data, content_type="application/json", **headers)


@pytest.fixture
def api():
    """Gọi API như FE: api('post', '/api/...', {...}, token=...). Trả response."""
    return _request


@pytest.fixture
def make_user():
    """Tạo user thật (mật khẩu hash bcrypt để login được)."""
    def _make(username="test_user", password="password123", **extra):
        return User.objects.create(
            username=username,
            password=bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
            full_name="Test User",
            status="active",
            **extra,
        )
    return _make
