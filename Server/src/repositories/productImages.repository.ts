import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type { CreateProductImagePayload, ProductImage } from '../types/productImage.js'

// Thao tác với bảng products_images

type ProductImageRow = RowDataPacket & {
  image_id: number
  product_id: number
  image_url: string
  created_at?: Date | string | null
}

const mapProductImage = (row: ProductImageRow): ProductImage => {
  if (!row) {
    throw new Error('Row data is null or undefined')
  }
  
  return {
    id: row.image_id,
    productId: row.product_id,
    imageUrl: row.image_url,
    createdAt: row.created_at 
      ? (row.created_at instanceof Date 
          ? row.created_at.toISOString() 
          : new Date(row.created_at).toISOString())
      : new Date().toISOString(),
  }
}

export const findImagesByProductId = async (productId: number): Promise<ProductImage[]> => {
  const [rows] = await pool.query<ProductImageRow[]>(
    `
    SELECT image_id, product_id, image_url
    FROM Products_Images
    WHERE product_id = ?
    ORDER BY image_id DESC
  `,
    [productId],
  )
  return rows.map(mapProductImage)
}

export const createProductImage = async (
  payload: CreateProductImagePayload,
): Promise<ProductImage> => {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `
      INSERT INTO Products_Images (product_id, image_url)
      VALUES (?, ?)
    `,
      [payload.productId, payload.imageUrl],
    )

    if (!result.insertId) {
      throw new Error('Không thể tạo ảnh sản phẩm: insertId không tồn tại')
    }

    const [rows] = await pool.query<ProductImageRow[]>(
      `
      SELECT image_id, product_id, image_url
      FROM Products_Images
      WHERE image_id = ?
      LIMIT 1
    `,
      [result.insertId],
    )

    if (!rows || rows.length === 0) {
      throw new Error(`Không tìm thấy ảnh sản phẩm với image_id = ${result.insertId}`)
    }

    return mapProductImage(rows[0])
  } catch (error) {
    console.error('Error creating product image:', error)
    console.error('Payload:', payload)
    throw error
  }
}

export const deleteProductImage = async (imageId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM Products_Images WHERE image_id = ?',
    [imageId],
  )
  return result.affectedRows > 0
}

export const findProductImageById = async (imageId: number): Promise<ProductImage | null> => {
  const [rows] = await pool.query<ProductImageRow[]>(
    `
    SELECT image_id, product_id, image_url
    FROM Products_Images
    WHERE image_id = ?
    LIMIT 1
  `,
    [imageId],
  )

  if (!rows.length) {
    return null
  }

  return mapProductImage(rows[0])
}


