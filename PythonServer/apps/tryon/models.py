from django.db import models


class TryOnSession(models.Model):
    session_id = models.AutoField(primary_key=True)
    user_id = models.IntegerField(null=True, blank=True)
    product_id = models.IntegerField(null=True, blank=True)
    face_image_url = models.CharField(max_length=1024, null=True, blank=True)
    result_image_url = models.CharField(max_length=1024, null=True, blank=True)
    status = models.CharField(max_length=30, default="created")
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tryon_sessions"
