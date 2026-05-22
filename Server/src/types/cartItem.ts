// Dữ liệu item trong giỏ hàng
export interface CartItem {
  id: number
  cartId: number
  productId: number
  productName: string | null
  quantity: number
  unitPrice: number
  subtotal: number
  createdAt: string
  updatedAt: string
}

// Payload thêm sản phẩm vào giỏ
export interface AddCartItemPayload {
  cartId: number
  productId: number
  quantity?: number
}

// Payload cập nhật item
export interface UpdateCartItemPayload {
  quantity: number
}


