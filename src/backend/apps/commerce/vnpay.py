"""Tích hợp cổng thanh toán **VNPay**: tạo URL thanh toán + xác thực dữ liệu trả về.

Quy tắc VNPay (phiên bản 2.1.0):
- Tham số gửi đi phải **sắp xếp theo tên** (a→z) rồi ký bằng HMAC-SHA512 với `vnp_HashSecret`.
- `vnp_Amount` phải **nhân 100** (VNPay dùng đơn vị nhỏ nhất).
- Khi VNPay redirect về, ta **ký lại** tham số nhận được và so sánh với `vnp_SecureHash` để chống giả mạo.
"""

import hashlib
import hmac
from datetime import datetime
from urllib.parse import quote_plus

from django.conf import settings

# Tham số KHÔNG tham gia vào việc ký
_EXCLUDED_KEYS = {"vnp_SecureHash", "vnp_SecureHashType"}


def _is_configured() -> bool:
    return bool(settings.VNPAY_TMN_CODE and settings.VNPAY_HASH_SECRET)


def _sorted_query(params: dict) -> str:
    sorted_items = sorted(params.items())
    return "&".join(f"{quote_plus(key)}={quote_plus(str(value))}" for key, value in sorted_items)


def _sign(query: str) -> str:
    return hmac.new(
        settings.VNPAY_HASH_SECRET.encode("utf-8"),
        query.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()


def build_payment_url(
    *,
    order_id: int,
    amount,
    order_info: str,
    ip_address: str = "127.0.0.1",
    locale: str = "vn",
    bank_code: str | None = None,
) -> str:
    """Tạo URL thanh toán VNPay cho một đơn hàng."""
    if not _is_configured():
        raise ValueError("Chưa cấu hình VNPay (VNPAY_TMN_CODE / VNPAY_HASH_SECRET).")

    created_at = datetime.now()
    params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": settings.VNPAY_TMN_CODE,
        "vnp_Locale": locale,
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": str(order_id),
        "vnp_OrderInfo": order_info,
        "vnp_OrderType": "other",
        "vnp_Amount": int(round(float(amount))) * 100,  # VNPay yêu cầu nhân 100
        "vnp_ReturnUrl": settings.VNPAY_RETURN_URL,
        "vnp_IpAddr": ip_address or "127.0.0.1",
        "vnp_CreateDate": created_at.strftime("%Y%m%d%H%M%S"),
    }
    if bank_code:
        params["vnp_BankCode"] = bank_code

    query = _sorted_query(params)
    return f"{settings.VNPAY_PAYMENT_URL}?{query}&vnp_SecureHash={_sign(query)}"


def verify_return_params(params: dict) -> bool:
    """Kiểm tra chữ ký của dữ liệu VNPay gửi về (so sánh HMAC-SHA512)."""
    if not _is_configured():
        return False

    received_hash = params.get("vnp_SecureHash", "")
    if not received_hash:
        return False

    data = {
        key: value
        for key, value in params.items()
        if key.startswith("vnp_") and key not in _EXCLUDED_KEYS
    }
    expected_hash = _sign(_sorted_query(data))
    return hmac.compare_digest(expected_hash, received_hash)
