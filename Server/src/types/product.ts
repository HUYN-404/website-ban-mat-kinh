// Trạng thái sản phẩm
export type ProductStatus = 'available' | 'unavailable'

// Kiểu dữ liệu sản phẩm
export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  stockQuantity: number
  status: ProductStatus
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

// Payload tạo sản phẩm
export interface CreateProductPayload {
  name: string
  description?: string | null
  price: number
  stockQuantity?: number
  status?: ProductStatus
  categoryId: number
  brandId: number
  supplierId: number
  materials?: string[] | null
  highlights?: string[] | null
}

// Payload cập nhật sản phẩm
export interface UpdateProductPayload {
  name?: string
  description?: string | null
  price?: number
  stockQuantity?: number
  status?: ProductStatus
  categoryId?: number
  brandId?: number
  supplierId?: number
  materials?: string[] | null
  highlights?: string[] | null
}


