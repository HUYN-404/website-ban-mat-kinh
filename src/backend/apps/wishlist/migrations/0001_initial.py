from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Wishlist",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("user_id", models.IntegerField()),
                ("product_id", models.IntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "wishlist",
            },
        ),
        migrations.AddConstraint(
            model_name="wishlist",
            constraint=models.UniqueConstraint(
                fields=("user_id", "product_id"),
                name="wishlist_unique_user_product",
            ),
        ),
        migrations.AddIndex(
            model_name="wishlist",
            index=models.Index(fields=["user_id"], name="wishlist_user_id_idx"),
        ),
        migrations.AddIndex(
            model_name="wishlist",
            index=models.Index(fields=["user_id", "product_id"], name="wishlist_user_prod_idx"),
        ),
    ]
