import { Router } from 'express'

import {
  handleCreateBrandImage,
  handleDeleteBrandImage,
  handleListBrandImages,
} from '../controllers/brandImages.controller.js'

// Endpoints cho ảnh thương hiệu (nằm dưới brand cụ thể)
const router = Router({ mergeParams: true })

router.get('/', handleListBrandImages)
router.post('/', handleCreateBrandImage)
router.delete('/:imageId', handleDeleteBrandImage)

export default router


