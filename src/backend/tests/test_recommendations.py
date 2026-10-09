import pytest

from apps.authn.views import _build_token
from apps.catalog.models import Product

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("db_rollback")]


class TestRecommendations:
    """Recommendation: popular / similar / user cold start."""

    def test_popular_returns_ids(self, api):
        resp = api("get", "/api/recommendations/popular")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["reason"] == "popular"
        assert len(data["productIds"]) > 0

    def test_similar_excludes_self(self, api):
        product = Product.objects.order_by("product_id").first()
        resp = api("get", f"/api/recommendations/product/{product.product_id}")
        assert resp.status_code == 200
        ids = resp.json()["data"]["productIds"]
        assert len(ids) > 0
        assert product.product_id not in ids  # không gợi ý chính nó

    def test_user_cold_start_falls_back_popular(self, api, make_user):
        # User mới chưa mua gì → phải rơi vào "popular"
        user = make_user(username="newbie")
        token = _build_token(user)
        resp = api("get", "/api/recommendations/user", token=token)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["reason"] == "popular"
