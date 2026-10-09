from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reviews", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="review",
            index=models.Index(fields=["product_id"], name="reviews_product_id_idx"),
        ),
        migrations.AddIndex(
            model_name="review",
            index=models.Index(fields=["product_id", "-created_at"], name="reviews_product_created_idx"),
        ),
    ]
