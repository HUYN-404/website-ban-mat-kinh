import HttpError from '../utils/httpError.js'
import type {
  CreatePaymentPayload,
  Payment,
  PaymentStatus,
  UpdatePaymentPayload,
} from '../types/payment.js'
import {
  createPayment as createPaymentRepository,
  findAllPayments,
  findPaymentById,
  findPaymentsByOrderId,
  updatePayment as updatePaymentRepository,
} from '../repositories/payments.repository.js'
import { ensureOrderExists, changeOrderStatus } from './orders.service.js'

// Nghiệp vụ thanh toán

export const listPayments = async (): Promise<Payment[]> => {
  return findAllPayments()
}

export const getPayment = async (paymentId: number): Promise<Payment> => {
  const payment = await findPaymentById(paymentId)
  if (!payment) {
    throw new HttpError(404, 'Thanh toán không tồn tại.')
  }
  return payment
}

export const listPaymentsByOrder = async (orderId: number): Promise<Payment[]> => {
  await ensureOrderExists(orderId)
  return findPaymentsByOrderId(orderId)
}

export const createPayment = async (payload: CreatePaymentPayload): Promise<Payment> => {
  const order = await ensureOrderExists(payload.orderId)

  if (!payload.amount || payload.amount <= 0) {
    throw new HttpError(400, 'amount phải lớn hơn 0.')
  }

  if (payload.amount !== order.totalAmount) {
    // Cho phép tạo nhưng cảnh báo
    // TODO: cân nhắc xử lý partial payment trong tương lai
  }

  const paymentId = await createPaymentRepository(payload)

  const payment = await findPaymentById(paymentId)
  if (!payment) {
    throw new HttpError(500, 'Không thể lấy thông tin thanh toán vừa tạo.')
  }

  return payment
}

const handleStatusSideEffects = async (payment: Payment, status: PaymentStatus) => {
  if (status === 'completed') {
    await changeOrderStatus(payment.orderId, 'paid')
  }
}

export const updatePayment = async (
  paymentId: number,
  payload: UpdatePaymentPayload,
): Promise<Payment> => {
  const payment = await getPayment(paymentId)

  const updated = await updatePaymentRepository(paymentId, payload)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật thanh toán.')
  }

  const newPayment = await getPayment(paymentId)

  if (payload.status && payload.status !== payment.status) {
    await handleStatusSideEffects(newPayment, payload.status)
  }

  return newPayment
}


