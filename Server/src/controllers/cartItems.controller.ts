import type { Request, Response } from 'express'

import {
  addCartItem,
  listCartItems,
  removeCartItem,
  updateCartItem,
} from '../services/cartItems.service.js'
import {
  validateAddCartItemPayload,
  validateCartItemId,
  validateUpdateCartItemPayload,
} from '../validators/cartItem.validator.js'
import { validateCartId } from '../validators/cart.validator.js'

// Controller cho cart items

export const handleListCartItems = async (req: Request, res: Response) => {
  const cartId = validateCartId(req.params.cartId)
  const items = await listCartItems(cartId)
  res.json({ data: items })
}

export const handleAddCartItem = async (req: Request, res: Response) => {
  const cartId = validateCartId(req.params.cartId)
  const payload = validateAddCartItemPayload({ ...req.body, cartId })
  const items = await addCartItem(payload)
  res.status(201).json({ data: items, message: 'Đã thêm sản phẩm vào giỏ hàng.' })
}

export const handleUpdateCartItem = async (req: Request, res: Response) => {
  const cartId = validateCartId(req.params.cartId)
  const cartItemId = validateCartItemId(req.params.cartItemId)
  const payload = validateUpdateCartItemPayload(req.body)
  const items = await updateCartItem(cartId, cartItemId, payload)
  res.json({ data: items, message: 'Đã cập nhật sản phẩm trong giỏ hàng.' })
}

export const handleRemoveCartItem = async (req: Request, res: Response) => {
  const cartId = validateCartId(req.params.cartId)
  const cartItemId = validateCartItemId(req.params.cartItemId)
  const items = await removeCartItem(cartId, cartItemId)
  res.json({ data: items, message: 'Đã xóa sản phẩm khỏi giỏ hàng.' })
}


