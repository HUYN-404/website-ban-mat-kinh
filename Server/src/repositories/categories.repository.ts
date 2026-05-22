import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../types/category.js'
import HttpError from '../utils/httpError.js'

// Làm việc với bảng categories và quan hệ liên quan

type CategoryRow = RowDataPacket & {
  category_id: number
  name: string
  description: string | null
  parent_id: number | null
  parent_name: string | null
}

const mapCategory = (row: CategoryRow): Category => ({
  id: row.category_id,
  name: row.name,
  description: row.description,
  parentId: row.parent_id,
  parentName: row.parent_name,
  createdAt: new Date().toISOString(), // Categories không có created_at trong DB
  updatedAt: new Date().toISOString(), // Categories không có updated_at trong DB
})

export const findAllCategories = async (): Promise<Category[]> => {
  const [rows] = await pool.query<CategoryRow[]>(
    `
    SELECT
      c.category_id,
      c.name,
      c.description,
      c.parent_id,
      parent.name AS parent_name
    FROM categories c
    LEFT JOIN categories parent ON c.parent_id = parent.category_id
    ORDER BY c.category_id ASC
  `,
  )
  return rows.map(mapCategory)
}

export const findCategoryById = async (categoryId: number): Promise<Category | null> => {
  const [rows] = await pool.query<CategoryRow[]>(
    `
    SELECT
      c.category_id,
      c.name,
      c.description,
      c.parent_id,
      parent.name AS parent_name
    FROM categories c
    LEFT JOIN categories parent ON c.parent_id = parent.category_id
    WHERE c.category_id = ?
    LIMIT 1
  `,
    [categoryId],
  )

  if (!rows.length) {
    return null
  }

  return mapCategory(rows[0])
}

export const getCategoryParentId = async (categoryId: number): Promise<number | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT parent_id FROM categories WHERE category_id = ? LIMIT 1',
    [categoryId],
  )
  const parentId = rows[0]?.parent_id
  return parentId === undefined ? null : (parentId as number | null)
}

export const getCategoryAncestors = async (categoryId: number): Promise<number[]> => {
  const ancestors: number[] = []
  let currentId: number | null = await getCategoryParentId(categoryId)

  while (currentId) {
    if (ancestors.includes(currentId)) {
      break
    }
    ancestors.push(currentId)
    const nextParent = await getCategoryParentId(currentId)
    currentId = nextParent ?? null
  }

  return ancestors
}

export const createCategory = async (payload: CreateCategoryPayload): Promise<number> => {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `
      INSERT INTO categories (name, description, parent_id)
      VALUES (?, ?, ?)
    `,
      [payload.name, payload.description ?? null, payload.parentId ?? null],
    )
    return Number(result.insertId)
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Tên danh mục đã tồn tại.')
    }
    throw error
  }
}

export const updateCategory = async (
  categoryId: number,
  payload: UpdateCategoryPayload,
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
  if (payload.parentId !== undefined) {
    fields.push('parent_id = ?')
    values.push(payload.parentId)
  }

  if (!fields.length) {
    return false
  }

  values.push(categoryId)

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE categories SET ${fields.join(', ')} WHERE category_id = ?`,
      values,
    )
    return result.affectedRows > 0
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Tên danh mục đã tồn tại.')
    }
    throw error
  }
}

export const deleteCategory = async (categoryId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM categories WHERE category_id = ?',
    [categoryId],
  )
  return result.affectedRows > 0
}

export const countChildCategories = async (categoryId: number): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM categories WHERE parent_id = ?',
    [categoryId],
  )
  return Number(rows[0]?.total ?? 0)
}

export const countProductsByCategoryId = async (categoryId: number): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM products WHERE category_id = ?',
    [categoryId],
  )
  return Number(rows[0]?.total ?? 0)
}


