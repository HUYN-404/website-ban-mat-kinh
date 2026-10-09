"""Cache helper cho catalog — dùng kỹ thuật "version generation" để vô hiệu hoá dễ dàng.

Cách hoạt động (đọc thêm trong settings.CACHES):
- Mỗi key cache đều nhúng "generation" (số phiên bản):  catalog:v3:categories
- Khi dữ liệu thay đổi (thêm/sửa/xoá product, category, brand...)
  → gọi invalidate_catalog() → TĂNG generation lên 1
  → các key cũ (v1, v2...) không còn được đọc → xem như cache đã hết hạn NGAY.
- Giống hệt "cache busting" (?v=...) mà trình duyệt dùng khi deploy asset mới.

An toàn: nếu Redis chưa chạy/lỗi, mọi hàm tự bỏ qua → chỉ mất lợi ích cache,
KHÔNG làm chết request (caller sẽ tự truy vấn DB như bình thường).
"""
import time

from django.core.cache import cache

GENERATION_KEY = "catalog:generation"
DEFAULT_TIMEOUT = 300  # giây

# ── "Ngắt mạch" khi Redis chết ──
# Redis tắt → mỗi lần gọi cache phải chờ timeout kết nối (~2s) → request rất chậm.
# Sau lần lỗi ĐẦU TIÊN, bỏ qua cache 60s (truy vấn thẳng DB) → request lại nhanh.
_DOWN_UNTIL = 0.0
_DOWN_COOLDOWN = 60.0


def _cache_alive():
    return time.monotonic() >= _DOWN_UNTIL


def _trip_breaker():
    global _DOWN_UNTIL
    _DOWN_UNTIL = time.monotonic() + _DOWN_COOLDOWN


def _generation():
    """Đọc generation hiện tại (mặc định 1 nếu chưa có)."""
    try:
        return cache.get(GENERATION_KEY, 1)
    except Exception:
        _trip_breaker()
        return None


def _key(name, parts):
    """Tạo tên key duy nhất theo version + tên + các thành phần (bộ lọc)."""
    gen = _generation() or 1
    suffix = ":".join(str(p) for p in parts) if parts else "all"
    return f"catalog:v{gen}:{name}:{suffix}"


def get_catalog(name, *parts):
    """Đọc cache. Trả None nếu miss hoặc Redis lỗi → caller tự truy vấn DB."""
    if not _cache_alive():
        return None
    try:
        return cache.get(_key(name, parts))
    except Exception:
        _trip_breaker()
        return None


def set_catalog(name, value, *parts, timeout=DEFAULT_TIMEOUT):
    """Ghi cache kèm TTL (tự xoá sau timeout giây)."""
    if not _cache_alive():
        return
    try:
        cache.set(_key(name, parts), value, timeout=timeout)
    except Exception:
        _trip_breaker()


def invalidate_catalog():
    """Tăng generation → toàn bộ key catalog cũ đều không được đọc nữa."""
    if not _cache_alive():
        return
    try:
        cache.incr(GENERATION_KEY)
    except Exception:
        # Key chưa tồn tại → tạo = 2 (vì 1 là mặc định đã đọc trước đó)
        try:
            cache.set(GENERATION_KEY, 2)
        except Exception:
            _trip_breaker()
