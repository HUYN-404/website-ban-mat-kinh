import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type {
  CreateProductPayload,
  Product,
  ProductStatus,
  UpdateProductPayload,
} from '../types/product.js'

// Thao tác với bảng products

type ProductRow = RowDataPacket & {
  product_id: number
  name: string
  description: string | null
  price: number
  total_quantity: number | null // Lấy từ inventory table
  status: ProductStatus
  category_id: number
  category_name: string | null
  brand_id: number
  brand_name: string | null
  supplier_id: number
  supplier_name: string | null
  materials: string | null // JSON string từ database
  highlights: string | null // JSON string từ database
  created_at: Date
}

const mapProduct = (row: ProductRow): Product => {
  // Parse JSON từ database thành array
  let materials: string[] | null = null
  let highlights: string[] | null = null
  
  try {
    if (row.materials) {
      materials = JSON.parse(row.materials)
    }
  } catch (e) {
    console.error('Error parsing materials JSON:', e)
  }
  
  try {
    if (row.highlights) {
      highlights = JSON.parse(row.highlights)
    }
  } catch (e) {
    console.error('Error parsing highlights JSON:', e)
  }

  return {
    id: row.product_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    stockQuantity: row.total_quantity ?? 0, // Lấy từ inventory table
    status: row.status,
    categoryId: row.category_id,
    categoryName: row.category_name,
    brandId: row.brand_id,
    brandName: row.brand_name,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    materials,
    highlights,
    createdAt: row.created_at.toISOString(),
    updatedAt: new Date().toISOString(), // Products không có updated_at trong DB
  }
}

interface FindProductsOptions {
  status?: ProductStatus
  categoryId?: number
  brandId?: number
  supplierId?: number
  search?: string
}

export const findAllProducts = async (options: FindProductsOptions): Promise<Product[]> => {
  const filters: string[] = []
  const values: Array<string | number> = []

  if (options.status) {
    filters.push('p.status = ?')
    values.push(options.status)
  }
  if (options.categoryId) {
    filters.push('p.category_id = ?')
    values.push(options.categoryId)
  }
  if (options.brandId) {
    filters.push('p.brand_id = ?')
    values.push(options.brandId)
  }
  if (options.supplierId) {
    filters.push('p.supplier_id = ?')
    values.push(options.supplierId)
  }
  if (options.search) {
    // Kiểm tra nếu search là số (có thể là ID)
    const searchAsNumber = Number(options.search)
    if (!isNaN(searchAsNumber)) {
      // Tìm theo ID hoặc tên/description
      filters.push('(p.product_id = ? OR p.name LIKE ? OR p.description LIKE ?)')
      const keyword = `%${options.search}%`
      values.push(searchAsNumber, keyword, keyword)
    } else {
      // Chỉ tìm theo tên/description
      filters.push('(p.name LIKE ? OR p.description LIKE ?)')
      const keyword = `%${options.search}%`
      values.push(keyword, keyword)
    }
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const [rows] = await pool.query<ProductRow[]>(
    `
    SELECT
      p.product_id,
      p.name,
      p.description,
      p.price,
      p.status,
      p.category_id,
      c.name AS category_name,
      p.brand_id,
      b.name AS brand_name,
      p.supplier_id,
      s.name AS supplier_name,
      p.materials,
      p.highlights,
      p.created_at,
      i.total_quantity
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN brands b ON p.brand_id = b.brand_id
    LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
    LEFT JOIN inventory i ON p.product_id = i.product_id
    ${whereClause}
    ORDER BY p.product_id DESC
  `,
    values,
  )

  return rows.map(mapProduct)
}

export const findProductById = async (productId: number): Promise<Product | null> => {
  const [rows] = await pool.query<ProductRow[]>(
    `
    SELECT
      p.product_id,
      p.name,
      p.description,
      p.price,
      p.status,
      p.category_id,
      c.name AS category_name,
      p.brand_id,
      b.name AS brand_name,
      p.supplier_id,
      s.name AS supplier_name,
      p.materials,
      p.highlights,
      p.created_at,
      i.total_quantity
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN brands b ON p.brand_id = b.brand_id
    LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
    LEFT JOIN inventory i ON p.product_id = i.product_id
    WHERE p.product_id = ?
    LIMIT 1
  `,
    [productId],
  )

  if (!rows.length) {
    return null
  }

  return mapProduct(rows[0])
}

export const createProduct = async (payload: CreateProductPayload): Promise<number> => {
  // Convert arrays to JSON strings for database
  const materialsJson = payload.materials ? JSON.stringify(payload.materials) : null
  const highlightsJson = payload.highlights ? JSON.stringify(payload.highlights) : null

  const [result] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO products
      (name, description, price, status, category_id, brand_id, supplier_id, materials, highlights)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      payload.name,
      payload.description ?? null,
      payload.price,
      payload.status ?? 'available',
      payload.categoryId,
      payload.brandId,
      payload.supplierId,
      materialsJson,
      highlightsJson,
    ],
  )

  return Number(result.insertId)
}

export const updateProduct = async (
  productId: number,
  payload: UpdateProductPayload,
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
  if (payload.price !== undefined) {
    fields.push('price = ?')
    values.push(payload.price)
  }
  if (payload.status !== undefined) {
    fields.push('status = ?')
    values.push(payload.status)
  }
  if (payload.categoryId !== undefined) {
    fields.push('category_id = ?')
    values.push(payload.categoryId)
  }
  if (payload.brandId !== undefined) {
    fields.push('brand_id = ?')
    values.push(payload.brandId)
  }
  if (payload.supplierId !== undefined) {
    fields.push('supplier_id = ?')
    values.push(payload.supplierId)
  }
  if (payload.materials !== undefined) {
    fields.push('materials = ?')
    values.push(payload.materials ? JSON.stringify(payload.materials) : null)
  }
  if (payload.highlights !== undefined) {
    fields.push('highlights = ?')
    values.push(payload.highlights ? JSON.stringify(payload.highlights) : null)
  }

  if (!fields.length) {
    return false
  }

  values.push(productId)

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE products SET ${fields.join(', ')} WHERE product_id = ?`,
    values,
  )

  return result.affectedRows > 0
}

export const deleteProduct = async (productId: number): Promise<boolean> => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()

    // Xóa inventory_transactions trước (tham chiếu đến product_id)
    await connection.execute<ResultSetHeader>(
      'DELETE FROM inventory_transactions WHERE product_id = ?',
      [productId],
    )

    // Xóa inventory (tham chiếu đến product_id)
    await connection.execute<ResultSetHeader>(
      'DELETE FROM inventory WHERE product_id = ?',
      [productId],
    )

    // Xóa cart_items (tham chiếu đến product_id)
    await connection.execute<ResultSetHeader>(
      'DELETE FROM cart_items WHERE product_id = ?',
      [productId],
    )

    // Xóa orders_items (tham chiếu đến product_id)
    await connection.execute<ResultSetHeader>(
      'DELETE FROM orders_items WHERE product_id = ?',
      [productId],
    )

    // Cuối cùng mới xóa sản phẩm
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM products WHERE product_id = ?',
      [productId],
    )

    await connection.commit()
    return result.affectedRows > 0
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}


