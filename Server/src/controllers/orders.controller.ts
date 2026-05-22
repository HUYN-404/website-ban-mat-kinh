import type { Request, Response } from 'express'

import {
  attachPaymentToOrder,
  changeOrderStatus,
  createOrder,
  getOrder,
  listOrders,
} from '../services/orders.service.js'
import {
  validateCreateOrderPayload,
  validateOrderId,
  validateUpdateOrderPaymentPayload,
  validateUpdateOrderStatusPayload,
} from '../validators/order.validator.js'

// Controller cho đơn hàng

const parseOrdersQuery = (query: Record<string, unknown>) => {
  const filters: {
    userId?: number
    status?: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
    from?: string
    to?: string
  } = {}

  if (query.userId !== undefined) {
    const id = Number(query.userId)
    if (Number.isInteger(id) && id > 0) {
      filters.userId = id
    }
  }

  if (
    query.status === 'pending' ||
    query.status === 'paid' ||
    query.status === 'shipped' ||
    query.status === 'completed' ||
    query.status === 'cancelled'
  ) {
    filters.status = query.status
  }

  if (typeof query.from === 'string') {
    filters.from = query.from
  }

  if (typeof query.to === 'string') {
    filters.to = query.to
  }

  return filters
}

export const handleListOrders = async (req: Request, res: Response) => {
  const filters = parseOrdersQuery(req.query)
  const orders = await listOrders(filters)
  res.json({ data: orders })
}

export const handleGetOrder = async (req: Request, res: Response) => {
  const orderId = validateOrderId(req.params.orderId)
  const order = await getOrder(orderId)
  res.json({ data: order })
}

export const handleCreateOrder = async (req: Request, res: Response) => {
  const payload = validateCreateOrderPayload(req.body)
  const order = await createOrder(payload)
  res.status(201).json({ data: order, message: 'Tạo đơn hàng thành công.' })
}

export const handleUpdateOrderStatus = async (req: Request, res: Response) => {
  const orderId = validateOrderId(req.params.orderId)
  const payload = validateUpdateOrderStatusPayload(req.body)
  const order = await changeOrderStatus(orderId, payload.status)
  res.json({ data: order, message: 'Cập nhật trạng thái đơn hàng thành công.' })
}

export const handleUpdateOrderPayment = async (req: Request, res: Response) => {
  const orderId = validateOrderId(req.params.orderId)
  const payload = validateUpdateOrderPaymentPayload(req.body)
  const order = await attachPaymentToOrder(orderId, payload.paymentId)
  res.json({ data: order, message: 'Cập nhật thông tin thanh toán thành công.' })
}


