import HttpError from '../utils/httpError.js'
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  UserStatus,
} from '../types/user.js'

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/
const EMAIL_REGEX =
  /^(?:[a-zA-Z0-9_'^&\/+-])+(?:\.(?:[a-zA-Z0-9_'^&\/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
const PHONE_REGEX = /^[0-9+()\s-]{6,20}$/

const ensureTrimmedString = (value: unknown, field: string): string => {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} phải là chuỗi.`)
  }
  return value.trim()
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

const parseRoleId = (value: unknown): number | null | undefined => {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  const roleId = Number(value)
  if (!Number.isInteger(roleId) || roleId <= 0) {
    throw new HttpError(400, 'roleId không hợp lệ.')
  }
  return roleId
}

const parseStatus = (value: unknown, required = false): UserStatus | undefined => {
  if (value === undefined) {
    if (required) {
      throw new HttpError(400, 'status là bắt buộc.')
    }
    return undefined
  }
  if (value !== 'active' && value !== 'inactive') {
    throw new HttpError(400, 'status chỉ chấp nhận giá trị active hoặc inactive.')
  }
  return value
}

export const validateUserId = (value: unknown): number => {
  const userId = Number(value)
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new HttpError(400, 'userId không hợp lệ.')
  }
  return userId
}

export const validateUsersQuery = (query: Record<string, unknown>): {
  status?: UserStatus
  roleId?: number
  search?: string
} => {
  const result: {
    status?: UserStatus
    roleId?: number
    search?: string
  } = {}

  if (query.status !== undefined) {
    result.status = parseStatus(query.status, false)
  }

  if (query.roleId !== undefined) {
    const roleId = Number(query.roleId)
    if (!Number.isInteger(roleId) || roleId <= 0) {
      throw new HttpError(400, 'roleId trong query không hợp lệ.')
    }
    result.roleId = roleId
  }

  if (query.search !== undefined) {
    const search = ensureTrimmedString(query.search, 'search')
    if (search) {
      result.search = search
    }
  }

  return result
}

export const validateCreateUserPayload = (payload: unknown): CreateUserPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>

  const username = ensureTrimmedString(data.username, 'username')
  if (!USERNAME_REGEX.test(username)) {
    throw new HttpError(
      400,
      'username chỉ chứa chữ, số, dấu gạch ngang, gạch dưới, dấu chấm và dài 3-30 ký tự.',
    )
  }

  const password = ensureTrimmedString(data.password, 'password')
  if (password.length < 6) {
    throw new HttpError(400, 'password phải có tối thiểu 6 ký tự.')
  }

  const fullName = ensureOptionalString(data.fullName, 'fullName')
  const email = ensureOptionalString(data.email, 'email')
  if (email && !EMAIL_REGEX.test(email)) {
    throw new HttpError(400, 'email không hợp lệ.')
  }

  const phone = ensureOptionalString(data.phone, 'phone')
  if (phone && !PHONE_REGEX.test(phone)) {
    throw new HttpError(400, 'phone không hợp lệ.')
  }

  const address = ensureOptionalString(data.address, 'address')
  const roleId = parseRoleId(data.roleId)
  const status = parseStatus(data.status, false)

  return {
    username,
    password,
    fullName,
    email,
    phone,
    address,
    roleId: roleId ?? null,
    status,
  }
}

export const validateUpdateUserPayload = (payload: unknown): UpdateUserPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>
  const result: UpdateUserPayload = {}

  if (data.username !== undefined) {
    const username = ensureTrimmedString(data.username, 'username')
    if (!USERNAME_REGEX.test(username)) {
      throw new HttpError(
        400,
        'username chỉ chứa chữ, số, dấu gạch ngang, gạch dưới, dấu chấm và dài 3-30 ký tự.',
      )
    }
    result.username = username
  }

  if (data.password !== undefined) {
    const password = ensureTrimmedString(data.password, 'password')
    if (password.length < 6) {
      throw new HttpError(400, 'password phải có tối thiểu 6 ký tự.')
    }
    result.password = password
  }

  if (data.fullName !== undefined) {
    result.fullName = ensureOptionalString(data.fullName, 'fullName') ?? null
  }

  if (data.email !== undefined) {
    const email = ensureOptionalString(data.email, 'email')
    if (email && !EMAIL_REGEX.test(email)) {
      throw new HttpError(400, 'email không hợp lệ.')
    }
    result.email = email ?? null
  }

  if (data.phone !== undefined) {
    const phone = ensureOptionalString(data.phone, 'phone')
    if (phone && !PHONE_REGEX.test(phone)) {
      throw new HttpError(400, 'phone không hợp lệ.')
    }
    result.phone = phone ?? null
  }

  if (data.address !== undefined) {
    result.address = ensureOptionalString(data.address, 'address') ?? null
  }

  if (data.roleId !== undefined) {
    result.roleId = parseRoleId(data.roleId) ?? null
  }

  if (!Object.keys(result).length) {
    throw new HttpError(400, 'Không có dữ liệu nào để cập nhật.')
  }

  return result
}

export const validateUpdateUserStatusPayload = (
  payload: unknown,
): UpdateUserStatusPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const status = parseStatus((payload as Record<string, unknown>).status, true)

  return {
    status: status!,
  }
}

