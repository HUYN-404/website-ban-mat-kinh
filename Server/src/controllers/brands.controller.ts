import type { Request, Response } from 'express'

import {
  createBrand,
  getBrand,
  listBrands,
  removeBrand,
  updateBrand,
} from '../services/brands.service.js'
import {
  validateBrandId,
  validateCreateBrandPayload,
  validateUpdateBrandPayload,
} from '../validators/brand.validator.js'

// Controller cho thương hiệu

export const handleListBrands = async (_req: Request, res: Response) => {
  const brands = await listBrands()
  res.json({ data: brands })
}

export const handleGetBrand = async (req: Request, res: Response) => {
  const brandId = validateBrandId(req.params.brandId)
  const brand = await getBrand(brandId)
  res.json({ data: brand })
}

export const handleCreateBrand = async (req: Request, res: Response) => {
  const payload = validateCreateBrandPayload(req.body)
  const brand = await createBrand(payload)
  res.status(201).json({ data: brand, message: 'Tạo thương hiệu thành công.' })
}

export const handleUpdateBrand = async (req: Request, res: Response) => {
  const brandId = validateBrandId(req.params.brandId)
  const payload = validateUpdateBrandPayload(req.body)
  const brand = await updateBrand(brandId, payload)
  res.json({ data: brand, message: 'Cập nhật thương hiệu thành công.' })
}

export const handleDeleteBrand = async (req: Request, res: Response) => {
  const brandId = validateBrandId(req.params.brandId)
  await removeBrand(brandId)
  res.json({ message: 'Xóa thương hiệu thành công.' })
}


