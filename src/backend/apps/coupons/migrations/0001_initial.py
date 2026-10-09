from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Coupon",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("code", models.CharField(max_length=50, unique=True)),
                ("discount_type", models.CharField(default="percent", max_length=20)),
                ("discount_value", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("valid_from", models.DateTimeField(blank=True, null=True)),
                ("valid_to", models.DateTimeField(blank=True, null=True)),
                ("usage_limit", models.IntegerField(blank=True, null=True)),
                ("used_count", models.IntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "coupons",
            },
        ),
        migrations.CreateModel(
            name="CouponUsage",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("coupon_id", models.IntegerField()),
                ("user_id", models.IntegerField()),
                ("order_id", models.IntegerField(blank=True, null=True)),
                ("status", models.CharField(default="reserved", max_length=20)),
                ("used_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "coupon_usage",
            },
        ),
        migrations.AddIndex(
            model_name="couponusage",
            index=models.Index(fields=["user_id"], name="coupon_usage_user_idx"),
        ),
        migrations.AddIndex(
            model_name="couponusage",
            index=models.Index(fields=["coupon_id"], name="coupon_usage_coupon_idx"),
        ),
        migrations.AddIndex(
            model_name="couponusage",
            index=models.Index(fields=["order_id"], name="coupon_usage_order_idx"),
        ),
    ]
