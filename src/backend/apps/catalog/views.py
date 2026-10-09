from django.db.models import Case, IntegerField, OuterRef, Q, Subquery, Value, When
from django.db.models.functions import Coalesce
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.commerce.models import Inventory
from apps.common.permissions import require_admin
from apps.common.responses import envelope, error

from .models import Brand, BrandImage, Category, Product, ProductImage, Supplier
from .search import normalize_search_text, search_product_ids
from .cache_utils import get_catalog, invalidate_catalog, set_catalog
from .serializers import (
    BrandImageSerializer,
    BrandSerializer,
    CategorySerializer,
    ProductImageSerializer,
    ProductSerializer,
    SupplierSerializer,
)


def products_queryset():
    """Legacy `products` has no stock column; tồn kho nằm ở bảng `inventory`."""
    inv_sq = Inventory.objects.filter(product_id=OuterRef("product_id")).values("total_quantity")[:1]
    return Product.objects.select_related("category", "brand", "supplier").annotate(
        stock_quantity=Coalesce(Subquery(inv_sq), Value(0), output_field=IntegerField()),
    )


def _search_products(search, category_id=None, status_param=None):
    """Tìm sản phẩm theo từ khoá (bỏ dấu) — trả dữ liệu đã serialize, KHÔNG cache."""
    term = normalize_search_text(search) if search else ""
    queryset = products_queryset().all()
    if term:
        ids = search_product_ids(term)
        if ids:
            # Giữ thứ tự theo độ liên quan FULLTEXT tính được
            preserved = Case(
                *[When(product_id=pid, then=pos) for pos, pid in enumerate(ids)],
                output_field=IntegerField(),
            )
            queryset = queryset.filter(product_id__in=ids).order_by(preserved)
        else:
            queryset = queryset.filter(search_text__icontains=term)
    if category_id:
        queryset = queryset.filter(category_id=category_id)
    if status_param:
        queryset = queryset.filter(status=status_param)
    return ProductSerializer(queryset, many=True).data


def _crud_list_create(request, model_cls, serializer_cls):
    if request.method == "GET":
        queryset = model_cls.objects.all()
        return envelope(serializer_cls(queryset, many=True).data)
    serializer = serializer_cls(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data, status=status.HTTP_201_CREATED)


def _crud_detail(request, model_cls, serializer_cls, pk_name, pk_value):
    try:
        instance = model_cls.objects.get(**{pk_name: pk_value})
    except model_cls.DoesNotExist:
        return error("Resource not found", request_id=getattr(request, "request_id", None), status=404)

    if request.method == "GET":
        return envelope(serializer_cls(instance).data)
    if request.method in ("PUT", "PATCH"):
        serializer = serializer_cls(instance, data=request.data, partial=request.method == "PATCH")
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return envelope(serializer.data)
    instance.delete()
    return envelope({"success": True})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def categories(request):
    if request.method == "GET":
        # Dữ liệu ít thay đổi → cache 5 phút, giảm tải DB
        data = get_catalog("categories")
        if data is None:
            data = CategorySerializer(Category.objects.all(), many=True).data
            set_catalog("categories", data, timeout=300)
        return envelope(data)

    denied = require_admin(request.user, request)
    if denied:
        return denied
    serializer = CategorySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    invalidate_catalog()
    return envelope(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def category_detail(request, category_id: int):
    if request.method != "GET":
        denied = require_admin(request.user, request)
        if denied:
            return denied
    response = _crud_detail(request, Category, CategorySerializer, "category_id", category_id)
    if request.method in ("PUT", "DELETE"):
        invalidate_catalog()
    return response


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def brands(request):
    if request.method == "GET":
        # Dữ liệu ít thay đổi → cache 5 phút
        data = get_catalog("brands")
        if data is None:
            data = BrandSerializer(Brand.objects.all(), many=True).data
            set_catalog("brands", data, timeout=300)
        return envelope(data)

    denied = require_admin(request.user, request)
    if denied:
        return denied
    serializer = BrandSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    invalidate_catalog()
    return envelope(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def brand_detail(request, brand_id: int):
    if request.method != "GET":
        denied = require_admin(request.user, request)
        if denied:
            return denied
    response = _crud_detail(request, Brand, BrandSerializer, "brand_id", brand_id)
    if request.method in ("PUT", "DELETE"):
        invalidate_catalog()
    return response


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def suppliers(request):
    denied = require_admin(request.user, request)
    if denied:
        return denied
    return _crud_list_create(request, Supplier, SupplierSerializer)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def supplier_detail(request, supplier_id: int):
    denied = require_admin(request.user, request)
    if denied:
        return denied
    return _crud_detail(request, Supplier, SupplierSerializer, "supplier_id", supplier_id)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def products(request):
    if request.method == "GET":
        category_id = request.query_params.get("categoryId")
        status_param = request.query_params.get("status")
        search = request.query_params.get("search")

        # Có từ khoá → kết quả động (relevance) → KHÔNG cache
        if search:
            return envelope(_search_products(search, category_id, status_param))

        # Không tìm kiếm → cache theo bộ lọc (TTL 60s vì có tồn kho thay đổi)
        cache_parts = (category_id or "all", status_param or "all")
        data = get_catalog("products", *cache_parts)
        if data is None:
            queryset = products_queryset().all()
            if category_id:
                queryset = queryset.filter(category_id=category_id)
            if status_param:
                queryset = queryset.filter(status=status_param)
            data = ProductSerializer(queryset, many=True).data
            set_catalog("products", data, cache_parts[0], cache_parts[1], timeout=60)
        return envelope(data)

    denied = require_admin(request.user, request)
    if denied:
        return denied
    serializer = ProductSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    invalidate_catalog()
    return envelope(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def product_detail(request, product_id: int):
    if request.method != "GET":
        denied = require_admin(request.user, request)
        if denied:
            return denied

    if request.method == "GET":
        # Cache chi tiết sản phẩm 60s (tồn kho có thể đổi nên TTL ngắn)
        data = get_catalog("product", product_id)
        if data is None:
            try:
                instance = products_queryset().get(product_id=product_id)
            except Product.DoesNotExist:
                return error("Resource not found", request_id=getattr(request, "request_id", None), status=404)
            data = ProductSerializer(instance).data
            set_catalog("product", data, product_id, timeout=60)
        return envelope(data)

    try:
        instance = Product.objects.get(product_id=product_id)
    except Product.DoesNotExist:
        return error("Resource not found", request_id=getattr(request, "request_id", None), status=404)

    if request.method == "PUT":
        serializer = ProductSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        invalidate_catalog()
        refreshed = products_queryset().get(product_id=product_id)
        return envelope(ProductSerializer(refreshed).data)

    instance.delete()
    invalidate_catalog()
    return envelope({"success": True})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def product_status(request, product_id: int):
    denied = require_admin(request.user, request)
    if denied:
        return denied
    try:
        product = products_queryset().get(product_id=product_id)
    except Product.DoesNotExist:
        return error("Product not found", request_id=getattr(request, "request_id", None), status=404)
    serializer = ProductSerializer(product, data={"status": request.data.get("status")}, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    invalidate_catalog()
    return envelope(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def product_images(request, product_id: int):
    if request.method == "GET":
        images = ProductImage.objects.filter(product_id=product_id).order_by("image_id")
        return envelope(ProductImageSerializer(images, many=True).data)

    denied = require_admin(request.user, request)
    if denied:
        return denied
    payload = dict(request.data)
    payload["productId"] = product_id
    serializer = ProductImageSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    serializer.save(product_id=product_id)
    return envelope(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def product_image_detail(_request, product_id: int, image_id: int):
    denied = require_admin(_request.user, _request)
    if denied:
        return denied
    deleted, _ = ProductImage.objects.filter(product_id=product_id, image_id=image_id).delete()
    if deleted == 0:
        return error("Image not found", status=404)
    return envelope({"success": True})


# ── Brand Images ──

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def brand_images(request, brand_id: int):
    """GET: lấy danh sách ảnh của brand | POST: thêm ảnh mới (cần auth)"""
    if request.method == "GET":
        images = BrandImage.objects.filter(brand_id=brand_id).order_by("image_id")
        return envelope(BrandImageSerializer(images, many=True).data)

    denied = require_admin(request.user, request)
    if denied:
        return denied
    payload = dict(request.data)
    payload["brand_id"] = brand_id
    serializer = BrandImageSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    serializer.save(brand_id=brand_id)
    return envelope(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def brand_image_detail(_request, brand_id: int, image_id: int):
    """Xoá 1 ảnh của brand"""
    denied = require_admin(_request.user, _request)
    if denied:
        return denied
    deleted, _ = BrandImage.objects.filter(brand_id=brand_id, image_id=image_id).delete()
    if deleted == 0:
        return error("Image not found", status=404)
    return envelope({"success": True})
