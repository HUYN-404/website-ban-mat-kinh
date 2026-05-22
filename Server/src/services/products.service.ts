import HttpError from '../utils/httpError.js'
import type { CreateProductPayload, Product, ProductStatus, UpdateProductPayload } from '../types/product.js'
import {
  createProduct as createProductRepository,
  deleteProduct as deleteProductRepository,
  findAllProducts,
  findProductById,
  updateProduct as updateProductRepository,
} from '../repositories/products.repository.js'
import { findCategoryById } from '../repositories/categories.repository.js'
import { findBrandById } from '../repositories/brands.repository.js'
import { findSupplierById } from '../repositories/suppliers.repository.js'

// Nghiệp vụ sản phẩm

const ensureProductExists = async (productId: number): Promise<Product> => {
  const product = await findProductById(productId)
  if (!product) {
    throw new HttpError(404, 'Sản phẩm không tồn tại.')
  }
  return product
}

const ensureForeignKeysExist = async (payload: {
  categoryId?: number
  brandId?: number
  supplierId?: number
}) => {
  if (payload.categoryId !== undefined) {
    const category = await findCategoryById(payload.categoryId)
    if (!category) {
      throw new HttpError(400, 'categoryId không tồn tại.')
    }
  }
  if (payload.brandId !== undefined) {
    const brand = await findBrandById(payload.brandId)
    if (!brand) {
      throw new HttpError(400, 'brandId không tồn tại.')
    }
  }
  if (payload.supplierId !== undefined) {
    const supplier = await findSupplierById(payload.supplierId)
    if (!supplier) {
      throw new HttpError(400, 'supplierId không tồn tại.')
    }
  }
}

export const listProducts = async (options: {
  status?: ProductStatus
  categoryId?: number
  brandId?: number
  supplierId?: number
  search?: string
}): Promise<Product[]> => {
  return findAllProducts(options)
}

export const getProduct = async (productId: number): Promise<Product> => {
  return ensureProductExists(productId)
}

export const createProduct = async (payload: CreateProductPayload): Promise<Product> => {
  await ensureForeignKeysExist({
    categoryId: payload.categoryId,
    brandId: payload.brandId,
    supplierId: payload.supplierId,
  })

  const newProductId = await createProductRepository(payload)
  const product = await findProductById(newProductId)
  if (!product) {
    throw new HttpError(500, 'Không thể lấy thông tin sản phẩm vừa tạo.')
  }
  return product
}

export const updateProduct = async (
  productId: number,
  payload: UpdateProductPayload,
): Promise<Product> => {
  await ensureProductExists(productId)
  await ensureForeignKeysExist({
    categoryId: payload.categoryId,
    brandId: payload.brandId,
    supplierId: payload.supplierId,
  })

  const updated = await updateProductRepository(productId, payload)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật sản phẩm.')
  }

  return ensureProductExists(productId)
}

export const changeProductStatus = async (
  productId: number,
  status: ProductStatus,
): Promise<Product> => {
  await ensureProductExists(productId)

  const updated = await updateProductRepository(productId, { status })
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật trạng thái sản phẩm.')
  }

  // TODO: cân nhắc xử lý giỏ hàng/đơn hàng khi status chuyển unavailable

  return ensureProductExists(productId)
}

export const removeProduct = async (productId: number): Promise<void> => {
  await ensureProductExists(productId)

  const deleted = await deleteProductRepository(productId)
  if (!deleted) {
    throw new HttpError(500, 'Không thể xóa sản phẩm.')
  }
}


