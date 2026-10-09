import pytest
from datetime import timedelta

from django.utils import timezone

from apps.authn.views import _build_token
from apps.catalog.models import Product
from apps.commerce.models import Order
from apps.coupons.models import Coupon, CouponUsage

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("db_rollback")]


def _make_coupon(code="TEST10"):
    now = timezone.now()
    return Coupon.objects.create(
        code=code,
        discount_type="percent",
        discount_value=10,
        valid_from=now - timedelta(days=1),
        valid_to=now + timedelta(days=1),
        usage_limit=5,
        used_count=0,
        is_active=True,
    )


class TestOrderCoupon:
    """Vòng đời coupon: đặt đơn giảm tiền + huỷ đơn hoàn lượt."""

    def test_order_with_coupon_discount(self, api, make_user):
        product = Product.objects.order_by("product_id").first()
        user = make_user(username="cust1")
        token = _build_token(user)
        coupon = _make_coupon("TEST10")

        resp = api(
            "post",
            "/api/orders",
            {
                "userId": user.user_id,
                "items": [{"productId": product.product_id, "quantity": 1}],
                "couponCode": "TEST10",
            },
            token=token,
        )
        assert resp.status_code == 201
        data = resp.json()["data"]
        subtotal = float(product.price)
        assert abs(float(data["totalAmount"]) - subtotal * 0.9) < 0.01

        usage = CouponUsage.objects.filter(order_id=data["id"], coupon_id=coupon.id).first()
        assert usage and usage.status == "reserved"
        coupon.refresh_from_db()
        assert coupon.used_count == 1

    def test_cancel_releases_coupon(self, api, make_user):
        product = Product.objects.order_by("product_id").first()
        user = make_user(username="cust2")
        token = _build_token(user)
        coupon = _make_coupon("TEST10")

        order = api(
            "post",
            "/api/orders",
            {
                "userId": user.user_id,
                "items": [{"productId": product.product_id, "quantity": 1}],
                "couponCode": "TEST10",
            },
            token=token,
        ).json()["data"]

        resp = api("patch", f"/api/orders/{order['id']}/status", {"status": "cancelled"}, token=token)
        assert resp.status_code == 200

        usage = CouponUsage.objects.filter(order_id=order["id"], coupon_id=coupon.id).first()
        assert usage and usage.status == "released"
        coupon.refresh_from_db()
        assert coupon.used_count == 0

    def test_invalid_coupon_blocks_order(self, api, make_user):
        """Mã không hợp lệ → 400 và KHÔNG tạo đơn."""
        product = Product.objects.order_by("product_id").first()
        user = make_user(username="cust3")
        token = _build_token(user)
        before = Order.objects.count()

        resp = api(
            "post",
            "/api/orders",
            {
                "userId": user.user_id,
                "items": [{"productId": product.product_id, "quantity": 1}],
                "couponCode": "KHONG_CO",
            },
            token=token,
        )
        assert resp.status_code == 400
        assert Order.objects.count() == before
