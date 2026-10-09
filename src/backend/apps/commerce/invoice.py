"""Sinh hoá đơn PDF cho một đơn hàng (dùng reportlab).

Tách riêng khỏi `services.py` vì đây là việc **xuất tài liệu**, không phải logic nghiệp vụ đơn hàng.
Hàm `build_invoice_pdf` nhận dữ liệu đã chuẩn bị sẵn (order + items + customer) nên có thể
test độc lập mà không cần truy vấn DB.
"""

from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

GOLD = colors.HexColor("#b98b3b")
CHARCOAL = colors.HexColor("#1f1f1f")
MUTED = colors.HexColor("#6b6b6b")
LINE = colors.HexColor("#e5e5e5")

SHOP_NAME = "SeeU Eyewear"
SHOP_TAGLINE = "Kính mắt cao cấp — chế tác thủ công"
SHOP_CONTACT = "SeeU Studio · hello@seeu.vn · Hotline 1900 0000"

STATUS_LABELS = {
    "pending": "Chờ xác nhận",
    "paid": "Đã thanh toán",
    "shipped": "Đang giao hàng",
    "completed": "Hoàn tất",
    "cancelled": "Đã huỷ",
}


def _money(value) -> str:
    """Định dạng tiền kiểu Việt Nam: 1.250.000 đ"""
    return f"{int(Decimal(str(value or 0))):,}".replace(",", ".") + " đ"


def _styles():
    base = getSampleStyleSheet()
    return {
        "shop": ParagraphStyle(
            "ShopName", parent=base["Title"], fontName="Helvetica-Bold",
            fontSize=20, textColor=CHARCOAL, alignment=0, spaceAfter=2,
        ),
        "muted": ParagraphStyle("Muted", parent=base["Normal"], fontSize=9, textColor=MUTED),
        "title": ParagraphStyle(
            "InvoiceTitle", parent=base["Title"], fontName="Helvetica-Bold",
            fontSize=18, textColor=GOLD, alignment=2, spaceAfter=4,
        ),
        "meta": ParagraphStyle(
            "Meta", parent=base["Normal"], fontSize=10, textColor=CHARCOAL, alignment=2,
        ),
        "section": ParagraphStyle(
            "Section", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=11, textColor=CHARCOAL, spaceBefore=6, spaceAfter=4,
        ),
        "body": ParagraphStyle("Body", parent=base["Normal"], fontSize=10, textColor=CHARCOAL),
        "small": ParagraphStyle("Small", parent=base["Normal"], fontSize=9, textColor=MUTED),
    }


def build_invoice_pdf(order, items, customer=None) -> bytes:
    """Trả về nội dung PDF (bytes) của hoá đơn.

    - `order`: object có `order_id`, `created_at`, `status`, `total_amount`, `discount_amount`
    - `items`: list[dict] — {"name": str, "quantity": int, "unit_price": Decimal|str|float}
    - `customer`: object tuỳ chọn có `full_name`, `username`, `email`
    """
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"Hoa don {getattr(order, 'order_id', '')}",
        author=SHOP_NAME,
    )

    style = _styles()
    story = []

    # --- Đầu hoá đơn: thông tin shop bên trái, số hoá đơn bên phải ---
    created_at = getattr(order, "created_at", None)
    created_text = created_at.strftime("%d/%m/%Y %H:%M") if created_at else "—"
    status_text = STATUS_LABELS.get(getattr(order, "status", ""), getattr(order, "status", "") or "—")

    header_left = [
        Paragraph(SHOP_NAME, style["shop"]),
        Paragraph(SHOP_TAGLINE, style["muted"]),
        Paragraph(SHOP_CONTACT, style["muted"]),
    ]
    header_right = [
        Paragraph("HOÁ ĐƠN", style["title"]),
        Paragraph(f"Mã đơn: <b>#{getattr(order, 'order_id', '—')}</b>", style["meta"]),
        Paragraph(f"Ngày tạo: {created_text}", style["meta"]),
        Paragraph(f"Trạng thái: {status_text}", style["meta"]),
    ]

    header = Table([[header_left, header_right]], colWidths=[95 * mm, 79 * mm])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(header)
    story.append(Table([[""]], colWidths=[174 * mm], rowHeights=[1],
                       style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), GOLD)])))
    story.append(Spacer(1, 10))

    # --- Thông tin khách hàng ---
    customer_name = getattr(customer, "full_name", None) or getattr(customer, "username", None) or "Khách lẻ"
    customer_email = getattr(customer, "email", None) or "—"
    story.append(Paragraph("Khách hàng", style["section"]))
    story.append(Paragraph(f"<b>{customer_name}</b>", style["body"]))
    story.append(Paragraph(f"Email: {customer_email}", style["small"]))
    story.append(Spacer(1, 10))

    # --- Bảng sản phẩm ---
    table_data = [["#", "Sản phẩm", "SL", "Đơn giá", "Thành tiền"]]
    subtotal = Decimal("0")

    for index, item in enumerate(items, start=1):
        quantity = int(item.get("quantity") or 0)
        unit_price = Decimal(str(item.get("unit_price") or 0))
        line_total = unit_price * quantity
        subtotal += line_total
        table_data.append([
            str(index),
            str(item.get("name") or "—"),
            str(quantity),
            _money(unit_price),
            _money(line_total),
        ])

    if len(table_data) == 1:
        table_data.append(["-", "Chưa có sản phẩm", "-", "-", "-"])

    items_table = Table(table_data, colWidths=[10 * mm, 84 * mm, 14 * mm, 33 * mm, 33 * mm], repeatRows=1)
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), CHARCOAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#faf8f4")]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 12))

    # --- Tổng kết tiền ---
    discount = Decimal(str(getattr(order, "discount_amount", 0) or 0))
    total = Decimal(str(getattr(order, "total_amount", 0) or 0))

    totals = Table(
        [
            ["Tạm tính", _money(subtotal)],
            ["Giảm giá", f"-{_money(discount)}" if discount > 0 else "0 đ"],
            ["Tổng thanh toán", _money(total)],
        ],
        colWidths=[40 * mm, 40 * mm],
        hAlign="RIGHT",
    )
    totals.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TEXTCOLOR", (0, 1), (0, 1), colors.HexColor("#2f7d5d")),
        ("TEXTCOLOR", (1, 1), (1, 1), colors.HexColor("#2f7d5d")),
        ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 2), (-1, 2), CHARCOAL),
        ("LINEABOVE", (0, 2), (-1, 2), 0.8, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(totals)
    story.append(Spacer(1, 18))

    story.append(Paragraph(
        "Cảm ơn bạn đã tin chọn SeeU Eyewear. Hoá đơn này được tạo tự động từ hệ thống quản trị.",
        style["small"],
    ))

    document.build(story)
    return buffer.getvalue()
