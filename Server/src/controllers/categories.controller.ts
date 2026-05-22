import type { Request, Response } from 'express'

import {
  createCategory,
  getCategory,
  listCategories,
  removeCategory,
  updateCategory,
} from '../services/categories.service.js'
import {
  validateCategoryId,
  validateCreateCategoryPayload,
  validateUpdateCategoryPayload,
} from '../validators/category.validator.js'

// Controller cho danh mục sản phẩm

export const handleListCategories = async (_req: Request, res: Response) => {
  const categories = await listCategories()
  res.json({ data: categories })
}

export const handleGetCategory = async (req: Request, res: Response) => {
  const categoryId = validateCategoryId(req.params.categoryId)
  const category = await getCategory(categoryId)
  res.json({ data: category })
}

export const handleCreateCategory = async (req: Request, res: Response) => {
  const payload = validateCreateCategoryPayload(req.body)
  const category = await createCategory(payload)
  res.status(201).json({ data: category, message: 'Tạo danh mục thành công.' })
}

export const handleUpdateCategory = async (req: Request, res: Response) => {
  const categoryId = validateCategoryId(req.params.categoryId)
  const payload = validateUpdateCategoryPayload(req.body)
  const category = await updateCategory(categoryId, payload)
  res.json({ data: category, message: 'Cập nhật danh mục thành công.' })
}

export const handleDeleteCategory = async (req: Request, res: Response) => {
  const categoryId = validateCategoryId(req.params.categoryId)
  await removeCategory(categoryId)
  res.json({ message: 'Xóa danh mục thành công.' })
}


