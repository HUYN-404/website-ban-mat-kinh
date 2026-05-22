// Kiểu dữ liệu ảnh sản phẩm
export interface ProductImage {
  id: number
  productId: number
  imageUrl: string
  createdAt: string
}

// Payload tạo ảnh sản phẩm
export interface CreateProductImagePayload {
  productId: number
  imageUrl: string
}


