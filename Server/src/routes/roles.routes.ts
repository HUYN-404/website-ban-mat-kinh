import { Router } from 'express'

import {
  handleCreateRole,
  handleDeleteRole,
  handleGetRole,
  handleListRoles,
  handleUpdateRole,
} from '../controllers/roles.controller.js'

// Định nghĩa endpoints REST cho vai trò
const router = Router()

router.get('/', handleListRoles)
router.get('/:roleId', handleGetRole)
router.post('/', handleCreateRole)
router.put('/:roleId', handleUpdateRole)
router.delete('/:roleId', handleDeleteRole)

export default router

