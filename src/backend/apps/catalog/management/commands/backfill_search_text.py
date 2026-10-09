"""Management command: sinh cột search_text cho sản phẩm đã có.

Chạy 1 lần sau khi ALTER bảng products (thêm cột search_text + FULLTEXT index):
    .\\.venv\\Scripts\\python.exe manage.py backfill_search_text

Không cần nhập tay dữ liệu — tự cuốn từ name/brand/description có sẵn.
"""
from django.core.management.base import BaseCommand

from apps.catalog.models import Brand, Product
from apps.catalog.search import build_search_text


class Command(BaseCommand):
    help = "Sinh products.search_text (bản bỏ dấu) cho toàn bộ sản phẩm"

    def handle(self, *args, **options):
        brand_names = {b.brand_id: b.name for b in Brand.objects.all()}
        updated = 0
        for product in Product.objects.all().iterator():
            brand_name = brand_names.get(product.brand_id, "")
            search_text = build_search_text(product.name, brand_name, product.description)
            if product.search_text != search_text:
                Product.objects.filter(product_id=product.product_id).update(search_text=search_text)
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Đã cập nhật search_text cho {updated} sản phẩm."))
