import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type { BrandImage, CreateBrandImagePayload } from '../types/brandImage.js'

// Thao tác với bảng brands_images

type BrandImageRow = RowDataPacket & {
  image_id: number
  brand_id: number
  image_url: string
  created_at: Date
}

const mapBrandImage = (row: BrandImageRow): BrandImage => ({
  id: row.image_id,
  brandId: row.brand_id,
  imageUrl: row.image_url,
  createdAt: row.created_at.toISOString(),
})

export const findImagesByBrandId = async (brandId: number): Promise<BrandImage[]> => {
  const [rows] = await pool.query<BrandImageRow[]>(
    `
    SELECT image_id, brand_id, image_url, created_at
    FROM brands_images
    WHERE brand_id = ?
    ORDER BY image_id DESC
  `,
    [brandId],
  )
  return rows.map(mapBrandImage)
}

export const createBrandImage = async (
  payload: CreateBrandImagePayload,
): Promise<BrandImage> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO brands_images (brand_id, image_url)
    VALUES (?, ?)
  `,
    [payload.brandId, payload.imageUrl],
  )

  const [rows] = await pool.query<BrandImageRow[]>(
    `
    SELECT image_id, brand_id, image_url, created_at
    FROM brands_images
    WHERE image_id = ?
    LIMIT 1
  `,
    [result.insertId],
  )

  return mapBrandImage(rows[0])
}

export const deleteBrandImage = async (imageId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM brands_images WHERE image_id = ?',
    [imageId],
  )
  return result.affectedRows > 0
}

export const findBrandImageById = async (imageId: number): Promise<BrandImage | null> => {
  const [rows] = await pool.query<BrandImageRow[]>(
    `
    SELECT image_id, brand_id, image_url, created_at
    FROM brands_images
    WHERE image_id = ?
    LIMIT 1
  `,
    [imageId],
  )

  if (!rows.length) {
    return null
  }

  return mapBrandImage(rows[0])
}


