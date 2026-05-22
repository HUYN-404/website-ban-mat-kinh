import { Router } from 'express'

import {
  handleCreateCategory,
  handleDeleteCategory,
  handleGetCategory,
  handleListCategories,
  handleUpdateCategory,
} from '../controllers/categories.controller.js'

// Endpoints REST cho danh mục
const router = Router()

router.get('/', handleListCategories)
router.get('/:categoryId', handleGetCategory)
router.post('/', handleCreateCategory)
router.put('/:categoryId', handleUpdateCategory)
router.delete('/:categoryId', handleDeleteCategory)

export default router


