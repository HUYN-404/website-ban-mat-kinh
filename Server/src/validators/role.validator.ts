import HttpError from '../utils/httpError.js'
import type { CreateRolePayload, UpdateRolePayload } from '../types/role.js'

// Hàm tiện ích đảm bảo chuỗi bắt buộc
const ensureNonEmptyString = (value: unknown, field: string): string => {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} phải là chuỗi.`)
  }

  const trimmed = value.trim()

  if (!trimmed) {
    throw new HttpError(400, `${field} không được để trống.`)
  }

  return trimmed
}

// Hàm tiện ích cho chuỗi optional / nullable
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

  return value.trim() || null
}

// Validate id từ params
export const validateRoleId = (rawId: unknown): number => {
  const parsedId = Number(rawId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new HttpError(400, 'roleId không hợp lệ.')
  }

  return parsedId
}

// Validate payload tạo mới
export const validateCreateRolePayload = (payload: unknown): CreateRolePayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const roleName = ensureNonEmptyString(
    (payload as Record<string, unknown>).roleName,
    'roleName',
  )
  const description = ensureOptionalString(
    (payload as Record<string, unknown>).description,
    'description',
  )

  return {
    roleName,
    description,
  }
}

// Validate payload cập nhật
export const validateUpdateRolePayload = (payload: unknown): UpdateRolePayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const { roleName, description } = payload as Record<string, unknown>

  const parsed: UpdateRolePayload = {}

  if (roleName !== undefined) {
    parsed.roleName = ensureNonEmptyString(roleName, 'roleName')
  }

  const descriptionResult = ensureOptionalString(description, 'description')
  if (descriptionResult !== undefined) {
    parsed.description = descriptionResult
  }

  if (!('roleName' in parsed) && !('description' in parsed)) {
    throw new HttpError(400, 'Không có dữ liệu nào để cập nhật.')
  }

  return parsed
}

