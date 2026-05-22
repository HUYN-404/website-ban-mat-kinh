import type { ReportFilters, ReportRecord } from '../types/report.js'
import pool from '../db/pool.js'
import type { RowDataPacket } from 'mysql2/promise'

// Truy vấn view Reports (READ ONLY)

type ReportRow = RowDataPacket & {
  order_id: number
  customer_name: string
  order_date: Date
  total_order_value: number
  total_items: number
  payment_status: string | null
}

const mapReport = (row: ReportRow): ReportRecord => ({
  orderId: row.order_id,
  customerName: row.customer_name,
  orderDate: row.order_date.toISOString(),
  totalOrderValue: Number(row.total_order_value),
  totalItems: Number(row.total_items),
  paymentStatus: row.payment_status,
})

export const fetchReports = async (filters: ReportFilters): Promise<ReportRecord[]> => {
  const conditions: string[] = []
  const params: Array<string> = []

  if (filters.from) {
    conditions.push('order_date >= ?')
    params.push(filters.from)
  }

  if (filters.to) {
    conditions.push('order_date <= ?')
    params.push(filters.to)
  }

  if (filters.paymentStatus) {
    conditions.push('(payment_status = ? OR (payment_status IS NULL AND ? = \'unpaid\'))')
    params.push(filters.paymentStatus, filters.paymentStatus)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await pool.query<ReportRow[]>(
    `
    SELECT
      order_id,
      customer_name,
      order_date,
      total_order_value,
      total_items,
      payment_status
    FROM \`Reports\`
    ${whereClause}
    ORDER BY order_date DESC, order_id DESC
  `,
    params,
  )

  return rows.map(mapReport)
}


