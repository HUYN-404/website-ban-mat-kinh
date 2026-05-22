import { Router } from 'express'

import {
  handleCreateUser,
  handleDeleteUser,
  handleGetUser,
  handleListUsers,
  handleUpdateUser,
  handleUpdateUserStatus,
} from '../controllers/users.controller.js'

// Định nghĩa endpoints REST cho người dùng
const router = Router()

router.get('/', handleListUsers)
router.get('/:userId', handleGetUser)
router.post('/', handleCreateUser)
router.put('/:userId', handleUpdateUser)
router.patch('/:userId/status', handleUpdateUserStatus)
router.delete('/:userId', handleDeleteUser)

export default router


