from django.utils.timezone import now
from rest_framework.decorators import api_view

from .responses import envelope


@api_view(["GET"])
def health(_request):
    return envelope({"status": "ok", "timestamp": now().isoformat()})
