import uuid


class RequestIdMiddleware:
    """Attach a request id so logs and API errors are traceable."""

    header_name = "HTTP_X_REQUEST_ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = request.META.get(self.header_name) or str(uuid.uuid4())
        response = self.get_response(request)
        response["X-Request-Id"] = request.request_id
        return response
