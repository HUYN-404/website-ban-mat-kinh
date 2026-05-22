import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type { CreatePaymentPayload, Payment, PaymentStatus, UpdatePaymentPayload } from '../types/payment.js'

// Thao tác với bảng payments

type PaymentRow = RowDataPacket & {
  payment_id: number
  order_id: number
  payment_method: string
  payment_status: PaymentStatus
  amount: number
  payment_date: Date
}

const mapPayment = (row: PaymentRow): Payment => ({
  id: row.payment_id,
  orderId: row.order_id,
  method: row.payment_method as Payment['method'],
  status: row.payment_status,
  amount: Number(row.amount),
  transactionCode: null, // Payments không có transaction_code trong DB
  note: null, // Payments không có note trong DB
  createdAt: row.payment_date.toISOString(),
  updatedAt: row.payment_date.toISOString(), // Payments không có updated_at, dùng payment_date
})

export const findAllPayments = async (): Promise<Payment[]> => {
  const [rows] = await pool.query<PaymentRow[]>(
    `
    SELECT payment_id, order_id, payment_method, payment_status, amount, payment_date
    FROM payments
    ORDER BY payment_date DESC, payment_id DESC
  `,
  )

  return rows.map(mapPayment)
}

export const findPaymentById = async (paymentId: number): Promise<Payment | null> => {
  const [rows] = await pool.query<PaymentRow[]>(
    `
    SELECT payment_id, order_id, payment_method, payment_status, amount, payment_date
    FROM payments
    WHERE payment_id = ?
    LIMIT 1
  `,
    [paymentId],
  )

  if (!rows.length) {
    return null
  }

  return mapPayment(rows[0])
}

export const findPaymentsByOrderId = async (orderId: number): Promise<Payment[]> => {
  const [rows] = await pool.query<PaymentRow[]>(
    `
    SELECT payment_id, order_id, payment_method, payment_status, amount, payment_date
    FROM payments
    WHERE order_id = ?
    ORDER BY payment_date DESC, payment_id DESC
  `,
    [orderId],
  )

  return rows.map(mapPayment)
}

export const createPayment = async (payload: CreatePaymentPayload): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO payments (order_id, payment_method, payment_status, amount)
    VALUES (?, ?, 'pending', ?)
  `,
    [
      payload.orderId,
      payload.method,
      payload.amount,
    ],
  )

  return Number(result.insertId)
}

export const updatePayment = async (
  paymentId: number,
  payload: UpdatePaymentPayload,
): Promise<boolean> => {
  if (!Object.keys(payload).length) {
    return false
  }

  const fields: string[] = []
  const values: Array<string | number | null> = []

  if (payload.status !== undefined) {
    fields.push('payment_status = ?')
    values.push(payload.status)
  }

  // Note: Payments table không có note và transaction_code trong DB thực tế
  // Nếu cần, có thể thêm migration để thêm các field này

  if (!fields.length) {
    return false
  }

  values.push(paymentId)

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE payments SET ${fields.join(', ')} WHERE payment_id = ?`,
    values,
  )

  return result.affectedRows > 0
}


