"""Helper phân quyền dùng chung giữa các app."""

from apps.common.responses import error


def is_admin(user) -> bool:
    """True nếu user có vai trò admin/staff (dùng để chặn các thao tác quản trị)."""
    if not user or not getattr(user, "is_authenticated", False):
        return False

    role_name = getattr(user, "role_name", None)
    if role_name is None and getattr(user, "role", None):
        role_name = user.role.role_name

    return bool(role_name and role_name.lower() in ("admin", "staff"))


def require_admin(user, request=None):
    """Chặn thao tác quản trị ở tầng API.

    Trả về Response 403 nếu user không thuộc nhóm admin/staff, ngược lại trả None.
    Dùng chung cho mọi app để tránh lặp lại khối kiểm tra quyền (DRY):

        denied = require_admin(request.user, request)
        if denied:
            return denied
    """
    if is_admin(user):
        return None
    return error(
        "Bạn không có quyền thực hiện thao tác quản trị.",
        request_id=getattr(request, "request_id", None),
        status=403,
    )
