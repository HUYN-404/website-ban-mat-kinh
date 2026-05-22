from django.urls import path

from apps.api_v2.upload import upload_image
from apps.authn import views as auth_views
from apps.catalog import views as catalog_views
from apps.chatbot import views as chatbot_views
from apps.commerce import views as commerce_views
from apps.common.responses import envelope
from apps.tryon import views as tryon_views


def api_root(_request):
    return envelope({"message": "API v2 root"})


urlpatterns = [
    path("", api_root),
    # Auth
    path("auth/login", auth_views.login),
    path("auth/admin/login", auth_views.admin_login),
    path("auth/register", auth_views.register),
    path("auth/logout", auth_views.logout),
    path("auth/me", auth_views.me),
    # Roles/users
    path("roles", auth_views.roles),
    path("roles/<int:role_id>", auth_views.role_detail),
    path("users", auth_views.users),
    path("users/<int:user_id>", auth_views.user_detail),
    path("users/<int:user_id>/status", auth_views.user_status),
    # Catalog
    path("categories", catalog_views.categories),
    path("categories/<int:category_id>", catalog_views.category_detail),
    path("brands", catalog_views.brands),
    path("brands/<int:brand_id>", catalog_views.brand_detail),
    path("suppliers", catalog_views.suppliers),
    path("suppliers/<int:supplier_id>", catalog_views.supplier_detail),
    path("products", catalog_views.products),
    path("products/<int:product_id>", catalog_views.product_detail),
    path("products/<int:product_id>/status", catalog_views.product_status),
    path("products/<int:product_id>/images", catalog_views.product_images),
    path("products/<int:product_id>/images/<int:image_id>", catalog_views.product_image_detail),
    # Chatbot
    path("chatbot", chatbot_views.chatbot),
    # Commerce
    path("carts", commerce_views.carts),
    path("carts/<int:cart_id>", commerce_views.cart_detail),
    path("carts/<int:cart_id>/status", commerce_views.cart_detail),
    path("carts/user/<int:user_id>/active", commerce_views.active_cart_by_user),
    path("carts/user/<int:user_id>/history", commerce_views.carts_history),
    path("carts/<int:cart_id>/items", commerce_views.cart_items),
    path("carts/<int:cart_id>/items/<int:cart_item_id>", commerce_views.cart_item_detail),
    path("orders", commerce_views.orders),
    path("orders/<int:order_id>", commerce_views.order_detail),
    path("orders/<int:order_id>/status", commerce_views.order_status),
    path("orders/<int:order_id>/payment", commerce_views.order_payment),
    path("orders/<int:order_id>/items", commerce_views.order_items),
    path("orders/<int:order_id>/items/<int:order_item_id>", commerce_views.order_item_detail),
    path("payments", commerce_views.payments),
    path("payments/create-url", commerce_views.create_payment_url),
    path("payments/<int:payment_id>", commerce_views.payment_detail),
    path("payments/order/<int:order_id>", commerce_views.payments_by_order),
    path("inventory", commerce_views.inventory),
    path("inventory/<int:product_id>", commerce_views.inventory_detail),
    path("inventory-transactions", commerce_views.inventory_transactions),
    path("inventory-transactions/bulk", commerce_views.inventory_transactions_bulk),
    path("inventory-transactions/<int:transaction_id>", commerce_views.inventory_transaction_detail),
    path("reports", commerce_views.reports),
    # Upload and try-on
    path("upload", upload_image),
    path("tryon/sessions", tryon_views.create_session),
    path("tryon/sessions/<int:session_id>", tryon_views.get_session),
    path("tryon/sessions/<int:session_id>/face-image", tryon_views.upload_face_image),
    path("tryon/sessions/<int:session_id>/render", tryon_views.render_session),
]
