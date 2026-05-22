import HttpError from '../utils/httpError.js'
import type { AddCartItemPayload, UpdateCartItemPayload } from '../types/cartItem.js'

const ensureId = (value: unknown, field: string): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${field} không hợp lệ.`)
  }
  return id
}

const ensureQuantity = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, 'quantity phải là số nguyên dương.')
  }
  return value
}

export const validateCartItemId = (value: unknown): number => ensureId(value, 'cartItemId')

export const validateAddCartItemPayload = (payload: unknown): AddCartItemPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>

  const cartId = ensureId(data.cartId, 'cartId')
  const productId = ensureId(data.productId, 'productId')
  const quantity =
    data.quantity === undefined ? 1 : ensureQuantity(data.quantity)

  return {
    cartId,
    productId,
    quantity,
  }
}

export const validateUpdateCartItemPayload = (payload: unknown): UpdateCartItemPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const quantity = ensureQuantity((payload as Record<string, unknown>).quantity)

  return {
    quantity,
  }
}


