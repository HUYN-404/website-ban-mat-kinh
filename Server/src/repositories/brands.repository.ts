import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import HttpError from '../utils/httpError.js'
import type { Brand, CreateBrandPayload, UpdateBrandPayload } from '../types/brand.js'

// Thao tác với bảng brands

type BrandRow = RowDataPacket & {
  brand_id: number
  name: string
  description: string | null
  country: string | null
}

const mapBrand = (row: BrandRow): Brand => ({
  id: row.brand_id,
  name: row.name,
  description: row.description,
  country: row.country,
  createdAt: new Date().toISOString(), // Brands không có created_at trong DB
  updatedAt: new Date().toISOString(), // Brands không có updated_at trong DB
})

export const findAllBrands = async (): Promise<Brand[]> => {
  const [rows] = await pool.query<BrandRow[]>(
    `
    SELECT brand_id, name, description, country
    FROM brands
    ORDER BY brand_id ASC
  `,
  )
  return rows.map(mapBrand)
}

export const findBrandById = async (brandId: number): Promise<Brand | null> => {
  const [rows] = await pool.query<BrandRow[]>(
    `
    SELECT brand_id, name, description, country
    FROM brands
    WHERE brand_id = ?
    LIMIT 1
  `,
    [brandId],
  )

  if (!rows.length) {
    return null
  }

  return mapBrand(rows[0])
}

export const findBrandByName = async (name: string): Promise<Brand | null> => {
  const [rows] = await pool.query<BrandRow[]>(
    `
    SELECT brand_id, name, description, country
    FROM brands
    WHERE name = ?
    LIMIT 1
  `,
    [name],
  )

  if (!rows.length) {
    return null
  }

  return mapBrand(rows[0])
}

export const createBrand = async (payload: CreateBrandPayload): Promise<number> => {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `
      INSERT INTO brands (name, description, country)
      VALUES (?, ?, ?)
    `,
      [payload.name, payload.description ?? null, payload.country ?? null],
    )
    return Number(result.insertId)
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Tên thương hiệu đã tồn tại.')
    }
    throw error
  }
}

export const updateBrand = async (
  brandId: number,
  payload: UpdateBrandPayload,
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
  if (payload.description !== undefined) {
    fields.push('description = ?')
    values.push(payload.description)
  }
  if (payload.country !== undefined) {
    fields.push('country = ?')
    values.push(payload.country)
  }

  if (!fields.length) {
    return false
  }

  values.push(brandId)

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE brands SET ${fields.join(', ')} WHERE brand_id = ?`,
      values,
    )
    return result.affectedRows > 0
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Tên thương hiệu đã tồn tại.')
    }
    throw error
  }
}

export const deleteBrand = async (brandId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM brands WHERE brand_id = ?',
    [brandId],
  )
  return result.affectedRows > 0
}

export const countProductsByBrandId = async (brandId: number): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM products WHERE brand_id = ?',
    [brandId],
  )
  return Number(rows[0]?.total ?? 0)
}


