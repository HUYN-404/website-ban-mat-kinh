import type { Request, Response } from 'express'

import {
  addProductImage,
  listProductImages,
  removeProductImage,
} from '../services/productImages.service.js'
import {
  validateCreateProductImagePayload,
  validateProductIdParam,
  validateProductImageId,
} from '../validators/productImage.validator.js'

// Controller cho ảnh sản phẩm

export const handleListProductImages = async (req: Request, res: Response) => {
  const productId = validateProductIdParam(req.params.productId)
  const images = await listProductImages(productId)
  res.json({ data: images })
}

export const handleCreateProductImage = async (req: Request, res: Response) => {
  const payload = validateCreateProductImagePayload({
    ...req.body,
    productId: req.params.productId ?? req.body.productId,
  })
  const image = await addProductImage(payload)
  res.status(201).json({ data: image, message: 'Thêm ảnh sản phẩm thành công.' })
}

export const handleDeleteProductImage = async (req: Request, res: Response) => {
  const imageId = validateProductImageId(req.params.imageId)
  await removeProductImage(imageId)
  res.json({ message: 'Xóa ảnh sản phẩm thành công.' })
}


