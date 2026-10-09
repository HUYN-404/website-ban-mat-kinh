"""Sinh file Excel (.xlsx) tối giản — KHÔNG cần thư viện ngoài.

Lý do tự viết: máy dự án bị chặn PyPI (không cài được openpyxl/xlsxwriter), mà file .xlsx
thực chất chỉ là một file ZIP chứa vài XML theo chuẩn OOXML. Ở đây chỉ dựng phần tối thiểu:

    [Content_Types].xml
    _rels/.rels
    xl/workbook.xml
    xl/_rels/workbook.xml.rels
    xl/worksheets/sheet1.xml   ← dữ liệu (dùng inline string nên khỏi cần sharedStrings)

Kết quả mở được bằng Excel / LibreOffice / Google Sheets.
"""

import io
import zipfile
from datetime import date, datetime
from decimal import Decimal
from xml.sax.saxutils import escape

_CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    "</Types>"
)

_ROOT_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    "</Relationships>"
)

_WORKBOOK_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
    "</Relationships>"
)


def _col_letter(index: int) -> str:
    """0 → A, 25 → Z, 26 → AA ..."""
    letters = ""
    index += 1
    while index:
        index, remainder = divmod(index - 1, 26)
        letters = chr(65 + remainder) + letters
    return letters


def _cell(value, row_index: int, col_index: int) -> str:
    """Một ô: số để nguyên dạng number, còn lại dùng inline string."""
    if value is None or value == "":
        return ""

    ref = f"{_col_letter(col_index)}{row_index}"

    if isinstance(value, bool):
        return f'<c r="{ref}" t="b"><v>{1 if value else 0}</v></c>'

    if isinstance(value, (int, float, Decimal)):
        return f'<c r="{ref}"><v>{float(value)}</v></c>'

    if isinstance(value, (datetime, date)):
        value = value.strftime("%d/%m/%Y %H:%M")

    return f'<c r="{ref}" t="inlineStr"><is><t>{escape(str(value))}</t></is></c>'


def _sheet_xml(title: str, headers: list, rows: list) -> str:
    """Dòng 1 = tiêu đề báo cáo, dòng 2 = header cột, từ dòng 3 là dữ liệu."""
    lines = [
        '<row r="1"><c r="A1" t="inlineStr"><is><t>' + escape(title) + "</t></is></c></row>",
    ]
    header_cells = "".join(_cell(value, 2, idx) for idx, value in enumerate(headers))
    lines.append(f'<row r="2">{header_cells}</row>')

    for row_number, row in enumerate(rows, start=3):
        cells = "".join(_cell(value, row_number, idx) for idx, value in enumerate(row))
        lines.append(f'<row r="{row_number}">{cells}</row>')

    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f"<sheetData>{''.join(lines)}</sheetData></worksheet>"
    )


def build_xlsx(title: str, headers: list, rows: list, sheet_name: str = "BaoCao") -> bytes:
    """Trả về nội dung file .xlsx dạng bytes để nhét vào HttpResponse."""
    workbook = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f'<sheets><sheet name="{escape(sheet_name)}" sheetId="1" r:id="rId1"/></sheets>'
        "</workbook>"
    )

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", _CONTENT_TYPES)
        archive.writestr("_rels/.rels", _ROOT_RELS)
        archive.writestr("xl/workbook.xml", workbook)
        archive.writestr("xl/_rels/workbook.xml.rels", _WORKBOOK_RELS)
        archive.writestr("xl/worksheets/sheet1.xml", _sheet_xml(title, headers, rows))

    return buffer.getvalue()
