import type { Request, Response } from 'express'

import {
  createPayment,
  getPayment,
  listPayments,
  listPaymentsByOrder,
  updatePayment,
} from '../services/payments.service.js'
import {
  validateCreatePaymentPayload,
  validatePaymentId,
  validateUpdatePaymentPayload,
} from '../validators/payment.validator.js'
import { validateOrderId } from '../validators/order.validator.js'

// Controller thanh toán

export const handleListPayments = async (_req: Request, res: Response) => {
  const payments = await listPayments()
  res.json({ data: payments })
}

export const handleGetPayment = async (req: Request, res: Response) => {
  const paymentId = validatePaymentId(req.params.paymentId)
  const payment = await getPayment(paymentId)
  res.json({ data: payment })
}

export const handleListPaymentsByOrder = async (req: Request, res: Response) => {
  const orderId = validateOrderId(req.params.orderId)
  const payments = await listPaymentsByOrder(orderId)
  res.json({ data: payments })
}

export const handleCreatePayment = async (req: Request, res: Response) => {
  const payload = validateCreatePaymentPayload(req.body)
  const payment = await createPayment(payload)
  res.status(201).json({ data: payment, message: 'Tạo thanh toán thành công.' })
}

export const handleUpdatePayment = async (req: Request, res: Response) => {
  const paymentId = validatePaymentId(req.params.paymentId)
  const payload = validateUpdatePaymentPayload(req.body)
  const payment = await updatePayment(paymentId, payload)
  res.json({ data: payment, message: 'Cập nhật thanh toán thành công.' })
}


