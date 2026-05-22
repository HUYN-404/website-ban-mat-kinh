import HttpError from '../utils/httpError.js'
import type {
  CreateProductPayload,
  ProductStatus,
  UpdateProductPayload,
} from '../types/product.js'

const ensureNonEmptyString = (value: unknown, field: string): string => {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} phải là chuỗi.`)
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new HttpError(400, `${field} không được để trống.`)
  }
  return trimmed
}

const ensureOptionalString = (value: unknown, field: string): string | null | undefined => {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} phải là chuỗi.`)
  }
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

const ensurePositiveNumber = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new HttpError(400, `${field} phải là số.`)
  }
  if (value < 0) {
    throw new HttpError(400, `${field} không được âm.`)
  }
  return value
}

const ensurePositiveInteger = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new HttpError(400, `${field} phải là số nguyên.`)
  }
  if (value < 0) {
    throw new HttpError(400, `${field} không được âm.`)
  }
  return value
}

const ensureId = (value: unknown, field: string): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${field} không hợp lệ.`)
  }
  return id
}

const ensureStatus = (value: unknown, field: string): ProductStatus => {
  if (value !== 'available' && value !== 'unavailable') {
    throw new HttpError(400, `${field} chỉ chấp nhận available hoặc unavailable.`)
  }
  return value
}

export const validateProductId = (value: unknown): number => ensureId(value, 'productId')

export const validateProductsQuery = (query: Record<string, unknown>) => {
  const filters: {
    status?: ProductStatus
    categoryId?: number
    brandId?: number
    supplierId?: number
    search?: string
  } = {}

  if (query.status !== undefined) {
    filters.status = ensureStatus(query.status, 'status')
  }

  if (query.categoryId !== undefined) {
    filters.categoryId = ensureId(query.categoryId, 'categoryId')
  }

  if (query.brandId !== undefined) {
    filters.brandId = ensureId(query.brandId, 'brandId')
  }

  if (query.supplierId !== undefined) {
    filters.supplierId = ensureId(query.supplierId, 'supplierId')
  }

  if (query.search !== undefined) {
    filters.search = ensureNonEmptyString(query.search, 'search')
  }

  return filters
}

export const validateCreateProductPayload = (payload: unknown): CreateProductPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>

  const name = ensureNonEmptyString(data.name, 'name')
  const description = ensureOptionalString(data.description, 'description') ?? null
  const price = ensurePositiveNumber(data.price, 'price')
  const stockQuantity = data.stockQuantity === undefined ? 0 : ensurePositiveInteger(data.stockQuantity, 'stockQuantity')
  const categoryId = ensureId(data.categoryId, 'categoryId')
  const brandId = ensureId(data.brandId, 'brandId')
  const supplierId = ensureId(data.supplierId, 'supplierId')
  const status =
    data.status === undefined ? 'available' : ensureStatus(data.status, 'status')

  return {
    name,
    description,
    price,
    stockQuantity,
    status,
    categoryId,
    brandId,
    supplierId,
  }
}

export const validateUpdateProductPayload = (payload: unknown): UpdateProductPayload => {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(400, 'Dữ liệu không hợp lệ.')
  }

  const data = payload as Record<string, unknown>
  const result: UpdateProductPayload = {}

  if (data.name !== undefined) {
    result.name = ensureNonEmptyString(data.name, 'name')
  }

  if (data.description !== undefined) {
    result.description = ensureOptionalString(data.description, 'description') ?? null
  }

  if (data.price !== undefined) {
    result.price = ensurePositiveNumber(data.price, 'price')
  }

  if (data.stockQuantity !== undefined) {
    result.stockQuantity = ensurePositiveInteger(data.stockQuantity, 'stockQuantity')
  }

  if (data.status !== undefined) {
    result.status = ensureStatus(data.status, 'status')
  }

  if (data.categoryId !== undefined) {
    result.categoryId = ensureId(data.categoryId, 'categoryId')
  }

  if (data.brandId !== undefined) {
    result.brandId = ensureId(data.brandId, 'brandId')
  }

  if (data.supplierId !== undefined) {
    result.supplierId = ensureId(data.supplierId, 'supplierId')
  }

  if (!Object.keys(result).length) {
    throw new HttpError(400, 'Không có dữ liệu nào để cập nhật.')
  }

  return result
}


