from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.static import serve as static_serve
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

import os

from apps.common.views import health


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", health, name="health"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/", include("apps.api.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve /product_img/ — ảnh sản phẩm (src/product_img)
    product_img_root = os.path.join(settings.BASE_DIR.parent, "product_img")
    if os.path.exists(product_img_root):
        urlpatterns += [
            path("product_img/<path:path>", static_serve, {"document_root": product_img_root}),
        ]
