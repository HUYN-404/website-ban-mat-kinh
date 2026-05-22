import type { PoolConnection, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type {
  CreateInventoryTransactionPayload,
  InventoryTransaction,
  InventoryTransactionType,
} from '../types/inventoryTransaction.js'
import HttpError from '../utils/httpError.js'

// Thao tác bảng inventory_transactions, bao gồm cập nhật inventory

type InventoryTransactionRow = RowDataPacket & {
  transaction_id: number
  product_id: number
  product_name: string | null
  user_id: number | null
  user_name: string | null
  role_name: string | null
  transaction_type: InventoryTransactionType
  quantity: number
  note: string | null
  created_at: Date
}

const mapTransaction = (row: InventoryTransactionRow): InventoryTransaction => ({
  id: row.transaction_id,
  productId: row.product_id,
  productName: row.product_name,
  userId: row.user_id,
  userName: row.user_name,
  roleName: row.role_name,
  type: row.transaction_type,
  quantity: row.quantity,
  note: row.note,
  createdAt: row.created_at.toISOString(),
})

interface FindTransactionsOptions {
  productId?: number
  userId?: number
  transactionType?: InventoryTransactionType
  from?: string
  to?: string
}

export const findAllInventoryTransactions = async (
  options: FindTransactionsOptions,
): Promise<InventoryTransaction[]> => {
  const filters: string[] = []
  const values: Array<number | string> = []

  if (options.productId) {
    filters.push('t.product_id = ?')
    values.push(options.productId)
  }

  if (options.userId) {
    filters.push('t.user_id = ?')
    values.push(options.userId)
  }

  if (options.transactionType) {
    filters.push('t.transaction_type = ?')
    values.push(options.transactionType)
  }

  if (options.from) {
    filters.push('t.created_at >= ?')
    values.push(options.from)
  }

  if (options.to) {
    filters.push('t.created_at <= ?')
    values.push(options.to)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const [rows] = await pool.query<InventoryTransactionRow[]>(
    `
    SELECT
      t.transaction_id,
      t.product_id,
      p.name AS product_name,
      t.user_id,
      u.full_name AS user_name,
      r.role_name,
      t.transaction_type,
      t.quantity,
      t.note,
      t.created_at
    FROM inventory_transactions t
    LEFT JOIN products p ON t.product_id = p.product_id
    LEFT JOIN users u ON t.user_id = u.user_id
    LEFT JOIN roles r ON u.role_id = r.role_id
    ${whereClause}
    ORDER BY t.created_at DESC, t.transaction_id DESC
  `,
    values,
  )

  return rows.map(mapTransaction)
}

export const findInventoryTransactionById = async (
  transactionId: number,
): Promise<InventoryTransaction | null> => {
  const [rows] = await pool.query<InventoryTransactionRow[]>(
    `
    SELECT
      t.transaction_id,
      t.product_id,
      p.name AS product_name,
      t.user_id,
      u.full_name AS user_name,
      r.role_name,
      t.transaction_type,
      t.quantity,
      t.note,
      t.created_at
    FROM inventory_transactions t
    LEFT JOIN products p ON t.product_id = p.product_id
    LEFT JOIN users u ON t.user_id = u.user_id
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE t.transaction_id = ?
    LIMIT 1
  `,
    [transactionId],
  )

  if (!rows.length) {
    return null
  }

  return mapTransaction(rows[0])
}

const getInventoryRowForUpdate = async (
  connection: PoolConnection,
  productId: number,
): Promise<{ inventoryId: number; totalQuantity: number } | null> => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
    SELECT inventory_id, total_quantity
    FROM inventory
    WHERE product_id = ?
    FOR UPDATE
  `,
    [productId],
  )

  if (!rows.length) {
    return null
  }

  return {
    inventoryId: Number(rows[0].inventory_id),
    totalQuantity: Number(rows[0].total_quantity),
  }
}

const insertInventoryRecord = async (
  connection: PoolConnection,
  productId: number,
): Promise<void> => {
  await connection.execute(
    `
    INSERT INTO inventory (product_id, total_quantity)
    VALUES (?, 0)
  `,
    [productId],
  )
}

export const createInventoryTransaction = async (
  payload: CreateInventoryTransactionPayload,
): Promise<InventoryTransaction> => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // Khóa hàng tồn kho
    let inventoryRow = await getInventoryRowForUpdate(connection, payload.productId)
    if (!inventoryRow) {
      await insertInventoryRecord(connection, payload.productId)
      inventoryRow = await getInventoryRowForUpdate(connection, payload.productId)
    }

    if (!inventoryRow) {
      throw new HttpError(500, 'Không thể tạo bản ghi tồn kho cho sản phẩm.')
    }

    let newQuantity = inventoryRow.totalQuantity

    if (payload.transactionType === 'import') {
      newQuantity += payload.quantity
    } else {
      if (payload.quantity > inventoryRow.totalQuantity) {
        throw new HttpError(400, 'Số lượng xuất vượt quá tồn kho hiện tại.')
      }
      newQuantity -= payload.quantity
    }

    await connection.execute(
      `
      UPDATE inventory
      SET total_quantity = ?, last_updated = CURRENT_TIMESTAMP
      WHERE inventory_id = ?
    `,
      [newQuantity, inventoryRow.inventoryId],
    )

    await connection.execute(
      `
      INSERT INTO inventory_transactions
        (product_id, user_id, transaction_type, quantity, note)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        payload.productId,
        payload.userId ?? null,
        payload.transactionType,
        payload.quantity,
        payload.note ?? null,
      ],
    )

    const [rows] = await connection.query<InventoryTransactionRow[]>(
      `
      SELECT
        t.transaction_id,
        t.product_id,
        p.name AS product_name,
        t.user_id,
        u.full_name AS user_name,
        r.role_name,
        t.transaction_type,
        t.quantity,
        t.note,
        t.created_at
      FROM inventory_transactions t
      LEFT JOIN products p ON t.product_id = p.product_id
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE t.transaction_id = LAST_INSERT_ID()
      LIMIT 1
    `,
    )

    await connection.commit()

    return mapTransaction(rows[0])
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}


