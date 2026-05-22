import { Router } from 'express'

import {
  handleGetInventory,
  handleListInventory,
  handleUpdateInventory,
} from '../controllers/inventory.controller.js'

// Endpoints quản lý tồn kho (admin)
const router = Router()

router.get('/', handleListInventory)
router.get('/:productId', handleGetInventory)
router.put('/:productId', handleUpdateInventory)

export default router


