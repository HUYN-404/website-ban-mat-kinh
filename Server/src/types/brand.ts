// Kiểu dữ liệu cho thương hiệu
export interface Brand {
  id: number
  name: string
  description: string | null
  country: string | null
  createdAt: string
  updatedAt: string
}

// Payload tạo thương hiệu
export interface CreateBrandPayload {
  name: string
  description?: string | null
  country?: string | null
}

// Payload cập nhật thương hiệu
export interface UpdateBrandPayload {
  name?: string
  description?: string | null
  country?: string | null
}


