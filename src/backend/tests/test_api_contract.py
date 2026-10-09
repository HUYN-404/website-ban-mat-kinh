from django.test import SimpleTestCase
from django.urls import resolve

from apps.api import urls as api_urls


class ApiRoutingContractTests(SimpleTestCase):
    def test_v2_root_route_exists(self):
        match = resolve("/api/")
        self.assertEqual(match.func.__name__, api_urls.api_root.__name__)

    def test_order_status_route_exists(self):
        """Khách huỷ đơn / yêu cầu hoàn tiền đi qua endpoint này."""
        match = resolve("/api/orders/1/status")
        assert hasattr(match.func, "cls")

    def test_auth_login_route_exists(self):
        match = resolve("/api/auth/login")
        assert hasattr(match.func, "cls")
