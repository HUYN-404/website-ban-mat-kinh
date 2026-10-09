"""E2E test B12b + B12c — coupon qua route thật /api/orders + /api/orders/<id>/status.

B12b: đặt hàng kèm coupon → giảm tiền đúng, coupon_usage reserved, used_count +1,
      rollback khi mã lỗi (không tạo đơn dở).
B12c: vòng đời khi đổi trạng thái đơn (admin gọi PATCH /status):
      - completed  → reserved → consumed (giữ lượt)
      - cancelled  → reserved → released (HOÀN lượt, used_count -1) nếu không lạm dụng
      - cancelled nhiều lần + account mới → revoked + TỰ bật is_coupon_restricted
Toàn bộ dữ liệu test được dọn sạch khi chạy xong.
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from datetime import timedelta
from decimal import Decimal

from django.test import Client
from django.utils import timezone

from apps.authn.models import User
from apps.authn.views import _build_token
from apps.catalog.models import Product
from apps.commerce.models import Order, OrderItem
from apps.coupons.models import Coupon, CouponUsage

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("✅ PASS" if cond else "❌ FAIL"), "-", name, ("| " + str(detail) if detail else ""))


# ── Helpers ─────────────────────────────────────────────
_now = timezone.now()
_product = Product.objects.order_by("product_id").first()
assert _product, "Không có sản phẩm nào trong DB để test"
_SUBTOTAL = Decimal(_product.price) * 2


def cleanup_coupon(code):
    """Xoá mọi dữ liệu test còn sót của 1 mã coupon"""
    ids = list(Coupon.objects.filter(code=code).values_list("id", flat=True))
    for cu in CouponUsage.objects.filter(coupon_id__in=ids):
        OrderItem.objects.filter(order_id=cu.order_id).delete()
        Order.objects.filter(order_id=cu.order_id).delete()
        cu.delete()
    Coupon.objects.filter(code=code).delete()


def cleanup_all():
    for code in ("E2EB12B", "E2EREL", "E2ECON", "E2EABU"):
        cleanup_coupon(code)
    User.objects.filter(username__startswith="e2e_").delete()


def make_coupon(code):
    return Coupon.objects.create(
        code=code,
        discount_type="percent",
        discount_value=Decimal("10.00"),
        valid_from=_now - timedelta(days=1),
        valid_to=_now + timedelta(days=1),
        usage_limit=5,
        used_count=0,
        is_active=True,
    )


def make_user(name):
    return User.objects.create(
        username=name, password="x", full_name=name, status="active",
        is_coupon_restricted=False, created_at=_now, updated_at=_now,
    )


def api(user, method, url, data=None):
    c = Client()
    h = {"HTTP_AUTHORIZATION": f"Bearer {_build_token(user)}", "HTTP_HOST": "localhost"}
    return getattr(c, method)(url, data=data, content_type="application/json", **h)


def place_order(user, code):
    payload = {
        "userId": user.user_id,
        "items": [{"productId": _product.product_id, "quantity": 2}],
        "couponCode": code,
    }
    r = api(user, "post", "/api/orders", payload)
    assert r.status_code == 201, f"place_order thất bại: {r.status_code} {r.content[:300]}"
    return r.json()["data"]


def set_status(user, order_id, status):
    return api(user, "patch", f"/api/orders/{order_id}/status", {"status": status})


def get_usage(order_id, coupon_id):
    return CouponUsage.objects.filter(order_id=order_id, coupon_id=coupon_id).first()


# ── Dọn từ lần chạy trước ───────────────────────────────
cleanup_all()

print(f"→ Product #{_product.product_id} giá {_product.price} x2 = subtotal {_SUBTOTAL}\n")

# ═══ B12b: ĐẶT HÀNG + COUPON ═══
u0 = make_user("e2e_b12b_u0")
c0 = make_coupon("E2EB12B")
order0 = place_order(u0, "E2EB12B")

print("── B12b: Đặt hàng + mã hợp lệ ──")
expected_total = _SUBTOTAL * Decimal("0.9")
check("totalAmount đã trừ 10%", Decimal(str(order0["totalAmount"])) == expected_total,
      f"total={order0['totalAmount']}")
check("discountAmount đúng", Decimal(str(order0["discountAmount"])) == _SUBTOTAL * Decimal("0.1"))
check("couponId + couponCode lưu", order0["couponId"] == c0.id and order0["couponCode"] == "E2EB12B")
u0_usage = get_usage(order0["id"], c0.id)
check("CouponUsage reserved", u0_usage and u0_usage.status == "reserved")
c0.refresh_from_db()
check("used_count = 1", c0.used_count == 1)

# ═══ B12c-A: HUỶ ĐƠN BÌNH THƯỜNG → released (hoàn lượt) ═══
u1 = make_user("e2e_rel_u1")
c1 = make_coupon("E2EREL")
o1 = place_order(u1, "E2EREL")

print("\n── B12c-A: Huỷ đơn bình thường → hoàn lượt ──")
r = set_status(u1, o1["id"], "cancelled")
check("PATCH cancelled -> 200", r.status_code == 200, f"status={r.status_code}")
u1_usage = get_usage(o1["id"], c1.id)
check("usage -> released", u1_usage and u1_usage.status == "released")
c1.refresh_from_db()
check("used_count hoàn về 0", c1.used_count == 0, f"used_count={c1.used_count}")
r = api(u1, "post", "/api/coupons/validate", {"code": "E2EREL"})
check("user dùng lại được (released không chặn)", r.status_code == 200, f"status={r.status_code}")
check("user KHÔNG bị chặn coupon", not User.objects.get(user_id=u1.user_id).is_coupon_restricted)

# ═══ B12c-B: ĐƠN HOÀN TẤT → consumed ═══
u2 = make_user("e2e_con_u2")
c2 = make_coupon("E2ECON")
o2 = place_order(u2, "E2ECON")

print("\n── B12c-B: Đơn hoàn tất → consumed ──")
r = set_status(u2, o2["id"], "completed")
check("PATCH completed -> 200", r.status_code == 200, f"status={r.status_code}")
u2_usage = get_usage(o2["id"], c2.id)
check("usage -> consumed", u2_usage and u2_usage.status == "consumed")
c2.refresh_from_db()
check("used_count vẫn 1 (lượt đã dùng thật)", c2.used_count == 1, f"used_count={c2.used_count}")
r = api(u2, "post", "/api/coupons/validate", {"code": "E2ECON"})
check("user KHÔNG dùng lại được (consumed chặn)", r.status_code == 400, f"status={r.status_code}")

# ═══ B12c-C: HUỶ ĐƠN LẶP + ACCOUNT MỚI → revoked + tự chặn ═══
u3 = make_user("e2e_abuse_u3")
c3 = make_coupon("E2EABU")

print("\n── B12c-C: Lạm dụng (huỷ lặp + account mới) → revoked + chặn ──")
oa = place_order(u3, "E2EABU")
set_status(u3, oa["id"], "cancelled")
ua = get_usage(oa["id"], c3.id)
check("Lần 1 huỷ -> released (chưa đủ điểm)", ua and ua.status == "released")
check("Lần 1: CHƯA bị chặn", not User.objects.get(user_id=u3.user_id).is_coupon_restricted)
c3.refresh_from_db()
check("Lần 1: used_count về 0", c3.used_count == 0, f"used_count={c3.used_count}")

ob = place_order(u3, "E2EABU")   # used_count lên 1 (reserved)
r = set_status(u3, ob["id"], "cancelled")
ub = get_usage(ob["id"], c3.id)
check("Lần 2 huỷ -> revoked (đủ điểm abuse)", ub and ub.status == "revoked",
      f"usage.status={ub.status if ub else None}")
check("TỰ bật is_coupon_restricted", User.objects.get(user_id=u3.user_id).is_coupon_restricted)
c3.refresh_from_db()
check("used_count KHÔNG hoàn (vẫn 1, bị phạt)", c3.used_count == 1, f"used_count={c3.used_count}")
r = api(u3, "post", "/api/coupons/validate", {"code": "E2EABU"})
check("validate -> 403 (bị chặn coupon)", r.status_code == 403, f"status={r.status_code}")

# ═══ Idempotent: gọi status lần 2 không đổi gì ═══
print("\n── Idempotent: đổi trạng thái lần 2 ──")
r2 = set_status(u1, o1["id"], "cancelled")
check("Huỷ lại lần 2 -> 200, không crash", r2.status_code == 200, f"status={r2.status_code}")
c1.refresh_from_db()
check("used_count KHÔNG đổi (không trừ 2 lần)", c1.used_count == 0, f"used_count={c1.used_count}")
u1_usage2 = get_usage(o1["id"], c1.id)
check("usage vẫn released (không đổi)", u1_usage2 and u1_usage2.status == "released")

# ── Dọn dẹp ─────────────────────────────────────────────
cleanup_all()

failed = sum(1 for _, ok in results if not ok)
print(f"\n═══ KẾT QUẢ: {'TẤT CẢ PASS ✅' if failed == 0 else f'{failed} test FAIL ❌'} ═══")
