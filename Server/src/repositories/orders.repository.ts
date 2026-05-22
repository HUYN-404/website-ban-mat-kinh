import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type {
  CreateOrderItemPayload,
  Order,
  OrderItem,
  OrderStatus,
} from '../types/order.js'

// Thao tác với bảng orders và order_items

type OrderRow = RowDataPacket & {
  order_id: number
  user_id: number
  user_name: string | null
  status: OrderStatus
  total_amount: number
  payment_id: number | null
  order_date: Date
}

type OrderItemRow = RowDataPacket & {
  order_item_id: number
  product_id: number
  product_name: string | null
  product_status: 'available' | 'unavailable' | null
  quantity: number
  unit_price: number
}

const mapOrder = (row: OrderRow): Order => ({
  id: row.order_id,
  userId: row.user_id,
  userName: row.user_name,
  status: row.status,
  totalAmount: Number(row.total_amount),
  paymentId: row.payment_id,
  note: null, // Orders không có note trong DB
  createdAt: row.order_date.toISOString(),
  updatedAt: row.order_date.toISOString(), // Orders không có updated_at, dùng order_date
})

const mapOrderItem = (row: OrderItemRow): OrderItem => ({
  id: row.order_item_id,
  productId: row.product_id,
  productName: row.product_name,
  productStatus: row.product_status,
  quantity: row.quantity,
  unitPrice: Number(row.unit_price),
  subtotal: Number(row.unit_price) * row.quantity,
})

interface FindOrdersOptions {
  userId?: number
  status?: OrderStatus
  from?: string
  to?: string
}

export const findAllOrders = async (options: FindOrdersOptions): Promise<Order[]> => {
  const filters: string[] = []
  const values: Array<string | number> = []

  if (options.userId) {
    filters.push('o.user_id = ?')
    values.push(options.userId)
  }

  if (options.status) {
    filters.push('o.status = ?')
    values.push(options.status)
  }

  if (options.from) {
    filters.push('o.order_date >= ?')
    values.push(options.from)
  }

  if (options.to) {
    filters.push('o.order_date <= ?')
    values.push(options.to)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const [rows] = await pool.query<OrderRow[]>(
    `
    SELECT
      o.order_id,
      o.user_id,
      u.full_name AS user_name,
      o.status,
      o.total_amount,
      o.payment_id,
      o.order_date
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    ${whereClause}
    ORDER BY o.order_date DESC, o.order_id DESC
  `,
    values,
  )

  return rows.map(mapOrder)
}

export const findOrderById = async (orderId: number): Promise<Order | null> => {
  const [rows] = await pool.query<OrderRow[]>(
    `
    SELECT
      o.order_id,
      o.user_id,
      u.full_name AS user_name,
      o.status,
      o.total_amount,
      o.payment_id,
      o.order_date
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    WHERE o.order_id = ?
    LIMIT 1
  `,
    [orderId],
  )

  if (!rows.length) {
    return null
  }

  return mapOrder(rows[0])
}

export const findOrderItems = async (orderId: number): Promise<OrderItem[]> => {
  const [rows] = await pool.query<OrderItemRow[]>(
    `
    SELECT
      oi.order_item_id,
      oi.product_id,
      p.name AS product_name,
      p.status AS product_status,
      oi.quantity,
      oi.unit_price
    FROM orders_items oi
    LEFT JOIN products p ON oi.product_id = p.product_id
    WHERE oi.order_id = ?
    ORDER BY oi.order_item_id ASC
  `,
    [orderId],
  )

  return rows.map(mapOrderItem)
}

interface CreateOrderWithItemsPayload {
  userId: number
  status: OrderStatus
  totalAmount: number
  paymentId?: number | null
  note?: string | null
  items: Array<CreateOrderItemPayload & { unitPrice: number }>
}

export const createOrderWithItems = async (payload: CreateOrderWithItemsPayload): Promise<number> => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [orderResult] = await connection.execute<ResultSetHeader>(
      `
      INSERT INTO orders (user_id, status, total_amount, payment_id)
      VALUES (?, ?, ?, ?)
    `,
      [
        payload.userId,
        payload.status,
        payload.totalAmount,
        payload.paymentId ?? null,
      ],
    )

    const orderId = Number(orderResult.insertId)

    for (const item of payload.items) {
      await connection.execute(
        `
        INSERT INTO orders_items (order_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
      `,
        [orderId, item.productId, item.quantity, item.unitPrice],
      )
    }

    await connection.commit()

    return orderId
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export const updateOrderStatus = async (orderId: number, status: OrderStatus): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    UPDATE orders
    SET status = ?
    WHERE order_id = ?
  `,
    [status, orderId],
  )

  return result.affectedRows > 0
}

export const updateOrderPaymentId = async (orderId: number, paymentId: number | null): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    UPDATE orders
    SET payment_id = ?
    WHERE order_id = ?
  `,
    [paymentId, orderId],
  )

  return result.affectedRows > 0
}

export const findOrderItemById = async (orderItemId: number): Promise<OrderItem & { orderId: number } | null> => {
  const [rows] = await pool.query<(OrderItemRow & { order_id: number })[]>(
    `
    SELECT
      oi.order_item_id,
      oi.order_id,
      oi.product_id,
      p.name AS product_name,
      p.status AS product_status,
      oi.quantity,
      oi.unit_price
    FROM orders_items oi
    LEFT JOIN products p ON oi.product_id = p.product_id
    WHERE oi.order_item_id = ?
    LIMIT 1
  `,
    [orderItemId],
  )

  if (!rows.length) {
    return null
  }

  const row = rows[0]

  return {
    orderId: row.order_id,
    ...mapOrderItem(row),
  }
}

export const createOrderItem = async (
  orderId: number,
  item: CreateOrderItemPayload & { unitPrice: number },
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO orders_items (order_id, product_id, quantity, unit_price)
    VALUES (?, ?, ?, ?)
  `,
    [orderId, item.productId, item.quantity, item.unitPrice],
  )

  return Number(result.insertId)
}

export const updateOrderItemRecord = async (
  orderItemId: number,
  payload: { quantity?: number; unitPrice?: number },
): Promise<boolean> => {
  const fields: string[] = []
  const values: Array<number> = []

  if (payload.quantity !== undefined) {
    fields.push('quantity = ?')
    values.push(payload.quantity)
  }

  if (payload.unitPrice !== undefined) {
    fields.push('unit_price = ?')
    values.push(payload.unitPrice)
  }

  if (!fields.length) {
    return false
  }

  values.push(orderItemId)

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE orders_items SET ${fields.join(', ')} WHERE order_item_id = ?`,
    values,
  )

  return result.affectedRows > 0
}

export const deleteOrderItemRecord = async (orderItemId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM orders_items WHERE order_item_id = ?',
    [orderItemId],
  )

  return result.affectedRows > 0
}

export const recalculateOrderTotal = async (orderId: number): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT COALESCE(SUM(quantity * unit_price), 0) AS total
    FROM orders_items
    WHERE order_id = ?
  `,
    [orderId],
  )

  const total = Number(rows[0]?.total ?? 0)

  await pool.execute(
    `
    UPDATE orders
    SET total_amount = ?
    WHERE order_id = ?
  `,
    [total, orderId],
  )

  return total
}

