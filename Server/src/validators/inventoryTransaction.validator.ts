import HttpError from '../utils/httpError.js'
import type {
  CreateInventoryTransactionPayload,
  CreateBulkInventoryTransactionPayload,
  InventoryTransactionType,
} from '../types/inventoryTransaction.js'

const ensurePositiveInteger = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, `${field} phải là số nguyên dương.`)
  }
  return value
}

const ensureId = (value: unknown, field: string): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${field} không hợp lệ.`)
  }
  return id
}

const ensureTransactionType = (value: unknown): InventoryTransactionType => {
  if (value !== 'import' && value !== 'export') {
    throw new HttpError(400, 'transactionType phải là import hoặc export.')
  }
  return value
}

const ensureOptionalString = (value: unknown): string | null | undefined => {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, 'note phải là chuỗi.')
  }
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export const validateInventoryTransactionId = (value: unknown): number =>
  ensureId(value, 'transactionId')

export const validateCreateInventoryTransactionPayload = (
  payload: unknown,
): CreateInventoryTransactionPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>

  const productId = ensureId(data.productId, 'productId')
  const transactionType = ensureTransactionType(data.transactionType)
  const quantity = ensurePositiveInteger(data.quantity, 'quantity')

  let userId: number | null | undefined = undefined
  if (data.userId !== undefined) {
    if (data.userId === null) {
      userId = null
    } else {
      userId = ensureId(data.userId, 'userId')
    }
  }

  const note = ensureOptionalString(data.note) ?? null

  return {
    productId,
    userId,
    transactionType,
    quantity,
    note,
  }
}

export const validateCreateBulkInventoryTransactionPayload = (
  payload: unknown,
): CreateBulkInventoryTransactionPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>

  const transactionType = ensureTransactionType(data.transactionType)

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new HttpError(400, 'items phải là mảng không rỗng.')
  }

  const items = data.items.map((item: unknown, index: number) => {
    if (typeof item !== 'object' || item === null) {
      throw new HttpError(400, `items[${index}] không hợp lệ.`)
    }

    const itemData = item as Record<string, unknown>
    const productId = ensureId(itemData.productId, `items[${index}].productId`)
    const quantity = ensurePositiveInteger(itemData.quantity, `items[${index}].quantity`)

    return { productId, quantity }
  })

  let userId: number | null | undefined = undefined
  if (data.userId !== undefined) {
    if (data.userId === null) {
      userId = null
    } else {
      userId = ensureId(data.userId, 'userId')
    }
  }

  const note = ensureOptionalString(data.note) ?? null

  return {
    items,
    userId,
    transactionType,
    note,
  }
}


