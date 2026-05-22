import HttpError from '../utils/httpError.js'
import type { CreateCartPayload, UpdateCartStatusPayload } from '../types/cart.js'

export const validateCartId = (value: unknown): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'cartId không hợp lệ.')
  }
  return id
}

export const validateUserIdParam = (value: unknown): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'userId không hợp lệ.')
  }
  return id
}

export const validateCreateCartPayload = (payload: unknown): CreateCartPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const userId = validateUserIdParam((payload as Record<string, unknown>).userId)

  return { userId }
}

export const validateUpdateCartStatusPayload = (
  payload: unknown,
): UpdateCartStatusPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const status = (payload as Record<string, unknown>).status

  if (status !== 'active' && status !== 'inactive') {
    throw new HttpError(400, 'status chỉ chấp nhận active hoặc inactive.')
  }

  return { status }
}


