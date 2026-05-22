import HttpError from '../utils/httpError.js'
import type { CreateProductImagePayload } from '../types/productImage.js'

// Regex đơn giản: chỉ cần bắt đầu bằng / hoặc http:///https://
// Cho phép tất cả ký tự trong tên file (kể cả dấu cách, ngoặc đơn, v.v.)
const URL_REGEX = /^(https?:\/\/|\/).+$/

export const validateProductImageId = (value: unknown): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'imageId không hợp lệ.')
  }
  return id
}

export const validateProductIdParam = (value: unknown): number => {
  const productId = Number(value)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new HttpError(400, 'productId không hợp lệ.')
  }
  return productId
}

export const validateCreateProductImagePayload = (
  payload: unknown,
): CreateProductImagePayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>

  const productId = validateProductIdParam(data.productId)

  if (typeof data.imageUrl !== 'string') {
    throw new HttpError(400, 'imageUrl phải là chuỗi.')
  }
  const imageUrl = data.imageUrl.trim()
  if (!imageUrl) {
    throw new HttpError(400, 'imageUrl không được để trống.')
  }
  if (!URL_REGEX.test(imageUrl)) {
    throw new HttpError(400, 'imageUrl không hợp lệ.')
  }

  return {
    productId,
    imageUrl,
  }
}


