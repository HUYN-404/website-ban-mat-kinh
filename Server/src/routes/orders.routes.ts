import { Router } from 'express'

import {
  handleCreateOrder,
  handleGetOrder,
  handleListOrders,
  handleUpdateOrderPayment,
  handleUpdateOrderStatus,
} from '../controllers/orders.controller.js'
import orderItemsRouter from './orderItems.routes.js'

// Endpoints REST cho đơn hàng
const router = Router()

router.get('/', handleListOrders)
router.get('/:orderId', handleGetOrder)
router.post('/', handleCreateOrder)
router.patch('/:orderId/status', handleUpdateOrderStatus)
router.patch('/:orderId/payment', handleUpdateOrderPayment)
router.use('/:orderId/items', orderItemsRouter)

export default router

