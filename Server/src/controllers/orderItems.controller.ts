import type { Request, Response } from 'express'

import {
  addOrderItem,
  listOrderItems,
  removeOrderItem,
  updateOrderItem,
} from '../services/orders.service.js'
import {
  validateAddOrderItemPayload,
  validateOrderId,
  validateUpdateOrderItemPayload,
} from '../validators/order.validator.js'
import { validateOrderItemId } from '../validators/orderItem.validator.js'

// Controller cho order items

export const handleListOrderItems = async (req: Request, res: Response) => {
  const orderId = validateOrderId(req.params.orderId)
  const items = await listOrderItems(orderId)
  res.json({ data: items })
}

export const handleAddOrderItem = async (req: Request, res: Response) => {
  const orderId = validateOrderId(req.params.orderId)
  const payload = validateAddOrderItemPayload(req.body)
  const order = await addOrderItem(orderId, payload)
  res.status(201).json({ data: order, message: 'Đã thêm sản phẩm vào đơn hàng.' })
}

export const handleUpdateOrderItem = async (req: Request, res: Response) => {
  const orderId = validateOrderId(req.params.orderId)
  const orderItemId = validateOrderItemId(req.params.orderItemId)
  const payload = validateUpdateOrderItemPayload(req.body)
  const order = await updateOrderItem(orderId, orderItemId, payload)
  res.json({ data: order, message: 'Đã cập nhật sản phẩm trong đơn hàng.' })
}

export const handleDeleteOrderItem = async (req: Request, res: Response) => {
  const orderId = validateOrderId(req.params.orderId)
  const orderItemId = validateOrderItemId(req.params.orderItemId)
  const order = await removeOrderItem(orderId, orderItemId)
  res.json({ data: order, message: 'Đã xóa sản phẩm khỏi đơn hàng.' })
}


