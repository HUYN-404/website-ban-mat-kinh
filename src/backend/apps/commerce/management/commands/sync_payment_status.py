# -*- coding: utf-8 -*-
"""Đồng bộ `payments.payment_status` theo trạng thái đơn hàng.

Dùng khi dữ liệu bị lệch (đơn `paid` mà giao dịch vẫn `pending`) — thường gặp với dữ liệu cũ
được nhập trước khi có luật đồng bộ trong `apps/commerce/services.py`.

Cách dùng::

    python manage.py sync_payment_status --dry-run   # chỉ xem trước, KHÔNG ghi DB
    python manage.py sync_payment_status             # thực hiện

Chạy lại nhiều lần vô hại (idempotent): chỉ cập nhật bản ghi đang lệch.
"""
import sys

from django.core.management.base import BaseCommand

from apps.commerce.models import Order, Payment
from apps.commerce.services import payment_status_for_order_status


class Command(BaseCommand):
    help = "Đồng bộ trạng thái thanh toán theo trạng thái đơn hàng (đơn đã thu tiền → completed)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Chỉ liệt kê những gì sẽ đổi, không ghi vào DB.",
        )

    def handle(self, *args, **options):
        # Console Windows (cp1252) không encode được tiếng Việt khi xuất ra pipe/file
        # → UnicodeEncodeError làm lệnh dừng giữa đường. Ép UTF-8 cho chắc.
        for stream in (sys.stdout, sys.stderr):
            if hasattr(stream, "reconfigure"):
                stream.reconfigure(encoding="utf-8", errors="replace")

        dry_run = options["dry_run"]
        total = 0

        for order in Order.objects.all().only("order_id", "status", "payment_id").order_by("order_id"):
            target = payment_status_for_order_status(order.status)
            if not target:
                continue

            queryset = Payment.objects.filter(order_id=order.order_id)
            if order.payment_id:
                queryset = queryset.filter(payment_id=order.payment_id)
            queryset = queryset.exclude(payment_status=target)

            count = queryset.count()
            if not count:
                continue

            payment_ids = ", ".join(str(value) for value in queryset.values_list("payment_id", flat=True))
            action = "sẽ đổi" if dry_run else "đã đổi"
            self.stdout.write(
                f"  đơn #{order.order_id} ({order.status}) → payment [{payment_ids}] {action} thành '{target}'"
            )
            if not dry_run:
                queryset.update(payment_status=target)
            total += count

        prefix = "[DRY-RUN] " if dry_run else ""
        if total:
            self.stdout.write(self.style.SUCCESS(f"{prefix}Đã xử lý {total} bản ghi thanh toán."))
        else:
            self.stdout.write(self.style.SUCCESS(f"{prefix}Không có bản ghi nào lệch — dữ liệu đã đồng bộ."))
