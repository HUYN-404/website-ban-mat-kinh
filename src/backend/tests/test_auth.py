import pytest

from apps.authn.views import _build_token

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("db_rollback")]


class TestAuth:
    """Luồng xác thực: login đúng/sai + lấy profile bằng token."""

    def test_login_success_returns_token(self, api, make_user):
        make_user(username="alice", password="secret123")
        resp = api("post", "/api/auth/login", {"username": "alice", "password": "secret123"})
        assert resp.status_code == 200
        assert resp.json()["data"]["token"]

    def test_login_wrong_password_401(self, api, make_user):
        make_user(username="bob", password="secret123")
        resp = api("post", "/api/auth/login", {"username": "bob", "password": "sai-mat-khau"})
        assert resp.status_code == 401

    def test_me_with_token_200(self, api, make_user):
        user = make_user(username="carol", password="secret123")
        token = _build_token(user)
        resp = api("get", "/api/auth/me", token=token)
        assert resp.status_code == 200
        assert resp.json()["data"]["username"] == "carol"
