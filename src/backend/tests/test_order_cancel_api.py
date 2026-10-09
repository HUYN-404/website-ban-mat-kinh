"""Test tích hợp: khách huỷ đơn / yêu cầu hoàn tiền qua API thật.

Chạy trên DB thật nhưng bọc trong transaction rồi ROLLBACK (fixture db_rollback) — xem conftest.py.
"""

from decimal import Decimal

import pytest

from apps.authn.models import Role
from apps.authn.views import _build_token
from apps.catalog.models import Product
from apps.commerce.models import Order, Payment

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("db_rollback")]


def _create_order(api, user, token) -> dict:
    """Đặt 1 đơn mới qua API thật (trạng thái mặc định: pending = chưa thanh toán)."""
    product = Product.objects.order_by("product_id").first()
    resp = api(
        "post",
        "/api/orders",
        {"userId": user.user_id, "items": [{"productId": product.product_id, "quantity": 1}]},
        token=token,
    )
    assert resp.status_code == 201
    return resp.json()["data"]


def _set_status(order_id: int, status: str) -> None:
    """Giả lập trạng thái (VD: VNPay báo đã thanh toán, admin đã giao hàng)."""
    Order.objects.filter(order_id=order_id).update(status=status)


class TestCustomerCancelOrder:
    """Luật: chỉ huỷ được khi đơn CHƯA thanh toán (và chưa gửi hàng)."""

    def test_huy_duoc_don_cua_minh_khi_chua_thanh_toan(self, api, make_user):
        user = make_user(username="cancel_ok")
        token = _build_token(user)
        order = _create_order(api, user, token)

        resp = api("patch", f"/api/orders/{order['id']}/status", {"status": "cancelled"}, token=token)

        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "cancelled"

    def test_don_da_thanh_toan_thi_phai_hoan_tien_chu_khong_huy(self, api, make_user):
        user = make_user(username="cancel_paid")
        token = _build_token(user)
        order = _create_order(api, user, token)
        _set_status(order["id"], "paid")

        resp = api("patch", f"/api/orders/{order['id']}/status", {"status": "cancelled"}, token=token)

        assert resp.status_code == 400
        assert "hoàn tiền" in resp.json()["message"]

    @pytest.mark.parametrize("status", ["shipped", "in_transit", "completed"])
    def test_don_da_gui_di_thi_khong_huy_duoc(self, api, make_user, status):
        """Đã xác nhận/gửi hàng, đang vận chuyển hoặc đã giao → khách không huỷ được."""
        user = make_user(username=f"cancel_{status}")
        token = _build_token(user)
        order = _create_order(api, user, token)
        _set_status(order["id"], status)

        resp = api("patch", f"/api/orders/{order['id']}/status", {"status": "cancelled"}, token=token)

        assert resp.status_code == 400
        assert resp.json()["message"]

    def test_khong_huy_duoc_don_cua_nguoi_khac(self, api, make_user):
        owner = make_user(username="cancel_owner")
        other = make_user(username="cancel_other")
        order = _create_order(api, owner, _build_token(owner))

        resp = api(
            "patch",
            f"/api/orders/{order['id']}/status",
            {"status": "cancelled"},
            token=_build_token(other),
        )

        assert resp.status_code == 403

    def test_khach_khong_tu_danh_dau_da_thanh_toan(self, api, make_user):
        """Chống gian lận: khách không được tự đổi đơn sang `paid`."""
        user = make_user(username="cancel_fraud")
        token = _build_token(user)
        order = _create_order(api, user, token)

        resp = api("patch", f"/api/orders/{order['id']}/status", {"status": "paid"}, token=token)

        assert resp.status_code == 400

    def test_trang_thai_khong_ton_tai_bi_tu_choi(self, api, make_user):
        user = make_user(username="cancel_bad_status")
        token = _build_token(user)
        order = _create_order(api, user, token)

        resp = api("patch", f"/api/orders/{order['id']}/status", {"status": "giao_thanh_cong"}, token=token)

        assert resp.status_code == 400


class TestCustomerRefundRequest:
    """Luật: đơn đã thanh toán / đã gửi / đang giao / đã giao đều được YÊU CẦU HOÀN HÀNG."""

    @pytest.mark.parametrize("status", ["shipped", "in_transit", "completed"])
    def test_don_da_gui_hoac_da_giao_van_yeu_cau_hoan_hang_duoc(self, api, make_user, status):
        user = make_user(username=f"refund_{status}")
        token = _build_token(user)
        order = _create_order(api, user, token)
        _set_status(order["id"], status)

        resp = api(
            "patch", f"/api/orders/{order['id']}/status", {"status": "refund_requested"}, token=token
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "refund_requested"

    def test_yeu_cau_hoan_tien_khi_da_thanh_toan(self, api, make_user):
        user = make_user(username="refund_ok")
        token = _build_token(user)
        order = _create_order(api, user, token)
        _set_status(order["id"], "paid")

        resp = api(
            "patch", f"/api/orders/{order['id']}/status", {"status": "refund_requested"}, token=token
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "refund_requested"

    def test_chua_thanh_toan_thi_khong_yeu_cau_hoan_tien_duoc(self, api, make_user):
        user = make_user(username="refund_pending")
        token = _build_token(user)
        order = _create_order(api, user, token)

        resp = api(
            "patch", f"/api/orders/{order['id']}/status", {"status": "refund_requested"}, token=token
        )

        assert resp.status_code == 400
        assert "huỷ" in resp.json()["message"]

    def test_admin_xac_nhan_hoan_tien_cap_nhat_ban_ghi_thanh_toan(self, api, make_user):
        """Admin chuyển `refunded` → bản ghi payment phải đánh dấu `refunded` để không tính là tiền đã thu."""
        user = make_user(username="refund_cust")
        order = _create_order(api, user, _build_token(user))

        payment = Payment.objects.create(
            order_id=order["id"],
            payment_method="vnpay",
            payment_status="completed",
            amount=Decimal("100000.00"),
        )
        Order.objects.filter(order_id=order["id"]).update(
            status="refund_requested", payment_id=payment.payment_id
        )

        role, _created = Role.objects.get_or_create(role_name="admin")
        admin = make_user(username="refund_admin", role=role)

        resp = api(
            "patch",
            f"/api/orders/{order['id']}/status",
            {"status": "refunded"},
            token=_build_token(admin),
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "refunded"
        payment.refresh_from_db()
        assert payment.payment_status == "refunded"
