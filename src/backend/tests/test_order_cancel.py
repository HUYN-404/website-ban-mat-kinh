"""Test luật huỷ đơn / hoàn tiền của khách (apps/commerce/services.py).

Đây là "hợp đồng" nghiệp vụ: đổi luật ở services.py mà test này fail → biết ngay.
Chỉ dùng object giả (SimpleNamespace) nên không cần DB, chạy cực nhanh.
"""

from types import SimpleNamespace

import pytest

from apps.commerce.services import (
    STATUS_CANCELLED,
    STATUS_COMPLETED,
    STATUS_IN_TRANSIT,
    STATUS_PAID,
    STATUS_PENDING,
    STATUS_REFUND_REQUESTED,
    STATUS_REFUNDED,
    STATUS_RETURNED,
    STATUS_SHIPPED,
    TERMINAL_STATUSES,
    evaluate_customer_actions,
    validate_customer_transition,
)


def _order(status):
    """Đơn hàng giả — services chỉ đọc thuộc tính `status`."""
    return SimpleNamespace(status=status, order_id=1, payment_id=None, coupon_id=None)


# ── Luật: chỉ huỷ khi CHƯA thanh toán; chỉ yêu cầu hoàn tiền khi ĐÃ thanh toán ──

@pytest.mark.parametrize(
    "status,can_cancel,can_refund",
    [
        (STATUS_PENDING, True, False),           # chưa thanh toán → huỷ được
        (STATUS_PAID, False, True),              # đã thanh toán → hoàn hàng được
        (STATUS_REFUND_REQUESTED, False, False), # đang chờ xử lý → khoá
        (STATUS_SHIPPED, False, True),           # đã gửi hàng → VẪN hoàn hàng được
        (STATUS_IN_TRANSIT, False, True),        # đang vận chuyển → VẪN hoàn hàng được
        (STATUS_COMPLETED, False, True),         # đã giao → VẪN hoàn hàng được
        (STATUS_CANCELLED, False, False),        # đã huỷ → khoá
        (STATUS_REFUNDED, False, False),         # đã hoàn tiền → khoá
        (STATUS_RETURNED, False, False),         # đã trả hàng → khoá
    ],
)
def test_evaluate_customer_actions(status, can_cancel, can_refund):
    actions = evaluate_customer_actions(_order(status))

    assert actions["canCancel"] is can_cancel
    assert actions["canRequestRefund"] is can_refund


def test_blocked_reason_luon_co_khi_khong_duoc_phep():
    """Bất biến: thao tác không được phép → PHẢI có lý do tiếng Việt (không trả None)."""
    for status in (
        STATUS_PENDING,
        STATUS_PAID,
        STATUS_REFUND_REQUESTED,
        STATUS_SHIPPED,
        STATUS_COMPLETED,
    ):
        actions = evaluate_customer_actions(_order(status))
        if not actions["canCancel"]:
            assert actions["cancelBlockedReason"]
        if not actions["canRequestRefund"]:
            assert actions["refundBlockedReason"]


def test_don_da_thanh_toan_goi_y_hoan_tien():
    actions = evaluate_customer_actions(_order(STATUS_PAID))

    assert "hoàn tiền" in actions["cancelBlockedReason"]
    assert actions["refundBlockedReason"] is None


def test_don_chua_thanh_toan_khong_can_hoan_tien():
    actions = evaluate_customer_actions(_order(STATUS_PENDING))

    assert actions["cancelBlockedReason"] is None
    assert "huỷ" in actions["refundBlockedReason"]


# ── Luật: transition mà khách được phép gọi ──

def test_khach_huy_duoc_don_pending():
    ok, message = validate_customer_transition(_order(STATUS_PENDING), STATUS_CANCELLED)

    assert ok is True
    assert message == ""


def test_khach_khong_huy_duoc_don_da_thanh_toan():
    ok, message = validate_customer_transition(_order(STATUS_PAID), STATUS_CANCELLED)

    assert ok is False
    assert "hoàn tiền" in message


@pytest.mark.parametrize(
    "status", [STATUS_SHIPPED, STATUS_IN_TRANSIT, STATUS_COMPLETED, STATUS_CANCELLED, STATUS_REFUNDED, STATUS_RETURNED]
)
def test_khach_khong_huy_duoc_don_da_khoa(status):
    ok, _message = validate_customer_transition(_order(status), STATUS_CANCELLED)

    assert ok is False


def test_khach_yeu_cau_hoan_tien_duoc_khi_da_thanh_toan():
    ok, message = validate_customer_transition(_order(STATUS_PAID), STATUS_REFUND_REQUESTED)

    assert ok is True
    assert message == ""


@pytest.mark.parametrize("status", [STATUS_PENDING, STATUS_REFUND_REQUESTED, STATUS_CANCELLED, STATUS_RETURNED])
def test_khach_khong_yeu_cau_hoan_tien_o_trang_thai_khac(status):
    ok, _message = validate_customer_transition(_order(status), STATUS_REFUND_REQUESTED)

    assert ok is False


@pytest.mark.parametrize("new_status", [STATUS_PAID, STATUS_SHIPPED, STATUS_COMPLETED, STATUS_REFUNDED])
def test_khach_khong_duoc_tu_doi_sang_trang_thai_khac(new_status):
    """Khách không được tự đánh dấu đã thanh toán / đang giao / hoàn tất / đã hoàn tiền."""
    ok, message = validate_customer_transition(_order(STATUS_PENDING), new_status)

    assert ok is False
    assert message


@pytest.mark.parametrize("status", [STATUS_PAID, STATUS_SHIPPED, STATUS_IN_TRANSIT, STATUS_COMPLETED])
def test_don_da_gui_hoac_da_giao_van_yeu_cau_hoan_hang_duoc(status):
    """Yêu cầu mới của chủ dự án: hàng đã gửi/đang giao/đã giao VẪN hoàn hàng được."""
    ok, message = validate_customer_transition(_order(status), STATUS_REFUND_REQUESTED)

    assert ok is True
    assert message == ""


def test_cac_trang_thai_ket_thuc_vong_doi():
    assert set(TERMINAL_STATUSES) == {
        STATUS_COMPLETED,
        STATUS_CANCELLED,
        STATUS_REFUNDED,
        STATUS_RETURNED,
    }
