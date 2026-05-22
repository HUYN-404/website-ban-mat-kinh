from django.db.models import IntegerField, OuterRef, Q, Subquery, Value
from django.db.models.functions import Coalesce
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.commerce.models import Inventory
from apps.common.responses import envelope, error

from .models import Brand, Category, Product, ProductImage, Supplier
from .serializers import (
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
    if request.method == "POST" and not request.user.is_authenticated:
        return error("Authentication required", request_id=getattr(request, "request_id", None), status=401)
    return _crud_list_create(request, Category, CategorySerializer)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def category_detail(request, category_id: int):
    if request.method != "GET" and not request.user.is_authenticated:
        return error("Authentication required", request_id=getattr(request, "request_id", None), status=401)
    return _crud_detail(request, Category, CategorySerializer, "category_id", category_id)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def brands(request):
    if request.method == "POST" and not request.user.is_authenticated:
        return error("Authentication required", request_id=getattr(request, "request_id", None), status=401)
    return _crud_list_create(request, Brand, BrandSerializer)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def brand_detail(request, brand_id: int):
    if request.method != "GET" and not request.user.is_authenticated:
        return error("Authentication required", request_id=getattr(request, "request_id", None), status=401)
    return _crud_detail(request, Brand, BrandSerializer, "brand_id", brand_id)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def suppliers(request):
    return _crud_list_create(request, Supplier, SupplierSerializer)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def supplier_detail(request, supplier_id: int):
    return _crud_detail(request, Supplier, SupplierSerializer, "supplier_id", supplier_id)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def products(request):
    if request.method == "GET":
        queryset = products_queryset().all()
        category_id = request.query_params.get("categoryId")
        status_param = request.query_params.get("status")
        search = request.query_params.get("search")
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        return envelope(ProductSerializer(queryset, many=True).data)

    if not request.user.is_authenticated:
        return error("Authentication required", request_id=getattr(request, "request_id", None), status=401)
    serializer = ProductSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def product_detail(request, product_id: int):
    if request.method != "GET" and not request.user.is_authenticated:
        return error("Authentication required", request_id=getattr(request, "request_id", None), status=401)

    if request.method == "GET":
        try:
            instance = products_queryset().get(product_id=product_id)
        except Product.DoesNotExist:
            return error("Resource not found", request_id=getattr(request, "request_id", None), status=404)
        return envelope(ProductSerializer(instance).data)

    try:
        instance = Product.objects.get(product_id=product_id)
    except Product.DoesNotExist:
        return error("Resource not found", request_id=getattr(request, "request_id", None), status=404)

    if request.method == "PUT":
        serializer = ProductSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        refreshed = products_queryset().get(product_id=product_id)
        return envelope(ProductSerializer(refreshed).data)

    instance.delete()
    return envelope({"success": True})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def product_status(request, product_id: int):
    try:
        product = products_queryset().get(product_id=product_id)
    except Product.DoesNotExist:
        return error("Product not found", request_id=getattr(request, "request_id", None), status=404)
    serializer = ProductSerializer(product, data={"status": request.data.get("status")}, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return envelope(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def product_images(request, product_id: int):
    if request.method == "GET":
        images = ProductImage.objects.filter(product_id=product_id).order_by("image_id")
        return envelope(ProductImageSerializer(images, many=True).data)

    if not request.user.is_authenticated:
        return error("Authentication required", request_id=getattr(request, "request_id", None), status=401)
    payload = dict(request.data)
    payload["productId"] = product_id
    serializer = ProductImageSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    serializer.save(product_id=product_id)
    return envelope(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def product_image_detail(_request, product_id: int, image_id: int):
    deleted, _ = ProductImage.objects.filter(product_id=product_id, image_id=image_id).delete()
    if deleted == 0:
        return error("Image not found", status=404)
    return envelope({"success": True})
