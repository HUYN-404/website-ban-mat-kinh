import { Router } from 'express'

import {
  handleCreateCart,
  handleGetActiveCartByUser,
  handleGetCartById,
  handleListCartsByUser,
  handleUpdateCartStatus,
} from '../controllers/carts.controller.js'
import cartItemsRouter from './cartItems.routes.js'

// Endpoints giỏ hàng
const router = Router()

router.get('/:cartId', handleGetCartById)
router.patch('/:cartId/status', handleUpdateCartStatus)
router.post('/', handleCreateCart)

// Routes theo user
router.get('/user/:userId/active', handleGetActiveCartByUser)
router.get('/user/:userId/history', handleListCartsByUser)
router.use('/:cartId/items', cartItemsRouter)

export default router

