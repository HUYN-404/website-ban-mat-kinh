from rest_framework.response import Response


def envelope(data, status=200):
    return Response({"data": data}, status=status)


def error(message: str, request_id: str | None = None, status: int = 400, details=None):
    payload = {"message": message}
    if request_id:
        payload["requestId"] = request_id
    if details is not None:
        payload["details"] = details
    return Response(payload, status=status)
