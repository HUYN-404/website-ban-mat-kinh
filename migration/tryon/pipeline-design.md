# Virtual Try-On Pipeline Design

## API Surface (v2)

- `POST /api/v2/tryon/sessions`
- `POST /api/v2/tryon/sessions/{id}/face-image` (multipart field `image`)
- `POST /api/v2/tryon/sessions/{id}/render` body `{ productId }`
- `GET /api/v2/tryon/sessions/{id}`

## Processing Flow

1. Create session with TTL (`expires_at`).
2. Store raw face image under `/uploads/tryon/faces`.
3. Resolve glasses asset from catalog image store (`product_img` fallback).
4. Render blended result under `/uploads/tryon/results`.
5. Return relative URL with compatibility to existing image resolver.

## Privacy and Security

- Session rows contain `expires_at` and should be purged by scheduled job.
- Raw face images and result images should be deleted after TTL.
- Public access should be restricted in production using signed URLs or protected media endpoint.
- Upload size and extension are validated at API layer.

## Next Enhancements

- Replace simple center overlay with landmark-based alignment (MediaPipe face mesh).
- Add async queue for rendering and retries.
- Track render quality metrics and failure reasons.
