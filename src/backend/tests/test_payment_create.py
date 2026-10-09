"""Hồi quy: KHÁCH đặt hàng phải tạo được giao dịch (POST /api/payments).

Lỗi từng xảy ra: `payments()` đặt `require_admin` ở ĐẦU view → chặn luôn POST
→ checkout của storefront (cả COD lẫn chuyển khoản) bị 403
"Bạn không có quyền thực hiện thao tác...".

Bộ test này giữ đúng luật:
- GET  /api/payments  → chỉ admin (đối soát toàn bộ giao dịch)
- POST /api/payments  → khách tạo được cho ĐƠN CỦA CHÍNH MÌNH, số tiền lấy từ DB
"""
import pytest

from apps.authn.models import Role
from apps.authn.views import _build_token
from apps.catalog.models import Product
from apps.commerce.models import Order, Payment

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("db_rollback")]


def _make_order(api, user, token) -> Order:
    """Tạo 1 đơn hàng thật qua API (giống FE đặt hàng)."""
    product = Product.objects.order_by("product_id").first()
    resp = api(
        "post",
        "/api/orders",
        {"userId": user.user_id, "items": [{"productId": product.product_id, "quantity": 1}]},
        token=token,
    )
    assert resp.status_code == 201, resp.content
    return Order.objects.get(order_id=resp.json()["data"]["id"])


class TestCreatePayment:
    def test_customer_creates_payment_for_own_order(self, api, make_user):
        """Regression chính: khách đặt hàng tạo được giao dịch (trước đây bị 403)."""
        user = make_user(username="cust_pay")
        token = _build_token(user)
        order = _make_order(api, user, token)

        resp = api(
            "post",
            "/api/payments",
            {"orderId": order.order_id, "method": "bank_transfer", "amount": 1},
            token=token,
        )

        assert resp.status_code == 201, resp.content
        data = resp.json()["data"]
        assert data["orderId"] == order.order_id
        assert data["status"] == "pending"
        # Số tiền phải lấy từ DB — KHÔNG lấy `amount: 1` do FE gửi lên
        assert float(data["amount"]) == float(order.total_amount)

    def test_customer_cannot_create_payment_for_other_order(self, api, make_user):
        """Chặn IDOR: không tạo được giao dịch cho đơn của người khác."""
        owner = make_user(username="cust_owner")
        other = make_user(username="cust_other")
        order = _make_order(api, owner, _build_token(owner))

        resp = api(
            "post",
            "/api/payments",
            {"orderId": order.order_id, "method": "bank_transfer"},
            token=_build_token(other),
        )
        assert resp.status_code == 403

    def test_get_payments_is_admin_only(self, api, make_user):
        """Danh sách giao dịch vẫn phải là admin (trang Thanh toán)."""
        customer = make_user(username="cust_get")
        assert api("get", "/api/payments", token=_build_token(customer)).status_code == 403

        role, _ = Role.objects.get_or_create(role_name="admin")
        admin = make_user(username="admin_get", role=role)
        assert api("get", "/api/payments", token=_build_token(admin)).status_code == 200

    def test_link_payment_of_another_order_is_rejected(self, api, make_user):
        """PATCH /orders/<id>/payment chỉ nhận giao dịch THUỘC ĐÚNG đơn đó."""
        user = make_user(username="cust_link")
        token = _build_token(user)
        order = _make_order(api, user, token)

        foreign = Payment.objects.exclude(order_id=order.order_id).first()
        if foreign is None:
            pytest.skip("DB chưa có giao dịch của đơn khác để test")

        resp = api(
            "patch",
            f"/api/orders/{order.order_id}/payment",
            {"paymentId": foreign.payment_id},
            token=token,
        )
        assert resp.status_code == 400
