import type { Request, Response } from 'express'

import {
  listInventoryTransactions,
  recordInventoryTransaction,
  recordBulkInventoryTransactions,
  getInventoryTransaction,
} from '../services/inventoryTransactions.service.js'
import {
  validateCreateInventoryTransactionPayload,
  validateCreateBulkInventoryTransactionPayload,
} from '../validators/inventoryTransaction.validator.js'

// Controller cho giao dịch tồn kho

const parseTransactionsQuery = (query: Record<string, unknown>) => {
  const filters: {
    productId?: number
    userId?: number
    transactionType?: 'import' | 'export'
    from?: string
    to?: string
  } = {}

  if (query.productId !== undefined) {
    const id = Number(query.productId)
    if (Number.isInteger(id) && id > 0) {
      filters.productId = id
    }
  }

  if (query.userId !== undefined) {
    const id = Number(query.userId)
    if (Number.isInteger(id) && id > 0) {
      filters.userId = id
    }
  }

  if (query.transactionType === 'import' || query.transactionType === 'export') {
    filters.transactionType = query.transactionType
  }

  if (typeof query.from === 'string') {
    filters.from = query.from
  }

  if (typeof query.to === 'string') {
    filters.to = query.to
  }

  return filters
}

export const handleListInventoryTransactions = async (req: Request, res: Response) => {
  const filters = parseTransactionsQuery(req.query)
  const transactions = await listInventoryTransactions(filters)
  res.json({ data: transactions })
}

export const handleGetInventoryTransaction = async (req: Request, res: Response) => {
  const transactionId = Number(req.params.transactionId)
  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    return res.status(400).json({ message: 'transactionId không hợp lệ.' })
  }
  const transaction = await getInventoryTransaction(transactionId)
  res.json({ data: transaction })
}

export const handleCreateInventoryTransaction = async (req: Request, res: Response) => {
  const payload = validateCreateInventoryTransactionPayload(req.body)
  const transaction = await recordInventoryTransaction(payload)
  res
    .status(201)
    .json({ data: transaction, message: 'Ghi nhận giao dịch tồn kho thành công.' })
}

export const handleCreateBulkInventoryTransactions = async (req: Request, res: Response) => {
  const payload = validateCreateBulkInventoryTransactionPayload(req.body)
  const transactions = await recordBulkInventoryTransactions(payload)
  res.status(201).json({
    data: transactions,
    message: `Ghi nhận thành công ${transactions.length} giao dịch tồn kho.`,
  })
}


