import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type { CartItem } from '../types/cartItem.js'

// Thao tác với bảng cart_items

type CartItemRow = RowDataPacket & {
  cart_item_id: number
  cart_id: number
  product_id: number
  product_name: string | null
  quantity: number
  unit_price: number
  created_at: Date
  updated_at: Date
}

const mapCartItem = (row: CartItemRow): CartItem => ({
  id: row.cart_item_id,
  cartId: row.cart_id,
  productId: row.product_id,
  productName: row.product_name,
  quantity: row.quantity,
  unitPrice: Number(row.unit_price),
  subtotal: row.quantity * Number(row.unit_price),
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
})

export const findCartItems = async (cartId: number): Promise<CartItem[]> => {
  const [rows] = await pool.query<CartItemRow[]>(
    `
    SELECT
      ci.cart_item_id,
      ci.cart_id,
      ci.product_id,
      p.name AS product_name,
      ci.quantity,
      ci.unit_price,
      ci.created_at,
      ci.updated_at
    FROM cart_items ci
    LEFT JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_id = ?
    ORDER BY ci.cart_item_id DESC
  `,
    [cartId],
  )

  return rows.map(mapCartItem)
}

export const findCartItemById = async (cartItemId: number): Promise<CartItem | null> => {
  const [rows] = await pool.query<CartItemRow[]>(
    `
    SELECT
      ci.cart_item_id,
      ci.cart_id,
      ci.product_id,
      p.name AS product_name,
      ci.quantity,
      ci.unit_price,
      ci.created_at,
      ci.updated_at
    FROM cart_items ci
    LEFT JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_item_id = ?
    LIMIT 1
  `,
    [cartItemId],
  )

  if (!rows.length) {
    return null
  }

  return mapCartItem(rows[0])
}

export const findCartItemByCartAndProduct = async (
  cartId: number,
  productId: number,
): Promise<CartItem | null> => {
  const [rows] = await pool.query<CartItemRow[]>(
    `
    SELECT
      ci.cart_item_id,
      ci.cart_id,
      ci.product_id,
      p.name AS product_name,
      ci.quantity,
      ci.unit_price,
      ci.created_at,
      ci.updated_at
    FROM cart_items ci
    LEFT JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_id = ? AND ci.product_id = ?
    LIMIT 1
  `,
    [cartId, productId],
  )

  if (!rows.length) {
    return null
  }

  return mapCartItem(rows[0])
}

export const createCartItem = async (
  cartId: number,
  productId: number,
  quantity: number,
  unitPrice: number,
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
    VALUES (?, ?, ?, ?)
  `,
    [cartId, productId, quantity, unitPrice],
  )

  return Number(result.insertId)
}

export const updateCartItemQuantity = async (
  cartItemId: number,
  quantity: number,
): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    UPDATE cart_items
    SET quantity = ?, updated_at = CURRENT_TIMESTAMP
    WHERE cart_item_id = ?
  `,
    [quantity, cartItemId],
  )

  return result.affectedRows > 0
}

export const deleteCartItem = async (cartItemId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM cart_items WHERE cart_item_id = ?',
    [cartItemId],
  )

  return result.affectedRows > 0
}


