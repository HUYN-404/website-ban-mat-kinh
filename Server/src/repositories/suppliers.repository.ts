import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type { CreateSupplierPayload, Supplier, UpdateSupplierPayload } from '../types/supplier.js'

// Thao tác trực tiếp với bảng suppliers

type SupplierRow = RowDataPacket & {
  supplier_id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

const mapSupplier = (row: SupplierRow): Supplier => ({
  id: row.supplier_id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  address: row.address,
  createdAt: new Date().toISOString(), // Suppliers không có created_at trong DB
  updatedAt: new Date().toISOString(), // Suppliers không có updated_at trong DB
})

export const findAllSuppliers = async (): Promise<Supplier[]> => {
  const [rows] = await pool.query<SupplierRow[]>(
    `
    SELECT supplier_id, name, phone, email, address
    FROM suppliers
    ORDER BY supplier_id ASC
  `,
  )
  return rows.map(mapSupplier)
}

export const findSupplierById = async (supplierId: number): Promise<Supplier | null> => {
  const [rows] = await pool.query<SupplierRow[]>(
    `
    SELECT supplier_id, name, phone, email, address
    FROM suppliers
    WHERE supplier_id = ?
    LIMIT 1
  `,
    [supplierId],
  )

  if (!rows.length) {
    return null
  }

  return mapSupplier(rows[0])
}

export const createSupplier = async (payload: CreateSupplierPayload): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO suppliers (name, phone, email, address)
    VALUES (?, ?, ?, ?)
  `,
    [payload.name, payload.phone ?? null, payload.email ?? null, payload.address ?? null],
  )
  return Number(result.insertId)
}

export const updateSupplier = async (
  supplierId: number,
  payload: UpdateSupplierPayload,
): Promise<boolean> => {
  if (!Object.keys(payload).length) {
    return false
  }

  const fields: string[] = []
  const values: Array<string | number | null> = []

  if (payload.name !== undefined) {
    fields.push('name = ?')
    values.push(payload.name)
  }
  if (payload.phone !== undefined) {
    fields.push('phone = ?')
    values.push(payload.phone)
  }
  if (payload.email !== undefined) {
    fields.push('email = ?')
    values.push(payload.email)
  }
  if (payload.address !== undefined) {
    fields.push('address = ?')
    values.push(payload.address)
  }

  if (!fields.length) {
    return false
  }

  values.push(supplierId)

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE suppliers SET ${fields.join(', ')} WHERE supplier_id = ?`,
    values,
  )

  return result.affectedRows > 0
}

export const deleteSupplier = async (supplierId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM suppliers WHERE supplier_id = ?',
    [supplierId],
  )
  return result.affectedRows > 0
}

export const countProductsBySupplierId = async (supplierId: number): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM products WHERE supplier_id = ?',
    [supplierId],
  )
  return Number(rows[0]?.total ?? 0)
}


