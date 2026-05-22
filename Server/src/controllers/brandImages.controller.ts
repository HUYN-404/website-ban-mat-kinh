import type { Request, Response } from 'express'

import {
  addBrandImage,
  listBrandImages,
  removeBrandImage,
} from '../services/brandImages.service.js'
import {
  validateBrandIdParam,
  validateBrandImageId,
  validateCreateBrandImagePayload,
} from '../validators/brandImage.validator.js'

// Controller cho ảnh thương hiệu

export const handleListBrandImages = async (req: Request, res: Response) => {
  const brandId = validateBrandIdParam(req.params.brandId)
  const images = await listBrandImages(brandId)
  res.json({ data: images })
}

export const handleCreateBrandImage = async (req: Request, res: Response) => {
  const payload = validateCreateBrandImagePayload({
    ...req.body,
    brandId: req.params.brandId ?? req.body.brandId,
  })
  const image = await addBrandImage(payload)
  res.status(201).json({ data: image, message: 'Thêm ảnh thương hiệu thành công.' })
}

export const handleDeleteBrandImage = async (req: Request, res: Response) => {
  const imageId = validateBrandImageId(req.params.imageId)
  await removeBrandImage(imageId)
  res.json({ message: 'Xóa ảnh thương hiệu thành công.' })
}


