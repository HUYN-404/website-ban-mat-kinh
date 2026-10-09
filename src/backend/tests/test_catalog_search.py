import pytest

from apps.catalog.models import Product

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("db_rollback")]


def _ids(data):
    return [p["id"] for p in data]


class TestCatalog:
    """Danh mục sản phẩm + tìm kiếm bỏ dấu."""

    def test_products_list_ok(self, api):
        resp = api("get", "/api/products")
        assert resp.status_code == 200
        assert isinstance(resp.json()["data"], list)

    def test_product_detail_ok(self, api):
        product = Product.objects.order_by("product_id").first()
        resp = api("get", f"/api/products/{product.product_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["id"] == product.product_id

    def test_search_accent_insensitive(self, api):
        """Gõ có dấu 'kính' và không dấu 'kinh' phải cho cùng kết quả."""
        no_accent = api("get", "/api/products", {"search": "kinh"})
        with_accent = api("get", "/api/products", {"search": "kính"})
        assert no_accent.status_code == 200
        assert with_accent.status_code == 200
        ids_no = _ids(no_accent.json()["data"])
        ids_with = _ids(with_accent.json()["data"])
        assert len(ids_no) > 0
        assert set(ids_no) == set(ids_with)
