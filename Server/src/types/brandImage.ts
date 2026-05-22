// Kiểu dữ liệu cho ảnh thương hiệu
export interface BrandImage {
  id: number
  brandId: number
  imageUrl: string
  createdAt: string
}

// Payload tạo ảnh thương hiệu
export interface CreateBrandImagePayload {
  brandId: number
  imageUrl: string
}


