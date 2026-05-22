import { Router } from 'express'

import {
  handleChangeProductStatus,
  handleCreateProduct,
  handleDeleteProduct,
  handleGetProduct,
  handleListProducts,
  handleUpdateProduct,
} from '../controllers/products.controller.js'
import productImagesRouter from './productImages.routes.js'

// Endpoints REST cho sản phẩm
const router = Router()

router.get('/', handleListProducts)
router.get('/:productId', handleGetProduct)
router.post('/', handleCreateProduct)
router.put('/:productId', handleUpdateProduct)
router.patch('/:productId/status', handleChangeProductStatus)
router.delete('/:productId', handleDeleteProduct)
router.use('/:productId/images', productImagesRouter)

export default router

