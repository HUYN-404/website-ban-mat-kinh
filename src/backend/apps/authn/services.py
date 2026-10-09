"""Nghiệp vụ dùng chung của app `authn` — tách khỏi views để tránh lặp logic."""

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def build_reset_link(token: str) -> str:
    """Dựng link đặt lại mật khẩu trỏ về STOREFRONT (không trỏ về API)."""
    return f"{settings.FRONTEND_BASE_URL}/dat-lai-mat-khau?token={token}"


def send_reset_email(user, reset_link: str) -> bool:
    """Gửi email chứa link đặt lại mật khẩu tới email thật của khách.

    Trả về True nếu gửi được. KHÔNG ném exception ra ngoài: lỗi SMTP không được
    làm lộ việc email có tồn tại hay không, cũng không làm sập API.
    """
    subject = "SeeU Eyewear — Đặt lại mật khẩu"
    body = (
        f"Xin chào {user.full_name or user.username},\n\n"
        "Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản SeeU Eyewear.\n"
        "Nhấn vào liên kết dưới đây để tạo mật khẩu mới:\n\n"
        f"{reset_link}\n\n"
        "Liên kết chỉ có hiệu lực trong 1 giờ và chỉ sử dụng được một lần.\n"
        "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.\n\n"
        "Trân trọng,\n"
        "SeeU Eyewear"
    )
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        return True
    except Exception as exc:
        # SMTP sai cấu hình / mất mạng → log lại để debug, không lộ ra ngoài
        logger.error("Gửi email đặt lại mật khẩu thất bại (user_id=%s): %s", user.user_id, exc)
        return False
