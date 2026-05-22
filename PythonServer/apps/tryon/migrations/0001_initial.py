from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="TryOnSession",
            fields=[
                ("session_id", models.BigAutoField(primary_key=True, serialize=False)),
                ("user_id", models.IntegerField(blank=True, null=True)),
                ("product_id", models.IntegerField(blank=True, null=True)),
                ("face_image_url", models.CharField(blank=True, max_length=1024, null=True)),
                ("result_image_url", models.CharField(blank=True, max_length=1024, null=True)),
                ("status", models.CharField(default="created", max_length=30)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "tryon_sessions"},
        )
    ]
