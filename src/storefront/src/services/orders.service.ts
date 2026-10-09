import { getApiClient } from '../api/client'
import type { ShippingInfo } from '../components/CheckoutModal'

interface CreatePaymentPayload {
  orderId: number
  method: 'cash' | 'bank_transfer'
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

// Trạng thái đơn hàng dùng chung — khớp hằng số ở backend (apps/commerce/services.py)
export type OrderStatus =
  | 'pending' // Chờ xử lý (chưa thanh toán) → khách được tự huỷ
  | 'paid' // Đã thanh toán → chỉ được yêu cầu hoàn tiền
  | 'refund_requested' // Khách đã yêu cầu hoàn tiền, chờ cửa hàng xử lý
  | 'shipped' // Đã gửi hàng → khoá
  | 'in_transit' // Đang vận chuyển → khoá
  | 'completed' // Hoàn tất
  | 'cancelled' // Đã huỷ
  | 'refunded' // Đã hoàn tiền
  | 'returned' // Đã trả hàng

interface BackendOrder {
  id: number
  userId: number
  userName: string | null
  status: OrderStatus
  statusLabel: string
  canCancel: boolean
  cancelBlockedReason: string | null
  canRequestRefund: boolean
  refundBlockedReason: string | null
  totalAmount: number
  discountAmount: number
  couponId: number | null
  couponCode: string | null
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
  couponCode?: string | null
  note?: string | null
}

export interface Order {
  id: number
  userId: number
  userName: string | null
  status: OrderStatus
  // Cờ + lý do do backend trả về để FE không tự đoán luật
  statusLabel?: string
  canCancel?: boolean
  cancelBlockedReason?: string | null
  canRequestRefund?: boolean
  refundBlockedReason?: string | null
  totalAmount: number
  discountAmount: number
  couponId: number | null
  couponCode: string | null
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
  couponCode?: string | null,
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
    // Gửi mã coupon để backend tự kiểm tra + trừ tiền (không gửi số tiền giảm từ FE)
    ...(couponCode ? { couponCode } : {}),
    // note: Orders table không có note field trong DB thực tế
  }

  const coreClient = getApiClient()
  const orderResponse = await coreClient.post<OrderResponse>('/orders', orderPayload)
  const order = orderResponse.data.data

  // Backend là nguồn chân lý về tiền: đã trừ coupon rồi.
  // DRF trả Decimal dạng chuỗi ("2700000.00") → ép về number để gửi payment.
  const amountToPay = Number(order.totalAmount)

  // Bước 2: Tạo Payment
  // Note: Payments table không có note trong DB thực tế, bỏ qua
  const paymentPayload: CreatePaymentPayload = {
    orderId: order.id,
    method: shippingInfo.paymentMethod,
    amount: amountToPay,
    // note và transactionCode không có trong DB, bỏ qua
  }

  const paymentResponse = await coreClient.post<PaymentResponse>('/payments', paymentPayload)
  const payment = paymentResponse.data.data

  // Bước 3: Cập nhật Order với payment_id
  await coreClient.patch(`/orders/${order.id}/payment`, { paymentId: payment.id })

  // Bước 4: Nếu thanh toán online (chuyển khoản ngân hàng) thì tạo URL cổng VNPay
  let paymentUrl: string | undefined
  if (shippingInfo.paymentMethod === 'bank_transfer') {
    const returnUrl = `${window.location.origin}/payment/result`
    const urlResponse = await coreClient.post<{ data: { paymentUrl: string; transactionId: string } }>(
      '/payments/create-url',
      {
        paymentId: payment.id,
        orderId: order.id,
        amount: amountToPay,
        returnUrl,
        // Backend sẽ trả URL cổng VNPay nếu đã cấu hình, ngược lại dùng luồng mô phỏng
        provider: 'vnpay',
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
  const response = await getApiClient().get<{ data: (BackendOrder & { items: BackendOrderItem[] })[] }>(
    `/orders?userId=${userId}`,
  )
  return response.data.data
}

// Khách huỷ đơn của chính mình — backend chỉ cho phép khi đơn CHƯA thanh toán
export const cancelOrder = async (orderId: number): Promise<Order> => {
  const response = await getApiClient().patch<OrderResponse>(`/orders/${orderId}/status`, {
    status: 'cancelled',
  })

  return response.data.data
}

// Khách gửi yêu cầu hoàn tiền — chỉ khi đơn ĐÃ thanh toán và hàng chưa gửi
export const requestRefund = async (orderId: number): Promise<Order> => {
  const response = await getApiClient().patch<OrderResponse>(`/orders/${orderId}/status`, {
    status: 'refund_requested',
  })

  return response.data.data
}

// Lấy chi tiết đơn hàng
export const getOrder = async (orderId: number): Promise<Order> => {
  const response = await getApiClient().get<OrderResponse>(`/orders/${orderId}`)
  return response.data.data
}

