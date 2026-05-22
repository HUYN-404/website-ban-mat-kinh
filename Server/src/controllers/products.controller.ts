import type { Request, Response } from 'express'

import {
  changeProductStatus,
  createProduct,
  getProduct,
  listProducts,
  removeProduct,
  updateProduct,
} from '../services/products.service.js'
import {
  validateCreateProductPayload,
  validateProductId,
  validateProductsQuery,
  validateUpdateProductPayload,
} from '../validators/product.validator.js'
import type { ProductStatus } from '../types/product.js'

// Controller cho sản phẩm

export const handleListProducts = async (req: Request, res: Response) => {
  const filters = validateProductsQuery(req.query)
  const products = await listProducts(filters)
  res.json({ data: products })
}

export const handleGetProduct = async (req: Request, res: Response) => {
  const productId = validateProductId(req.params.productId)
  const product = await getProduct(productId)
  res.json({ data: product })
}

export const handleCreateProduct = async (req: Request, res: Response) => {
  const payload = validateCreateProductPayload(req.body)
  const product = await createProduct(payload)
  res.status(201).json({ data: product, message: 'Tạo sản phẩm thành công.' })
}

export const handleUpdateProduct = async (req: Request, res: Response) => {
  const productId = validateProductId(req.params.productId)
  const payload = validateUpdateProductPayload(req.body)
  // Lấy userId từ req.user nếu có (từ auth middleware)
  const product = await updateProduct(productId, payload)
  res.json({ data: product, message: 'Cập nhật sản phẩm thành công.' })
}

export const handleChangeProductStatus = async (req: Request, res: Response) => {
  const productId = validateProductId(req.params.productId)
  const status = req.body?.status as ProductStatus | undefined
  if (status !== 'available' && status !== 'unavailable') {
    throw new Error('status không hợp lệ.')
  }
  const product = await changeProductStatus(productId, status)
  res.json({ data: product, message: 'Cập nhật trạng thái sản phẩm thành công.' })
}

export const handleDeleteProduct = async (req: Request, res: Response) => {
  const productId = validateProductId(req.params.productId)
  await removeProduct(productId)
  res.json({ message: 'Xóa sản phẩm thành công.' })
}

