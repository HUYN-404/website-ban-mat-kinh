import { Router } from 'express'

import {
  handleCreateProductImage,
  handleDeleteProductImage,
  handleListProductImages,
} from '../controllers/productImages.controller.js'

// Endpoints cho ảnh sản phẩm (nằm dưới product cụ thể)
const router = Router({ mergeParams: true })

router.get('/', handleListProductImages)
router.post('/', handleCreateProductImage)
router.delete('/:imageId', handleDeleteProductImage)

export default router


