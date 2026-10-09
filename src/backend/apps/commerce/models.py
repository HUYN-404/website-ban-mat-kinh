from django.db import models
from django.utils import timezone


class Cart(models.Model):
    cart_id = models.AutoField(primary_key=True)
    user_id = models.IntegerField()
    status = models.CharField(max_length=32, default="active")
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "carts"


class CartItem(models.Model):
    cart_item_id = models.AutoField(primary_key=True)
    cart_id = models.IntegerField()
    product_id = models.IntegerField()
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "cart_items"


class Order(models.Model):
    order_id = models.AutoField(primary_key=True)
    user_id = models.IntegerField()
    status = models.CharField(max_length=32, default="pending")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # snapshot tiền giảm
    coupon_id = models.IntegerField(null=True, blank=True)  # mã đã dùng cho đơn này (nullable)
    payment_id = models.IntegerField(null=True, blank=True)
    # default=now: nếu không, Django ghi NULL bỏ qua CURRENT_TIMESTAMP của MySQL
    # → is_abuse() (đếm hủy đơn trong 30 ngày) sẽ không hoạt động
    created_at = models.DateTimeField(
        db_column="order_date", null=True, blank=True, default=timezone.now
    )

    class Meta:
        managed = False
        db_table = "orders"


class OrderItem(models.Model):
    order_item_id = models.AutoField(primary_key=True)
    order_id = models.IntegerField()
    product_id = models.IntegerField()
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        managed = False
        db_table = "orders_items"


class Payment(models.Model):
    payment_id = models.AutoField(primary_key=True)
    order_id = models.IntegerField()
    payment_method = models.CharField(max_length=64)
    payment_status = models.CharField(max_length=64, default="pending")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    # default=now: nếu không, Django ghi NULL vào `payment_date` → mọi thống kê/lọc theo
    # ngày giao dịch (trang Thanh toán, báo cáo) sẽ bỏ sót giao dịch mới.
    created_at = models.DateTimeField(db_column="payment_date", null=True, blank=True, default=timezone.now)

    class Meta:
        managed = False
        db_table = "payments"


class Inventory(models.Model):
    inventory_id = models.AutoField(primary_key=True)
    product_id = models.IntegerField(unique=True)
    total_quantity = models.IntegerField(default=0)
    updated_at = models.DateTimeField(db_column="last_updated", null=True, blank=True)

    class Meta:
        managed = False
        db_table = "inventory"


class InventoryTransaction(models.Model):
    transaction_id = models.AutoField(primary_key=True)
    product_id = models.IntegerField()
    quantity_change = models.IntegerField(db_column="quantity")
    transaction_type = models.CharField(max_length=32)
    note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    user_id = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "inventory_transactions"
