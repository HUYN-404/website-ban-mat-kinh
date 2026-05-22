import HttpError from '../utils/httpError.js'
import type {
  CreatePaymentPayload,
  PaymentMethod,
  PaymentStatus,
  UpdatePaymentPayload,
} from '../types/payment.js'

const ensureId = (value: unknown, field: string): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${field} không hợp lệ.`)
  }
  return id
}

const ensureMethod = (value: unknown): PaymentMethod => {
  if (value !== 'cash' && value !== 'credit_card' && value !== 'bank_transfer') {
    throw new HttpError(400, 'paymentMethod không hợp lệ.')
  }
  return value
}

const ensureStatus = (value: unknown): PaymentStatus => {
  if (value !== 'pending' && value !== 'completed' && value !== 'failed') {
    throw new HttpError(400, 'paymentStatus không hợp lệ.')
  }
  return value
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

export const validatePaymentId = (value: unknown): number => ensureId(value, 'paymentId')

export const validateCreatePaymentPayload = (payload: unknown): CreatePaymentPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>

  const orderId = ensureId(data.orderId, 'orderId')
  const method = ensureMethod(data.method)

  if (typeof data.amount !== 'number' || data.amount < 0) {
    throw new HttpError(400, 'amount phải là số không âm.')
  }
  const amount = data.amount

  const note = ensureOptionalString(data.note, 'note') ?? null
  const transactionCode = ensureOptionalString(data.transactionCode, 'transactionCode') ?? null

  return {
    orderId,
    method,
    amount,
    note,
    transactionCode,
  }
}

export const validateUpdatePaymentPayload = (payload: unknown): UpdatePaymentPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>
  const result: UpdatePaymentPayload = {}

  if (data.status !== undefined) {
    result.status = ensureStatus(data.status)
  }

  if (data.note !== undefined) {
    result.note = ensureOptionalString(data.note, 'note') ?? null
  }

  if (data.transactionCode !== undefined) {
    result.transactionCode =
      ensureOptionalString(data.transactionCode, 'transactionCode') ?? null
  }

  if (!Object.keys(result).length) {
    throw new HttpError(400, 'Không có dữ liệu nào để cập nhật.')
  }

  return result
}


