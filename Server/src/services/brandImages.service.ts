import HttpError from '../utils/httpError.js'
import type { BrandImage, CreateBrandImagePayload } from '../types/brandImage.js'
import { findBrandById } from '../repositories/brands.repository.js'
import {
  createBrandImage,
  deleteBrandImage,
  findBrandImageById,
  findImagesByBrandId,
} from '../repositories/brandImages.repository.js'

// Nghiệp vụ ảnh thương hiệu

export const listBrandImages = async (brandId: number): Promise<BrandImage[]> => {
  return findImagesByBrandId(brandId)
}

export const addBrandImage = async (payload: CreateBrandImagePayload): Promise<BrandImage> => {
  const brand = await findBrandById(payload.brandId)
  if (!brand) {
    throw new HttpError(400, 'brandId không tồn tại.')
  }

  return createBrandImage(payload)
}

export const removeBrandImage = async (imageId: number): Promise<void> => {
  const image = await findBrandImageById(imageId)
  if (!image) {
    throw new HttpError(404, 'Ảnh thương hiệu không tồn tại.')
  }

  const deleted = await deleteBrandImage(imageId)
  if (!deleted) {
    throw new HttpError(500, 'Không thể xóa ảnh thương hiệu.')
  }
}


