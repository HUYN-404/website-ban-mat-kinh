"""Hỗ trợ tìm kiếm sản phẩm — chuẩn hoá tiếng Việt + FULLTEXT.

Vì MySQL FULLTEXT không tự bỏ dấu tiếng Việt, ta lưu thêm cột products.search_text
(bản đã bỏ dấu + lowercase của name/brand/description) rồi tìm trên cột đó.
"""
import re
import unicodedata

from django.db import connection


def normalize_search_text(value=""):
    """Chuẩn hoá chuỗi tìm kiếm: bỏ dấu tiếng Việt, lowercase, bỏ ký tự đặc biệt.

    Ví dụ: 'Kính Mát Ray-Ban 2025!' → 'kinh mat ray ban 2025'
    """
    if not value:
        return ""
    text = unicodedata.normalize("NFD", str(value))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")  # bỏ dấu
    text = text.lower().replace("đ", "d")
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build_search_text(name, brand_name="", description=""):
    """Ghép các trường sản phẩm thành 1 chuỗi đã chuẩn hoá (cho cột search_text)."""
    parts = [
        normalize_search_text(name),
        normalize_search_text(brand_name),
        normalize_search_text(description),
    ]
    return " ".join(p for p in parts if p)


def search_product_ids(term):
    """Tìm id sản phẩm bằng FULLTEXT MATCH...AGAINST trên search_text.

    Trả về list id sắp theo độ liên quan; trả [] nếu chưa có index hoặc không khớp
    (caller sẽ fallback sang LIKE).
    """
    try:
        # Boolean mode: +token* = từ phải xuất hiện (dạng prefix). Nối các token của cụm.
        boolean_query = " ".join(f"+{token}*" for token in term.split()[:5])
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT product_id
                FROM products
                WHERE MATCH(search_text) AGAINST(%s IN BOOLEAN MODE)
                ORDER BY MATCH(search_text) AGAINST(%s IN BOOLEAN MODE) DESC
                LIMIT 200
                """,
                [boolean_query, boolean_query],
            )
            return [row[0] for row in cursor.fetchall()]
    except Exception:
        # Chưa có FULLTEXT index / cột search_text → để caller fallback sang LIKE
        return []
