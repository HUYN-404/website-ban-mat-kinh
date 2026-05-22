import type { ProductStatus } from './product.js'

// Trạng thái đơn hàng
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

// Thông tin đơn hàng
export interface Order {
  id: number
  userId: number
  userName: string | null
  status: OrderStatus
  totalAmount: number
  paymentId: number | null
  note: string | null
  createdAt: string
  updatedAt: string
}

// Item trong đơn hàng
export interface OrderItem {
  id: number
  productId: number
  productName: string | null
  productStatus: ProductStatus | null
  quantity: number
  unitPrice: number
  subtotal: number
}

// Payload tạo đơn
export interface CreateOrderItemPayload {
  productId: number
  quantity: number
}

export interface CreateOrderPayload {
  userId: number
  items: CreateOrderItemPayload[]
  note?: string | null
}

export interface AddOrderItemPayload extends CreateOrderItemPayload {
  unitPrice?: number
}

export interface UpdateOrderItemPayload {
  quantity?: number
  unitPrice?: number
}

// Payload cập nhật trạng thái
export interface UpdateOrderStatusPayload {
  status: OrderStatus
}

// Payload cập nhật payment
export interface UpdateOrderPaymentPayload {
  paymentId: number | null
}

