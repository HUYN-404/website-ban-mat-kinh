from pathlib import Path
import uuid

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from apps.common.responses import envelope, error


@api_view(["POST"])
@permission_classes([AllowAny])
def upload_image(request):
    image = request.FILES.get("image")
    if not image:
        return error("No image file provided", status=400)

    if image.size > 5 * 1024 * 1024:
        return error("Image exceeds 5MB limit", status=400)

    extension = Path(image.name).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"}:
        return error("Unsupported image format", status=400)

    upload_dir = Path(settings.MEDIA_ROOT)
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{Path(image.name).stem}-{uuid.uuid4().hex}{extension}"
    output = upload_dir / filename
    with output.open("wb") as f:
        for chunk in image.chunks():
            f.write(chunk)

    image_url = f"{settings.MEDIA_URL.rstrip('/')}/{filename}"
    return envelope({"imageUrl": image_url}, status=201)
