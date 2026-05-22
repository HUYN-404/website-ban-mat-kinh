import HttpError from '../utils/httpError.js'
import type { CreateSupplierPayload, UpdateSupplierPayload } from '../types/supplier.js'

const EMAIL_REGEX =
  /^(?:[a-zA-Z0-9_'^&\/+-])+(?:\.(?:[a-zA-Z0-9_'^&\/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
const PHONE_REGEX = /^[0-9+()\s-]{6,20}$/

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

export const validateSupplierId = (value: unknown): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'supplierId không hợp lệ.')
  }
  return id
}

export const validateCreateSupplierPayload = (payload: unknown): CreateSupplierPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>
  const name = ensureName(data.name)
  const phone = ensureOptionalString(data.phone, 'phone')
  if (phone && !PHONE_REGEX.test(phone)) {
    throw new HttpError(400, 'phone không hợp lệ.')
  }
  const email = ensureOptionalString(data.email, 'email')
  if (email && !EMAIL_REGEX.test(email)) {
    throw new HttpError(400, 'email không hợp lệ.')
  }
  const address = ensureOptionalString(data.address, 'address')

  return {
    name,
    phone,
    email,
    address,
  }
}

export const validateUpdateSupplierPayload = (payload: unknown): UpdateSupplierPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>
  const result: UpdateSupplierPayload = {}

  if (data.name !== undefined) {
    result.name = ensureName(data.name)
  }

  if (data.phone !== undefined) {
    const phone = ensureOptionalString(data.phone, 'phone')
    if (phone && !PHONE_REGEX.test(phone)) {
      throw new HttpError(400, 'phone không hợp lệ.')
    }
    result.phone = phone ?? null
  }

  if (data.email !== undefined) {
    const email = ensureOptionalString(data.email, 'email')
    if (email && !EMAIL_REGEX.test(email)) {
      throw new HttpError(400, 'email không hợp lệ.')
    }
    result.email = email ?? null
  }

  if (data.address !== undefined) {
    result.address = ensureOptionalString(data.address, 'address') ?? null
  }

  if (!Object.keys(result).length) {
    throw new HttpError(400, 'Không có dữ liệu nào để cập nhật.')
  }

  return result
}


