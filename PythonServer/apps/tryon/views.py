from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from apps.common.responses import envelope, error

from .models import TryOnSession
from .serializers import TryOnSessionSerializer
from .service import decode_image_to_temp, load_product_glasses_asset, render_overlay


@api_view(["POST"])
@permission_classes([AllowAny])
def create_session(request):
    user_id = request.user.user_id if getattr(request, "user", None) and getattr(request.user, "user_id", None) else None
    expires_at = timezone.now() + timedelta(days=settings.TRYON_RESULT_TTL_DAYS)
    session = TryOnSession.objects.create(user_id=user_id, status="created", expires_at=expires_at)
    return envelope(TryOnSessionSerializer(session).data, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def upload_face_image(request, session_id: int):
    session = TryOnSession.objects.filter(session_id=session_id).first()
    if not session:
        return error("Try-on session not found", status=404)

    image = request.FILES.get("image")
    if not image:
        return error("Missing image field", status=400)

    suffix = Path(image.name).suffix or ".jpg"
    saved_path = decode_image_to_temp(image.read(), suffix, Path(settings.MEDIA_ROOT) / "tryon" / "faces")
    session.face_image_url = f"{settings.MEDIA_URL.rstrip('/')}/tryon/faces/{saved_path.name}"
    session.status = "face_uploaded"
    session.save(update_fields=["face_image_url", "status", "updated_at"])
    return envelope(TryOnSessionSerializer(session).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def render_session(request, session_id: int):
    session = TryOnSession.objects.filter(session_id=session_id).first()
    if not session:
        return error("Try-on session not found", status=404)
    if not session.face_image_url:
        return error("Session does not have face image yet", status=400)

    product_id = request.data.get("productId")
    if not product_id:
        return error("productId is required", status=400)
    session.product_id = int(product_id)

    face_image_path = Path(settings.MEDIA_ROOT) / "tryon" / "faces" / Path(session.face_image_url).name
    try:
        glasses_asset = load_product_glasses_asset(session.product_id)
        result_url = render_overlay(
            str(face_image_path),
            str(glasses_asset),
            Path(settings.MEDIA_ROOT) / "tryon" / "results",
        )
    except FileNotFoundError:
        return error("No glasses asset available for this product", status=404)
    except Exception as exc:  # pragma: no cover - fallback safety
        return error(f"Try-on render failed: {exc}", status=500)

    session.result_image_url = result_url
    session.status = "rendered"
    session.save(update_fields=["product_id", "result_image_url", "status", "updated_at"])
    return envelope(TryOnSessionSerializer(session).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_session(_request, session_id: int):
    session = TryOnSession.objects.filter(session_id=session_id).first()
    if not session:
        return error("Try-on session not found", status=404)
    return envelope(TryOnSessionSerializer(session).data)
