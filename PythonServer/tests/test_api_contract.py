from django.test import SimpleTestCase
from django.urls import resolve

from apps.api_v2 import urls as api_v2_urls


class ApiRoutingContractTests(SimpleTestCase):
    def test_v2_root_route_exists(self):
        match = resolve("/api/v2/")
        self.assertEqual(match.func.__name__, api_v2_urls.api_root.__name__)

    def test_tryon_render_route_exists(self):
        match = resolve("/api/v2/tryon/sessions/1/render")
        self.assertEqual(match.func.__name__, "render_session")

    def test_auth_login_route_exists(self):
        match = resolve("/api/v2/auth/login")
        self.assertEqual(match.func.__name__, "login")
