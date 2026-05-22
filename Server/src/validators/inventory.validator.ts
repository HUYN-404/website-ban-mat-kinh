import HttpError from '../utils/httpError.js'
import type { UpdateInventoryPayload } from '../types/inventory.js'

export const validateInventoryProductId = (value: unknown): number => {
  const productId = Number(value)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new HttpError(400, 'productId không hợp lệ.')
  }
  return productId
}

export const validateUpdateInventoryPayload = (payload: unknown): UpdateInventoryPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const totalQuantity = (payload as Record<string, unknown>).totalQuantity
  if (typeof totalQuantity !== 'number' || !Number.isInteger(totalQuantity) || totalQuantity < 0) {
    throw new HttpError(400, 'totalQuantity phải là số nguyên không âm.')
  }

  return { totalQuantity }
}


