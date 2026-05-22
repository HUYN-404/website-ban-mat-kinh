import HttpError from '../utils/httpError.js'
import type {
  AddOrderItemPayload,
  CreateOrderItemPayload,
  CreateOrderPayload,
  OrderStatus,
  UpdateOrderItemPayload,
  UpdateOrderPaymentPayload,
  UpdateOrderStatusPayload,
} from '../types/order.js'

const ensureId = (value: unknown, field: string): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${field} không hợp lệ.`)
  }
  return id
}

const ensurePositiveInteger = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, `${field} phải là số nguyên dương.`)
  }
  return value
}

const ensureStatus = (value: unknown): OrderStatus => {
  if (value !== 'pending' && value !== 'paid' && value !== 'shipped' && value !== 'completed' && value !== 'cancelled') {
    throw new HttpError(400, 'status không hợp lệ.')
  }
  return value
}

const validateOrderItems = (value: unknown): CreateOrderItemPayload[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'items phải là mảng và không được rỗng.')
  }

  return value.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new HttpError(400, `items[${index}] không hợp lệ.`)
    }
    const record = item as Record<string, unknown>
    const productId = ensureId(record.productId, `items[${index}].productId`)
    const quantity = ensurePositiveInteger(record.quantity, `items[${index}].quantity`)

    return {
      productId,
      quantity,
    }
  })
}

export const validateOrderId = (value: unknown): number => ensureId(value, 'orderId')

export const validateCreateOrderPayload = (payload: unknown): CreateOrderPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>
  const userId = ensureId(data.userId, 'userId')
  const items = validateOrderItems(data.items)
  const note =
    typeof data.note === 'string' ? data.note.trim() || null : data.note === null ? null : undefined

  return {
    userId,
    items,
    note,
  }
}

export const validateUpdateOrderStatusPayload = (
  payload: unknown,
): UpdateOrderStatusPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const status = ensureStatus((payload as Record<string, unknown>).status)

  return { status }
}

export const validateUpdateOrderPaymentPayload = (
  payload: unknown,
): UpdateOrderPaymentPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const raw = (payload as Record<string, unknown>).paymentId

  if (raw === null || raw === undefined) {
    return { paymentId: null }
  }

  return {
    paymentId: ensureId(raw, 'paymentId'),
  }
}

export const validateAddOrderItemPayload = (payload: unknown): AddOrderItemPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>
  const productId = ensureId(data.productId, 'productId')
  const quantity = ensurePositiveInteger(data.quantity, 'quantity')

  let unitPrice: number | undefined
  if (data.unitPrice !== undefined) {
    if (typeof data.unitPrice !== 'number' || data.unitPrice < 0) {
      throw new HttpError(400, 'unitPrice phải là số không âm.')
    }
    unitPrice = data.unitPrice
  }

  return {
    productId,
    quantity,
    unitPrice,
  }
}

export const validateUpdateOrderItemPayload = (payload: unknown): UpdateOrderItemPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>
  const result: UpdateOrderItemPayload = {}

  if (data.quantity !== undefined) {
    result.quantity = ensurePositiveInteger(data.quantity, 'quantity')
  }

  if (data.unitPrice !== undefined) {
    if (typeof data.unitPrice !== 'number' || data.unitPrice < 0) {
      throw new HttpError(400, 'unitPrice phải là số không âm.')
    }
    result.unitPrice = data.unitPrice
  }

  if (!Object.keys(result).length) {
    throw new HttpError(400, 'Không có dữ liệu nào để cập nhật.')
  }

  return result
}

