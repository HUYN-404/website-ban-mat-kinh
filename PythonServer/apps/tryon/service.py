from pathlib import Path
import uuid

import cv2
import numpy as np
from django.conf import settings


def render_overlay(face_image_path: str, glasses_image_path: str, output_dir: Path) -> str:
    """MVP overlay renderer: center overlay with alpha blend."""
    face = cv2.imread(face_image_path, cv2.IMREAD_COLOR)
    glasses = cv2.imread(glasses_image_path, cv2.IMREAD_UNCHANGED)
    if face is None or glasses is None:
        raise ValueError("Cannot read input images for try-on rendering")

    fh, fw = face.shape[:2]
    target_width = int(fw * 0.65)
    scale = target_width / max(glasses.shape[1], 1)
    target_height = int(glasses.shape[0] * scale)
    glasses_resized = cv2.resize(glasses, (target_width, target_height))

    x = (fw - target_width) // 2
    y = max(int(fh * 0.30) - target_height // 2, 0)

    overlay = face.copy()
    if glasses_resized.shape[2] == 4:
        alpha = glasses_resized[:, :, 3] / 255.0
        for channel in range(3):
            overlay[y : y + target_height, x : x + target_width, channel] = (
                alpha * glasses_resized[:, :, channel]
                + (1 - alpha) * overlay[y : y + target_height, x : x + target_width, channel]
            )
    else:
        overlay[y : y + target_height, x : x + target_width] = glasses_resized[:, :, :3]

    output_dir.mkdir(parents=True, exist_ok=True)
    output_name = f"tryon-result-{uuid.uuid4().hex}.jpg"
    output_path = output_dir / output_name
    cv2.imwrite(str(output_path), overlay)
    relative_path = f"{settings.MEDIA_URL.rstrip('/')}/tryon/results/{output_name}"
    return relative_path


def decode_image_to_temp(binary_data: bytes, suffix: str, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"tryon-face-{uuid.uuid4().hex}{suffix}"
    path = output_dir / filename
    path.write_bytes(binary_data)
    return path


def load_product_glasses_asset(product_id: int) -> Path:
    # Default catalog path; can be replaced with object storage later.
    candidate = settings.BASE_DIR.parent / "product_img" / f"{product_id}.png"
    if candidate.exists():
        return candidate
    fallback = settings.BASE_DIR.parent / "product_img" / "default.png"
    if fallback.exists():
        return fallback
    raise FileNotFoundError("No glasses asset found for product")
