import HttpError from '../utils/httpError.js'
import type { CreateBrandImagePayload } from '../types/brandImage.js'

const URL_REGEX =
  /^(https?:\/\/|\/)[\w.-]+(?:\.[\w\.-]+)*(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/

// Validate imageId
export const validateBrandImageId = (value: unknown): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'imageId không hợp lệ.')
  }
  return id
}

// Validate brandId từ params
export const validateBrandIdParam = (value: unknown): number => {
  const brandId = Number(value)
  if (!Number.isInteger(brandId) || brandId <= 0) {
    throw new HttpError(400, 'brandId không hợp lệ.')
  }
  return brandId
}

export const validateCreateBrandImagePayload = (payload: unknown): CreateBrandImagePayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>

  const brandId = validateBrandIdParam(data.brandId)

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
    brandId,
    imageUrl,
  }
}


