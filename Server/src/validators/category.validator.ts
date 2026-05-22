import HttpError from '../utils/httpError.js'
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../types/category.js'

// Kiểm tra id danh mục hợp lệ
export const validateCategoryId = (value: unknown): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'categoryId không hợp lệ.')
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

const parseParentId = (value: unknown): number | null | undefined => {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'parentId không hợp lệ.')
  }
  return id
}

export const validateCreateCategoryPayload = (payload: unknown): CreateCategoryPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>

  return {
    name: ensureName(data.name),
    description: ensureOptionalString(data.description, 'description') ?? null,
    parentId: parseParentId(data.parentId) ?? null,
  }
}

export const validateUpdateCategoryPayload = (payload: unknown): UpdateCategoryPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>
  const result: UpdateCategoryPayload = {}

  if (data.name !== undefined) {
    result.name = ensureName(data.name)
  }

  if (data.description !== undefined) {
    result.description = ensureOptionalString(data.description, 'description') ?? null
  }

  if (data.parentId !== undefined) {
    result.parentId = parseParentId(data.parentId) ?? null
  }

  if (!Object.keys(result).length) {
    throw new HttpError(400, 'Không có dữ liệu nào để cập nhật.')
  }

  return result
}


