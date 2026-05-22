import HttpError from '../utils/httpError.js'
import type {
  CreateInventoryTransactionPayload,
  CreateBulkInventoryTransactionPayload,
  InventoryTransaction,
  InventoryTransactionType,
} from '../types/inventoryTransaction.js'
import {
  createInventoryTransaction,
  findAllInventoryTransactions,
  findInventoryTransactionById,
} from '../repositories/inventoryTransactions.repository.js'
import { findProductById } from '../repositories/products.repository.js'
import { findUserById } from '../repositories/users.repository.js'

// Nghiệp vụ giao dịch tồn kho

interface ListTransactionsOptions {
  productId?: number
  userId?: number
  transactionType?: InventoryTransactionType
  from?: string
  to?: string
}

export const listInventoryTransactions = async (
  options: ListTransactionsOptions,
): Promise<InventoryTransaction[]> => {
  return findAllInventoryTransactions(options)
}

export const getInventoryTransaction = async (
  transactionId: number,
): Promise<InventoryTransaction> => {
  const transaction = await findInventoryTransactionById(transactionId)
  if (!transaction) {
    throw new HttpError(404, 'Giao dịch kho không tồn tại.')
  }
  return transaction
}

export const recordInventoryTransaction = async (
  payload: CreateInventoryTransactionPayload,
): Promise<InventoryTransaction> => {
  const product = await findProductById(payload.productId)
  if (!product) {
    throw new HttpError(400, 'productId không tồn tại.')
  }

  if (payload.userId) {
    const user = await findUserById(payload.userId)
    if (!user) {
      throw new HttpError(400, 'userId không tồn tại.')
    }
  }

  return createInventoryTransaction(payload)
}

export const recordBulkInventoryTransactions = async (
  payload: CreateBulkInventoryTransactionPayload,
): Promise<InventoryTransaction[]> => {
  if (!payload.items || payload.items.length === 0) {
    throw new HttpError(400, 'Danh sách sản phẩm không được rỗng.')
  }

  if (payload.userId) {
    const user = await findUserById(payload.userId)
    if (!user) {
      throw new HttpError(400, 'userId không tồn tại.')
    }
  }

  // Validate tất cả products trước
  for (const item of payload.items) {
    const product = await findProductById(item.productId)
    if (!product) {
      throw new HttpError(400, `Sản phẩm ID ${item.productId} không tồn tại.`)
    }
    if (item.quantity <= 0) {
      throw new HttpError(400, `Số lượng sản phẩm ID ${item.productId} phải lớn hơn 0.`)
    }
  }

  // Tạo transactions cho tất cả items
  const transactions: InventoryTransaction[] = []
  for (const item of payload.items) {
    const transaction = await createInventoryTransaction({
      productId: item.productId,
      userId: payload.userId ?? null,
      transactionType: payload.transactionType,
      quantity: item.quantity,
      note: payload.note ?? null,
    })
    transactions.push(transaction)
  }

  return transactions
}


