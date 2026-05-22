// Trạng thái giỏ hàng
export type CartStatus = 'active' | 'inactive'

// Dữ liệu giỏ hàng
export interface Cart {
  id: number
  userId: number
  status: CartStatus
  createdAt: string
  updatedAt: string
}

// Payload tạo/khởi tạo giỏ hàng
export interface CreateCartPayload {
  userId: number
}

// Payload cập nhật trạng thái
export interface UpdateCartStatusPayload {
  status: CartStatus
}


