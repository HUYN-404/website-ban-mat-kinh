import { Router } from 'express'

import {
  handleAddCartItem,
  handleListCartItems,
  handleRemoveCartItem,
  handleUpdateCartItem,
} from '../controllers/cartItems.controller.js'

// Routes cho item trong giỏ hàng (nested dưới /carts/:cartId/items)
const router = Router({ mergeParams: true })

router.get('/', handleListCartItems)
router.post('/', handleAddCartItem)
router.put('/:cartItemId', handleUpdateCartItem)
router.delete('/:cartItemId', handleRemoveCartItem)

export default router


