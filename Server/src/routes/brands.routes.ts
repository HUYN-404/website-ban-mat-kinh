import { Router } from 'express'

import {
  handleCreateBrand,
  handleDeleteBrand,
  handleGetBrand,
  handleListBrands,
  handleUpdateBrand,
} from '../controllers/brands.controller.js'
import brandImagesRouter from './brandImages.routes.js'

// Endpoints REST cho thương hiệu
const router = Router()

router.get('/', handleListBrands)
router.get('/:brandId', handleGetBrand)
router.post('/', handleCreateBrand)
router.put('/:brandId', handleUpdateBrand)
router.delete('/:brandId', handleDeleteBrand)
router.use('/:brandId/images', brandImagesRouter)

export default router

