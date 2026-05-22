import type { Request, Response } from 'express'

import {
  changeCartStatus,
  createCartForUser,
  getActiveCartByUserId,
  getCartById,
  listCartsByUser,
} from '../services/carts.service.js'
import {
  validateCartId,
  validateCreateCartPayload,
  validateUpdateCartStatusPayload,
  validateUserIdParam,
} from '../validators/cart.validator.js'

// Controller giỏ hàng

export const handleGetCartById = async (req: Request, res: Response) => {
  const cartId = validateCartId(req.params.cartId)
  const cart = await getCartById(cartId)
  res.json({ data: cart })
}

export const handleGetActiveCartByUser = async (req: Request, res: Response) => {
  const userId = validateUserIdParam(req.params.userId)
  const cart = await getActiveCartByUserId(userId)
  res.json({ data: cart })
}

export const handleListCartsByUser = async (req: Request, res: Response) => {
  const userId = validateUserIdParam(req.params.userId)
  const carts = await listCartsByUser(userId)
  res.json({ data: carts })
}

export const handleCreateCart = async (req: Request, res: Response) => {
  const payload = validateCreateCartPayload(req.body)
  const cart = await createCartForUser(payload.userId)
  res.status(201).json({ data: cart, message: 'Tạo giỏ hàng thành công.' })
}

export const handleUpdateCartStatus = async (req: Request, res: Response) => {
  const cartId = validateCartId(req.params.cartId)
  const payload = validateUpdateCartStatusPayload(req.body)
  const cart = await changeCartStatus(cartId, payload)
  res.json({ data: cart, message: 'Cập nhật trạng thái giỏ hàng thành công.' })
}


