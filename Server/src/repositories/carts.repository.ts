import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type { Cart, CartStatus } from '../types/cart.js'

// Thao tác với bảng carts

type CartRow = RowDataPacket & {
  cart_id: number
  user_id: number
  status: CartStatus
  created_at: Date
  updated_at: Date
}

const mapCart = (row: CartRow): Cart => ({
  id: row.cart_id,
  userId: row.user_id,
  status: row.status,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
})

export const findCartById = async (cartId: number): Promise<Cart | null> => {
  const [rows] = await pool.query<CartRow[]>(
    `
    SELECT cart_id, user_id, status, created_at, updated_at
    FROM carts
    WHERE cart_id = ?
    LIMIT 1
  `,
    [cartId],
  )

  if (!rows.length) {
    return null
  }

  return mapCart(rows[0])
}

export const findActiveCartByUserId = async (userId: number): Promise<Cart | null> => {
  const [rows] = await pool.query<CartRow[]>(
    `
    SELECT cart_id, user_id, status, created_at, updated_at
    FROM carts
    WHERE user_id = ? AND status = 'active'
    LIMIT 1
  `,
    [userId],
  )

  if (!rows.length) {
    return null
  }

  return mapCart(rows[0])
}

export const findCartsByUserId = async (userId: number): Promise<Cart[]> => {
  const [rows] = await pool.query<CartRow[]>(
    `
    SELECT cart_id, user_id, status, created_at, updated_at
    FROM carts
    WHERE user_id = ?
    ORDER BY created_at DESC, cart_id DESC
  `,
    [userId],
  )

  return rows.map(mapCart)
}

export const createCart = async (userId: number): Promise<Cart> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO carts (user_id, status)
    VALUES (?, 'active')
  `,
    [userId],
  )

  const cartId = Number(result.insertId)

  const cart = await findCartById(cartId)
  if (!cart) {
    throw new Error('Không thể lấy thông tin giỏ hàng vừa tạo.')
  }
  return cart
}

export const updateCartStatus = async (
  cartId: number,
  status: CartStatus,
): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    UPDATE carts
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE cart_id = ?
  `,
    [status, cartId],
  )

  return result.affectedRows > 0
}


