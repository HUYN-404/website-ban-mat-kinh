"""Unit test cho các hàm THUẦN (không cần DB) — kiểm tra đúng 1 hàm, nhanh.

Khác các file integration (test_auth/order_coupon/...) vốn gọi API + DB thật:
ở đây KHÔNG dùng marker django_db.
"""
from decimal import Decimal

from apps.catalog.search import build_search_text, normalize_search_text
from apps.coupons.models import Coupon
from apps.coupons.services import abuse_score, compute_discount


class TestNormalizeSearchText:
    """Chuẩn hoá chuỗi tìm kiếm: bỏ dấu, lowercase, loại ký tự đặc biệt."""

    def test_removes_vietnamese_accents(self):
        assert normalize_search_text("Kính Mát Ray-Ban") == "kinh mat ray ban"

    def test_d_to_d_lowercase(self):
        assert normalize_search_text("Đẹp Độc Đáo") == "dep doc dao"

    def test_removes_punctuation_and_collapses_spaces(self):
        assert normalize_search_text("  Aviator!! 2025 ... ") == "aviator 2025"

    def test_empty_returns_empty(self):
        assert normalize_search_text("") == ""
        assert normalize_search_text(None) == ""


class TestBuildSearchText:
    """Ghép nhiều trường thành chuỗi tìm kiếm, bỏ qua phần rỗng."""

    def test_joins_only_nonempty_parts(self):
        assert (
            build_search_text("Ray-Ban", "", "Kính mát cao cấp")
            == "ray ban kinh mat cao cap"
        )


class TestComputeDiscount:
    """Tính tiền giảm cho coupon percent/fixed."""

    def test_percent_discount(self):
        coupon = Coupon(discount_type="percent", discount_value=Decimal("10"))
        assert compute_discount(coupon, Decimal("2000000")) == Decimal("200000")

    def test_fixed_discount(self):
        coupon = Coupon(discount_type="fixed", discount_value=Decimal("50000"))
        assert compute_discount(coupon, Decimal("300000")) == Decimal("50000")

    def test_fixed_cannot_exceed_subtotal(self):
        coupon = Coupon(discount_type="fixed", discount_value=Decimal("500000"))
        assert compute_discount(coupon, Decimal("300000")) == Decimal("300000")


class TestAbuseScore:
    """Điểm nghi ngờ lạm dụng (hàm thuần) — >=5 là nghi ngờ."""

    def test_normal_user_low_score(self):
        # 1 đơn hủy, tài khoản cũ 100 ngày, chưa từng bị revoked
        assert abuse_score(cancels=1, total_orders=3, account_age_days=100, repeat_revoked=0) == 0

    def test_four_cancels_is_abuse(self):
        assert abuse_score(cancels=4, total_orders=5, account_age_days=100, repeat_revoked=0) >= 5

    def test_two_cancels_plus_new_account_is_abuse(self):
        # 2 lần hủy (+2) + account mới (<1 ngày, +3) = 5 → nghi ngờ
        assert abuse_score(cancels=2, total_orders=2, account_age_days=0.5, repeat_revoked=0) == 5

    def test_high_cancel_ratio_adds_points(self):
        # 3/4 hủy: 2 (>=2 hủy) + 4 (tỷ lệ 75% >= 70%) = 6
        assert abuse_score(cancels=3, total_orders=4, account_age_days=100, repeat_revoked=0) == 6

    def test_repeat_revoked_adds_points(self):
        assert abuse_score(cancels=1, total_orders=2, account_age_days=100, repeat_revoked=2) == 3

    def test_young_account_with_two_cancels_but_under_threshold(self):
        # account 3 ngày (+2) + 2 hủy (+2) = 4 → chưa phạt
        assert abuse_score(cancels=2, total_orders=2, account_age_days=3, repeat_revoked=0) == 4
