import { Router } from 'express'

import {
  handleAddOrderItem,
  handleDeleteOrderItem,
  handleListOrderItems,
  handleUpdateOrderItem,
} from '../controllers/orderItems.controller.js'

// Endpoints sản phẩm trong đơn hàng
const router = Router({ mergeParams: true })

router.get('/', handleListOrderItems)
router.post('/', handleAddOrderItem)
router.put('/:orderItemId', handleUpdateOrderItem)
router.delete('/:orderItemId', handleDeleteOrderItem)

export default router


