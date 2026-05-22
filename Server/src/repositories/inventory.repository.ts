import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type { InventoryItem, UpdateInventoryPayload } from '../types/inventory.js'

// Thao tác với bảng inventory

type InventoryRow = RowDataPacket & {
  inventory_id: number
  product_id: number
  product_name: string | null
  total_quantity: number
  last_updated: Date
}

const mapInventoryItem = (row: InventoryRow): InventoryItem => ({
  id: row.inventory_id,
  productId: row.product_id,
  productName: row.product_name,
  totalQuantity: row.total_quantity,
  lastUpdated: row.last_updated.toISOString(),
})

export const findAllInventory = async (): Promise<InventoryItem[]> => {
  const [rows] = await pool.query<InventoryRow[]>(
    `
    SELECT
      i.inventory_id,
      i.product_id,
      p.name AS product_name,
      i.total_quantity,
      i.last_updated
    FROM inventory i
    LEFT JOIN products p ON i.product_id = p.product_id
    ORDER BY p.name ASC
  `,
  )

  return rows.map(mapInventoryItem)
}

export const findInventoryByProductId = async (
  productId: number,
): Promise<InventoryItem | null> => {
  const [rows] = await pool.query<InventoryRow[]>(
    `
    SELECT
      i.inventory_id,
      i.product_id,
      p.name AS product_name,
      i.total_quantity,
      i.last_updated
    FROM inventory i
    LEFT JOIN products p ON i.product_id = p.product_id
    WHERE i.product_id = ?
    LIMIT 1
  `,
    [productId],
  )

  if (!rows.length) {
    return null
  }

  return mapInventoryItem(rows[0])
}

export const createInventoryRecord = async (
  productId: number,
  initialQuantity = 0,
): Promise<InventoryItem> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO inventory (product_id, total_quantity)
    VALUES (?, ?)
  `,
    [productId, initialQuantity],
  )

  const [rows] = await pool.query<InventoryRow[]>(
    `
    SELECT
      i.inventory_id,
      i.product_id,
      p.name AS product_name,
      i.total_quantity,
      i.last_updated
    FROM inventory i
    LEFT JOIN products p ON i.product_id = p.product_id
    WHERE i.inventory_id = ?
    LIMIT 1
  `,
    [result.insertId],
  )

  return mapInventoryItem(rows[0])
}

export const updateInventory = async (
  productId: number,
  payload: UpdateInventoryPayload,
): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    UPDATE inventory
    SET total_quantity = ?, last_updated = CURRENT_TIMESTAMP
    WHERE product_id = ?
  `,
    [payload.totalQuantity, productId],
  )

  return result.affectedRows > 0
}


