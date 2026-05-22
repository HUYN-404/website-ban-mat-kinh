import HttpError from '../utils/httpError.js'
import type { CreateBrandPayload, UpdateBrandPayload } from '../types/brand.js'

// Validate brandId từ params
export const validateBrandId = (value: unknown): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'brandId không hợp lệ.')
  }
  return id
}

const ensureName = (value: unknown): string => {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'name phải là chuỗi.')
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new HttpError(400, 'name không được để trống.')
  }
  return trimmed
}

const ensureOptionalString = (value: unknown, field: string): string | null | undefined => {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} phải là chuỗi.`)
  }
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export const validateCreateBrandPayload = (payload: unknown): CreateBrandPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>

  return {
    name: ensureName(data.name),
    description: ensureOptionalString(data.description, 'description') ?? null,
    country: ensureOptionalString(data.country, 'country') ?? null,
  }
}

export const validateUpdateBrandPayload = (payload: unknown): UpdateBrandPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>
  const result: UpdateBrandPayload = {}

  if (data.name !== undefined) {
    result.name = ensureName(data.name)
  }

  if (data.description !== undefined) {
    result.description = ensureOptionalString(data.description, 'description') ?? null
  }

  if (data.country !== undefined) {
    result.country = ensureOptionalString(data.country, 'country') ?? null
  }

  if (!Object.keys(result).length) {
    throw new HttpError(400, 'Không có dữ liệu nào để cập nhật.')
  }

  return result
}


