// Các loại phương thức thanh toán
export type PaymentMethod = 'cash' | 'credit_card' | 'bank_transfer'

// Trạng thái thanh toán
export type PaymentStatus = 'pending' | 'completed' | 'failed'

// Dữ liệu thanh toán
export interface Payment {
  id: number
  orderId: number
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  transactionCode: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

// Payload tạo thanh toán
export interface CreatePaymentPayload {
  orderId: number
  method: PaymentMethod
  amount: number
  note?: string | null
  transactionCode?: string | null
}

// Payload cập nhật thanh toán
export interface UpdatePaymentPayload {
  status?: PaymentStatus
  note?: string | null
  transactionCode?: string | null
}


