import { Router } from 'express'

import {
  handleCreateSupplier,
  handleDeleteSupplier,
  handleGetSupplier,
  handleListSuppliers,
  handleUpdateSupplier,
} from '../controllers/suppliers.controller.js'

// Endpoints REST cho nhà cung cấp
const router = Router()

router.get('/', handleListSuppliers)
router.get('/:supplierId', handleGetSupplier)
router.post('/', handleCreateSupplier)
router.put('/:supplierId', handleUpdateSupplier)
router.delete('/:supplierId', handleDeleteSupplier)

export default router


