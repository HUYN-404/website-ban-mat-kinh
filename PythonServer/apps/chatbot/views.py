from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from apps.chatbot.service import create_chatbot_response
from apps.common.responses import envelope, error


@api_view(["POST"])
@permission_classes([AllowAny])
def chatbot(request):
    message = request.data.get("message")
    if not isinstance(message, str):
        return error("message phải là chuỗi.", request_id=getattr(request, "request_id", None), status=400)

    return envelope(create_chatbot_response(message))

