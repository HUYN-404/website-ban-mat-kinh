import { Router } from 'express'

import {
  handleCreateInventoryTransaction,
  handleCreateBulkInventoryTransactions,
  handleListInventoryTransactions,
  handleGetInventoryTransaction,
} from '../controllers/inventoryTransactions.controller.js'

// Endpoints quản lý giao dịch tồn kho
const router = Router()

router.get('/', handleListInventoryTransactions)
router.get('/:transactionId', handleGetInventoryTransaction)
router.post('/', handleCreateInventoryTransaction)
router.post('/bulk', handleCreateBulkInventoryTransactions)

export default router


