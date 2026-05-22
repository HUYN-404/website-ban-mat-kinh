import HttpError from '../utils/httpError.js'
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../types/category.js'
import {
  countChildCategories,
  countProductsByCategoryId,
  createCategory as createCategoryRepository,
  deleteCategory,
  findAllCategories,
  findCategoryById,
  getCategoryAncestors,
  updateCategory as updateCategoryRepository,
} from '../repositories/categories.repository.js'

// Nghiệp vụ xử lý danh mục (kiểm tra parent, vòng lặp, ràng buộc sản phẩm)

const ensureCategoryExist = async (categoryId: number): Promise<Category> => {
  const category = await findCategoryById(categoryId)
  if (!category) {
    throw new HttpError(404, 'Danh mục không tồn tại.')
  }
  return category
}

const ensureParentValid = async (
  currentCategoryId: number | null,
  parentId: number | null | undefined,
) => {
  if (parentId === null || parentId === undefined) {
    return
  }

  const parent = await findCategoryById(parentId)
  if (!parent) {
    throw new HttpError(400, 'parentId không tồn tại.')
  }

  if (currentCategoryId !== null) {
    if (parentId === currentCategoryId) {
      throw new HttpError(400, 'parentId không thể trùng với category hiện tại.')
    }

    const parentAncestors = await getCategoryAncestors(parentId)
    if (parentAncestors.includes(currentCategoryId)) {
      throw new HttpError(400, 'Không thể đặt parentId vì sẽ tạo vòng lặp.')
    }
  }
}

export const listCategories = async (): Promise<Category[]> => {
  return findAllCategories()
}

export const getCategory = async (categoryId: number): Promise<Category> => {
  return ensureCategoryExist(categoryId)
}

export const createCategory = async (payload: CreateCategoryPayload): Promise<Category> => {
  await ensureParentValid(null, payload.parentId ?? null)

  const newCategoryId = await createCategoryRepository(payload)
  const category = await findCategoryById(newCategoryId)

  if (!category) {
    throw new HttpError(500, 'Không thể lấy thông tin danh mục vừa tạo.')
  }

  return category
}

export const updateCategory = async (
  categoryId: number,
  payload: UpdateCategoryPayload,
): Promise<Category> => {
  await ensureCategoryExist(categoryId)
  await ensureParentValid(categoryId, payload.parentId)

  const updated = await updateCategoryRepository(categoryId, payload)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật danh mục.')
  }

  return ensureCategoryExist(categoryId)
}

export const removeCategory = async (categoryId: number): Promise<void> => {
  await ensureCategoryExist(categoryId)

  const childCount = await countChildCategories(categoryId)
  if (childCount > 0) {
    throw new HttpError(409, 'Không thể xóa vì danh mục còn danh mục con.')
  }

  const productCount = await countProductsByCategoryId(categoryId)
  if (productCount > 0) {
    throw new HttpError(409, 'Không thể xóa vì danh mục đang được sản phẩm sử dụng.')
  }

  const deleted = await deleteCategory(categoryId)
  if (!deleted) {
    throw new HttpError(500, 'Không thể xóa danh mục.')
  }
}


