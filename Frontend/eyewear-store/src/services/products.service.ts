import { useQuery } from '@tanstack/react-query'
import { getCatalogClient, resolveFileUrl } from '../api/client'
import type { Product as FEProduct } from '../data/products'

// Type từ Backend API
interface BackendProduct {
  id: number
  name: string
  description: string | null
  price: number
  stockQuantity: number
  status: 'available' | 'unavailable'
  categoryId: number
  categoryName: string | null
  brandId: number
  brandName: string | null
  supplierId: number
  supplierName: string | null
  materials: string[] | null
  highlights: string[] | null
  createdAt: string
  updatedAt: string
}

interface BackendProductImage {
  id: number
  productId: number
  imageUrl: string
  createdAt: string
}

interface ProductsResponse {
  data: BackendProduct[]
}

interface ProductImagesResponse {
  data: BackendProductImage[]
}

const NO_IMAGE_URL =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"%3E%3Crect width="400" height="500" fill="%23f5f1e8"/%3E%3Ctext x="200" y="250" text-anchor="middle" font-family="Arial" font-size="24" fill="%23777777"%3ENo Image%3C/text%3E%3C/svg%3E'

// Map Backend Product sang Frontend Product
const mapBackendToFrontend = (
  backendProduct: BackendProduct,
  images: BackendProductImage[] = [],
): FEProduct => {
  // Category mapping: categoryId 5 = Accessories, còn lại = Eyewear
  const category: 'eyewear' | 'accessory' = backendProduct.categoryId === 5 ? 'accessory' : 'eyewear'
  
  // Gender: mặc định unisex (có thể mở rộng sau)
  const gender: 'men' | 'women' | 'unisex' = 'unisex'
  
  // Map images
  const imageUrls = images.map((img) => {
    return resolveFileUrl(img.imageUrl) ?? img.imageUrl
  })

  return {
    id: backendProduct.id.toString(),
    name: backendProduct.name,
    price: backendProduct.price,
    gender,
    category,
    brand: backendProduct.brandName || 'Unknown Brand',
    colorway: '', // Không có trong BE, để trống
    materials: backendProduct.materials || [], // Lấy từ BE, mặc định là mảng rỗng
    description: backendProduct.description || '',
    highlights: backendProduct.highlights || [], // Lấy từ BE, mặc định là mảng rỗng
    images: imageUrls.length > 0 ? imageUrls : [NO_IMAGE_URL],
    stockQuantity: backendProduct.stockQuantity, // Thêm stockQuantity từ backend
  }
}

// Fetch products từ API
export const fetchProducts = async (filters?: {
  categoryId?: number
  status?: 'available' | 'unavailable'
  search?: string
}): Promise<FEProduct[]> => {
  try {
    const catalogClient = getCatalogClient()
    const params = new URLSearchParams()
    if (filters?.categoryId) {
      params.append('categoryId', filters.categoryId.toString())
    }
    if (filters?.status) {
      params.append('status', filters.status)
    }
    if (filters?.search) {
      params.append('search', filters.search)
    }

    const response = await catalogClient.get<ProductsResponse>(`/products?${params.toString()}`)
    // Lọc sản phẩm available và có stockQuantity > 0
    const products = response.data.data.filter((p) => p.status === 'available' && p.stockQuantity > 0)

    // Fetch images cho từng sản phẩm
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        try {
          const imagesResponse = await catalogClient.get<ProductImagesResponse>(
            `/products/${product.id}/images`,
          )
          return mapBackendToFrontend(product, imagesResponse.data.data)
        } catch (error) {
          console.error(`Error fetching images for product ${product.id}:`, error)
          return mapBackendToFrontend(product, [])
        }
      }),
    )

    return productsWithImages
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

// Hook để fetch products
export const useProducts = (filters?: {
  categoryId?: number
  status?: 'available' | 'unavailable'
  search?: string
}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook để fetch single product
export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const catalogClient = getCatalogClient()
      const response = await catalogClient.get<{ data: BackendProduct }>(`/products/${productId}`)
      const product = response.data.data

      // Fetch images
      try {
        const imagesResponse = await catalogClient.get<ProductImagesResponse>(
          `/products/${productId}/images`,
        )
        return mapBackendToFrontend(product, imagesResponse.data.data)
      } catch (error) {
        console.error(`Error fetching images for product ${productId}:`, error)
        return mapBackendToFrontend(product, [])
      }
    },
    enabled: !!productId,
  })
}
