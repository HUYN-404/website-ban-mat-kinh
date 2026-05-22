import HttpError from '../utils/httpError.js'
import type { CreateProductImagePayload, ProductImage } from '../types/productImage.js'
import { findProductById } from '../repositories/products.repository.js'
import {
  createProductImage,
  deleteProductImage,
  findImagesByProductId,
  findProductImageById,
} from '../repositories/productImages.repository.js'

// Nghiệp vụ ảnh sản phẩm

export const listProductImages = async (productId: number): Promise<ProductImage[]> => {
  return findImagesByProductId(productId)
}

export const addProductImage = async (
  payload: CreateProductImagePayload,
): Promise<ProductImage> => {
  const product = await findProductById(payload.productId)
  if (!product) {
    throw new HttpError(400, 'productId không tồn tại.')
  }

  return createProductImage(payload)
}

export const removeProductImage = async (imageId: number): Promise<void> => {
  const image = await findProductImageById(imageId)
  if (!image) {
    throw new HttpError(404, 'Ảnh sản phẩm không tồn tại.')
  }

  const deleted = await deleteProductImage(imageId)
  if (!deleted) {
    throw new HttpError(500, 'Không thể xóa ảnh sản phẩm.')
  }
}


