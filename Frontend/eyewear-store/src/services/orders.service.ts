import { getCoreClient } from '../api/client'
import type { ShippingInfo } from '../components/CheckoutModal'

interface CreatePaymentPayload {
  orderId: number
  method: 'cash' | 'credit_card' | 'bank_transfer'
  amount: number
  note?: string | null
  transactionCode?: string | null
}

interface PaymentResponse {
  data: {
    id: number
    orderId: number
    method: string
    status: string
    amount: number
    transactionCode: string | null
    note: string | null
    createdAt: string
    updatedAt: string
  }
}

interface BackendOrder {
  id: number
  userId: number
  userName: string | null
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  totalAmount: number
  paymentId: number | null
  note: string | null
  createdAt: string
  updatedAt: string
}

interface BackendOrderItem {
  id: number
  productId: number
  productName: string | null
  productStatus: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

interface OrderResponse {
  data: BackendOrder & { items: BackendOrderItem[] }
}

interface CreateOrderPayload {
  userId: number
  items: Array<{
    productId: number
    quantity: number
  }>
  note?: string | null
}

export interface Order {
  id: number
  userId: number
  userName: string | null
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  totalAmount: number
  paymentId: number | null
  note: string | null
  items?: OrderItem[] // Optional vì list orders chỉ trả về count
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: number
  productId: number
  productName: string | null
  productStatus: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

// Tạo đơn hàng từ giỏ hàng
export const createOrderFromCart = async (
  userId: number,
  cartItems: Array<{ productId: number; quantity: number }>,
  shippingInfo: ShippingInfo,
  totalAmount: number,
): Promise<Order & { paymentUrl?: string }> => {
  // Note: Orders table không có note field trong DB thực tế
  // Thông tin giao hàng có thể lưu vào User table hoặc bỏ qua
  // Nếu cần, có thể thêm migration để thêm note field vào Orders table

  // Bước 1: Tạo Order
  const orderPayload: CreateOrderPayload = {
    userId,
    items: cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    // note: Orders table không có note field trong DB thực tế
  }

  const coreClient = getCoreClient()
  const orderResponse = await coreClient.post<OrderResponse>('/orders', orderPayload)
  const order = orderResponse.data.data

  // Bước 2: Tạo Payment
  // Note: Payments table không có note trong DB thực tế, bỏ qua
  const paymentPayload: CreatePaymentPayload = {
    orderId: order.id,
    method: shippingInfo.paymentMethod,
    amount: totalAmount,
    // note và transactionCode không có trong DB, bỏ qua
  }

  const paymentResponse = await coreClient.post<PaymentResponse>('/payments', paymentPayload)
  const payment = paymentResponse.data.data

  // Bước 3: Cập nhật Order với payment_id
  await coreClient.patch(`/orders/${order.id}/payment`, { paymentId: payment.id })

  // Bước 4: Nếu là thanh toán online (bank_transfer hoặc credit_card), tạo payment URL
  let paymentUrl: string | undefined
  if (shippingInfo.paymentMethod === 'bank_transfer' || shippingInfo.paymentMethod === 'credit_card') {
    const returnUrl = `${window.location.origin}/payment/result`
    const urlResponse = await coreClient.post<{ data: { paymentUrl: string; transactionId: string } }>(
      '/payments/create-url',
      {
        paymentId: payment.id,
        orderId: order.id,
        amount: totalAmount,
        returnUrl,
      },
    )
    paymentUrl = urlResponse.data.data.paymentUrl
  }

  // Lấy lại Order đầy đủ sau khi update
  const updatedOrderResponse = await coreClient.get<OrderResponse>(`/orders/${order.id}`)
  return { ...updatedOrderResponse.data.data, paymentUrl }
}

// Lấy danh sách đơn hàng của user
export const getUserOrders = async (userId: number): Promise<Order[]> => {
  const response = await getCoreClient().get<{ data: (BackendOrder & { items: BackendOrderItem[] })[] }>(
    `/orders?userId=${userId}`,
  )
  return response.data.data
}

// Lấy chi tiết đơn hàng
export const getOrder = async (orderId: number): Promise<Order> => {
  const response = await getCoreClient().get<OrderResponse>(`/orders/${orderId}`)
  return response.data.data
}

