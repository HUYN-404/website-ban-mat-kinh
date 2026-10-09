"""Recommendation engine — Level 1 (rule-based) + Level 2 (content-based, scikit-learn).

Quy tắc:
- Có lịch sử mua (đơn completed) → gợi ý CÁ NHÂN hoá (ưu tiên cùng brand/category/giá
  của sản phẩm đã mua — Level 1, rồi nạp thêm bằng độ tương đồng nội dung — Level 2).
- Chưa có lịch sử (cold start) → trả sản phẩm PHỔ BIẾN (được mua nhiều nhất).
- Mỗi response kèm "reason" để FE biết đang chạy nhánh nào.
"""
from django.db.models import Count

from apps.catalog.models import Product
from apps.catalog.cache_utils import get_catalog, set_catalog
from apps.commerce.models import Order, OrderItem

DEFAULT_LIMIT = 8


# ── Dữ liệu đầu vào ──────────────────────────────────────


def _purchased_product_ids(user_id):
    """Id sản phẩm user đã MUA (chỉ tính đơn completed — đã thanh toán & giao)."""
    order_ids = list(
        Order.objects.filter(user_id=user_id, status="completed").values_list("order_id", flat=True)
    )
    if not order_ids:
        return []
    return list(
        OrderItem.objects.filter(order_id__in=order_ids)
        .values_list("product_id", flat=True)
        .distinct()
    )


# ── Level 1: Rule-based ──────────────────────────────────


def popular_product_ids(limit=DEFAULT_LIMIT):
    """Sản phẩm PHỔ BIẾN — đếm số lần xuất hiện trong đơn completed, cao nhất trước."""
    completed_ids = Order.objects.filter(status="completed").values_list("order_id", flat=True)
    ranked = (
        OrderItem.objects.filter(order_id__in=completed_ids)
        .values("product_id")
        .annotate(n=Count("product_id"))
        .order_by("-n", "product_id")
    )
    ids = [row["product_id"] for row in ranked]
    # Chưa đủ limit → bổ sung sản phẩm available bất kỳ (đảm bảo luôn có kết quả)
    if len(ids) < limit:
        extra = list(
            Product.objects.filter(status="available")
            .exclude(product_id__in=ids)
            .values_list("product_id", flat=True)
        )
        ids += extra
    return ids[:limit]


def _rule_based_candidates(user_id, purchased_ids, limit):
    """Level 1: chấm điểm sản phẩm chưa mua theo độ "gần" với sản phẩm đã mua."""
    purchases = list(
        Product.objects.filter(product_id__in=purchased_ids).select_related("category", "brand")
    )
    brands = {p.brand_id for p in purchases if p.brand_id}
    categories = {p.category_id for p in purchases if p.category_id}
    prices = [float(p.price) for p in purchases]
    lo = min(prices) * 0.7 if prices else 0
    hi = max(prices) * 1.3 if prices else float("inf")

    candidates = list(
        Product.objects.filter(status="available")
        .exclude(product_id__in=purchased_ids)
        .select_related("category", "brand")
    )

    def score(p):
        s = 0
        if p.brand_id in brands:
            s += 3  # cùng thương hiệu = gần nhất
        if p.category_id in categories:
            s += 2  # cùng loại (kính mát/phụ kiện...)
        if lo <= float(p.price) <= hi:
            s += 1  # giá trong khoảng ±30%
        return s

    candidates.sort(key=score, reverse=True)
    return [p.product_id for p in candidates if score(p) > 0]


# ── Level 2: Content-based (scikit-learn) ────────────────


def _feature_text(product):
    """Gộp đặc trưng văn bản của sản phẩm để đo độ giống."""
    return " ".join(
        filter(
            None,
            [
                product.name or "",
                product.category.name if product.category else "",
                product.brand.name if product.brand else "",
                " ".join(product.materials or []),
                " ".join(product.highlights or []),
            ],
        )
    )


def _similarity_matrix():
    """TF-IDF + cosine similarity toàn bộ sản phẩm available — CÓ CACHE trên Redis.

    Vì sản phẩm không đổi mỗi giây, ma trận giống nhau cho mọi request → chỉ tính 1 lần,
    các lần sau đọc từ Redis (nhanh, không query lại DB + không tính lại sklearn).

    Tự "hết hạn" khi dữ liệu đổi: key dùng chung generation của cache_utils — khi có
    sản phẩm/category/brand bị tạo-sửa-xoá → invalidate_catalog() tăng generation
    → key cũ bị bỏ → lần sau tự tính lại bản mới. Có thêm TTL 300s làm lưới an toàn.

    Trả về (list_id, matrix | None). matrix = None khi <2 sản phẩm hoặc thiếu sklearn.
    """
    cached = get_catalog("similarity_matrix")
    if cached is not None:
        return cached

    products = list(Product.objects.filter(status="available").select_related("category", "brand"))
    ids = [p.product_id for p in products]
    if len(ids) < 2:
        return ids, None
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
    except ImportError:  # chưa cài scikit-learn → về Level 1
        return ids, None

    features = [_feature_text(p) for p in products]
    matrix = cosine_similarity(TfidfVectorizer().fit_transform(features))

    result = (ids, matrix)
    set_catalog("similarity_matrix", result, timeout=300)
    return result


def similar_product_ids(product_id, limit=DEFAULT_LIMIT):
    """Sản phẩm TƯƠNG TỰ (cho trang chi tiết) — dựa cosine similarity."""
    ids, matrix = _similarity_matrix()
    if matrix is None:
        return _category_fallback(product_id, limit)
    try:
        idx = ids.index(product_id)
    except ValueError:
        return _category_fallback(product_id, limit)
    ranking = sorted(
        (i for i in range(len(ids)) if i != idx), key=lambda i: matrix[idx][i], reverse=True
    )
    return [ids[i] for i in ranking[:limit]]


def _category_fallback(product_id, limit):
    """Dự phòng khi thiếu dữ liệu/sklearn: cùng category với sản phẩm đang xem."""
    try:
        product = Product.objects.get(product_id=product_id)
    except Product.DoesNotExist:
        return []
    return list(
        Product.objects.filter(status="available", category_id=product.category_id)
        .exclude(product_id=product_id)
        .values_list("product_id", flat=True)[:limit]
    )


def _content_similar_to_user(purchased_ids, limit):
    """Level 2 cho user: lấy trung bình độ giống với TẤT CẢ sản phẩm đã mua."""
    ids, matrix = _similarity_matrix()
    if matrix is None:
        return []
    idxs = [i for i, pid in enumerate(ids) if pid in purchased_ids]
    if not idxs:
        return []
    import numpy as np

    scores = matrix[:, idxs].mean(axis=1)  # trung bình theo cột sản phẩm đã mua
    order = sorted(
        (i for i in range(len(ids)) if i not in idxs), key=lambda i: scores[i], reverse=True
    )
    return [ids[i] for i in order[:limit]]


# ── API chính ────────────────────────────────────────────


def recommend_for_user(user_id, limit=DEFAULT_LIMIT):
    """Gợi ý cho 1 user. Cold start → popular. Trả (list_id, reason)."""
    purchased_ids = _purchased_product_ids(user_id)
    if not purchased_ids:
        return popular_product_ids(limit), "popular"

    # Ưu tiên rule-based (cùng brand/category), rồi nạp thêm content-based
    rule_ids = _rule_based_candidates(user_id, purchased_ids, limit)
    content_ids = _content_similar_to_user(purchased_ids, limit)
    merged = []
    for pid in rule_ids + content_ids:
        if pid not in merged:
            merged.append(pid)

    # Vẫn chưa đủ → bổ sung sản phẩm phổ biến (loại sản phẩm đã mua)
    if len(merged) < limit:
        for pid in popular_product_ids(limit):
            if pid not in merged and pid not in purchased_ids:
                merged.append(pid)
    return merged[:limit], "personalized"
