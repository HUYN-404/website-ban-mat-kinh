import re
import unicodedata
from decimal import Decimal
from typing import Any

from django.db.models import Q

from apps.catalog.views import products_queryset


MAX_PRODUCTS = 4
ACCESSORY_CATEGORY_IDS = {5}


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.lower())
    without_marks = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return without_marks.replace("đ", "d").strip()


def _format_currency(value: Decimal) -> str:
    return f"{int(value):,}".replace(",", ".") + " đ"


def _product_to_suggestion(product) -> dict[str, Any]:
    return {
        "id": product.product_id,
        "name": product.name,
        "price": float(product.price),
        "brandName": product.brand.name if product.brand_id else None,
        "categoryName": product.category.name if product.category_id else None,
        "stockQuantity": product.stock_quantity,
    }


def _only_eyewear(queryset):
    return queryset.exclude(category_id__in=ACCESSORY_CATEGORY_IDS)


def _pick_available_products(queryset, *, include_accessories: bool = False) -> list[dict[str, Any]]:
    queryset = queryset.filter(status="available", stock_quantity__gt=0)
    if not include_accessories:
        queryset = _only_eyewear(queryset)
    products = queryset[:MAX_PRODUCTS]
    return [_product_to_suggestion(product) for product in products]


def _search_products(search: str | None = None, *, include_accessories: bool = False) -> list[dict[str, Any]]:
    queryset = products_queryset().filter(status="available", stock_quantity__gt=0)
    if not include_accessories:
        queryset = _only_eyewear(queryset)
    if search:
        queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
    return [_product_to_suggestion(product) for product in queryset[:MAX_PRODUCTS]]


def _create_product_reply(intro: str, products: list[dict[str, Any]], empty_reply: str | None = None) -> str:
    if not products:
        return empty_reply or (
            "Mình chưa tìm thấy sản phẩm phù hợp trong kho hiện tại. "
            "Bạn thử nhập tên thương hiệu, dáng kính hoặc khoảng giá khác nhé."
        )

    lines = [
        f"- {product['name']} ({product['brandName'] or 'Chưa rõ thương hiệu'}): {_format_currency(Decimal(str(product['price'])))}"
        for product in products
    ]
    return intro + "\n" + "\n".join(lines)


def _extract_keyword(message: str) -> str | None:
    normalized = _normalize_text(message)
    known_brands = ["ray-ban", "ray ban", "oakley", "gentle monster", "gucci", "prada", "dior"]
    for brand in known_brands:
        if brand in normalized:
            return brand.replace(" ", "-")

    match = re.search(r"(?:tim|tìm|mau|mẫu|kinh|kính)\s+([\w\s-]{2,40})", message, flags=re.I)
    if match:
        return match.group(1).strip()
    return None


def create_chatbot_response(message: str) -> dict[str, Any]:
    original_message = message.strip()
    normalized = _normalize_text(original_message)

    if not original_message:
        return {
            "intent": "empty",
            "reply": "Bạn nhập nhu cầu cần tư vấn giúp mình nhé. Ví dụ: kính cho mặt tròn, kính Ray-Ban, chính sách bảo hành.",
            "suggestions": ["Tư vấn theo khuôn mặt", "Tìm kính Ray-Ban", "Chính sách bảo hành"],
            "products": [],
        }

    if re.search(r"mat tron|face tron|tron", normalized):
        products = _search_products("wayfarer")
        return {
            "intent": "face_shape_round",
            "reply": _create_product_reply(
                "Mặt tròn thường hợp kính vuông, chữ nhật hoặc dáng wayfarer để tạo cảm giác gọn và có góc cạnh hơn. Một vài mẫu bạn có thể tham khảo:",
                products,
                "Mặt tròn thường hợp kính vuông, chữ nhật hoặc dáng wayfarer. Hiện mình chưa tìm thấy mẫu wayfarer còn hàng, bạn có thể xem thêm trong trang sản phẩm.",
            ),
            "suggestions": ["Kính cho mặt vuông", "Kính đi nắng", "Xem kính dưới 2 triệu"],
            "products": products,
        }

    if re.search(r"mat vuong|goc canh", normalized):
        products = _search_products("round")
        return {
            "intent": "face_shape_square",
            "reply": _create_product_reply(
                "Mặt vuông thường hợp kính tròn, oval hoặc dáng bo nhẹ để cân bằng đường nét khuôn mặt. Một vài mẫu bạn có thể xem:",
                products,
                "Mặt vuông thường hợp kính tròn, oval hoặc dáng bo nhẹ. Hiện mình chưa tìm thấy mẫu còn hàng theo từ khóa này.",
            ),
            "suggestions": ["Kính cho mặt tròn", "Kính mát", "Chính sách đổi trả"],
            "products": products,
        }

    if re.search(r"can|hoc|may tinh|anh sang xanh", normalized):
        products = _search_products("optics")
        return {
            "intent": "optical_glasses",
            "reply": _create_product_reply(
                "Nếu dùng khi học tập hoặc làm việc với máy tính, bạn nên chọn gọng nhẹ, ôm vừa mặt và có thể lắp tròng chống ánh sáng xanh. Một vài mẫu phù hợp:",
                products,
            ),
            "suggestions": ["Kính mát", "Tư vấn theo khuôn mặt", "Bảo hành thế nào?"],
            "products": products,
        }

    if re.search(r"kinh mat|di nang|chong nang|sun", normalized):
        products = _search_products("sun")
        return {
            "intent": "sunglasses",
            "reply": _create_product_reply(
                "Kính mát nên ưu tiên tròng chống UV, form vừa mặt và màu tròng phù hợp nhu cầu đi nắng hằng ngày. Một vài mẫu đang có:",
                products,
            ),
            "suggestions": ["Kính cho mặt tròn", "Kính dưới 2 triệu", "Giao hàng bao lâu?"],
            "products": products,
        }

    if re.search(r"phu kien|accessor", normalized):
        products = _pick_available_products(
            products_queryset().filter(category_id__in=ACCESSORY_CATEGORY_IDS).order_by("product_id"),
            include_accessories=True,
        )
        return {
            "intent": "accessories",
            "reply": _create_product_reply(
                "Nếu bạn cần phụ kiện, mình có thể gợi ý một vài món đang có trong cửa hàng:",
                products,
                "Hiện mình chưa tìm thấy phụ kiện còn hàng. Bạn có thể xem thêm ở trang phụ kiện của website.",
            ),
            "suggestions": ["Kính mát", "Kính cận", "Chính sách bảo hành"],
            "products": products,
        }

    if re.search(r"duoi|tam gia|gia|re", normalized):
        queryset = products_queryset().filter(status="available", stock_quantity__gt=0, price__lte=2_000_000).order_by("price")
        products = _pick_available_products(queryset)
        return {
            "intent": "price_budget",
            "reply": _create_product_reply("Một vài mẫu có mức giá dễ tiếp cận trong kho hiện tại:", products),
            "suggestions": ["Kính Ray-Ban", "Kính mát", "Kính cận"],
            "products": products,
        }

    if "bao hanh" in normalized:
        return {
            "intent": "warranty",
            "reply": "Sản phẩm được hỗ trợ bảo hành theo chính sách cửa hàng. Khi nhận hàng, bạn nên giữ hóa đơn và kiểm tra gọng, tròng, phụ kiện đi kèm. Nếu cần đổi trả, hãy liên hệ sớm để được kiểm tra tình trạng sản phẩm.",
            "suggestions": ["Chính sách đổi trả", "Giao hàng bao lâu?", "Tư vấn kính cận"],
            "products": [],
        }

    if re.search(r"doi tra|tra hang", normalized):
        return {
            "intent": "returns",
            "reply": "Với đổi trả, sản phẩm nên còn nguyên trạng, chưa qua sử dụng mạnh và còn đầy đủ hộp/phụ kiện. Bạn nên liên hệ cửa hàng kèm mã đơn để được kiểm tra điều kiện đổi trả cụ thể.",
            "suggestions": ["Bảo hành thế nào?", "Theo dõi đơn hàng", "Tìm sản phẩm"],
            "products": [],
        }

    if re.search(r"giao hang|van chuyen|ship", normalized):
        return {
            "intent": "shipping",
            "reply": "Cửa hàng hỗ trợ giao hàng theo địa chỉ đặt mua. Thời gian giao phụ thuộc khu vực và đơn vị vận chuyển. Sau khi đặt hàng, bạn có thể theo dõi trạng thái trong mục đơn hàng.",
            "suggestions": ["Theo dõi đơn hàng", "Thanh toán thế nào?", "Chính sách đổi trả"],
            "products": [],
        }

    if re.search(r"thanh toan|payment|chuyen khoan", normalized):
        return {
            "intent": "payment",
            "reply": "Website hỗ trợ tạo đơn và thanh toán theo các phương thức đang hiển thị ở bước checkout. Bạn kiểm tra lại giỏ hàng, địa chỉ nhận hàng rồi chọn phương thức thanh toán phù hợp.",
            "suggestions": ["Giao hàng bao lâu?", "Xem giỏ hàng", "Tìm kính mát"],
            "products": [],
        }

    keyword = _extract_keyword(original_message)
    products = _search_products(keyword or original_message)
    return {
        "intent": "product_search" if products else "fallback",
        "reply": _create_product_reply(
            "Mình tìm thấy một vài sản phẩm có thể liên quan đến nhu cầu của bạn:",
            products,
            'Mình có thể tư vấn kính theo khuôn mặt, nhu cầu sử dụng, tầm giá hoặc thương hiệu. Bạn thử hỏi như: "mặt tròn nên đeo kính gì", "kính mát Ray-Ban", hoặc "kính dưới 2 triệu".',
        ),
        "suggestions": ["Tư vấn theo khuôn mặt", "Kính mát", "Kính dưới 2 triệu"],
        "products": products,
    }
