import { Router } from 'express'

import {
  handleAdminLogin,
  handleLogin,
  handleLogout,
  handleGetMe,
  handleRegister,
} from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

// Định nghĩa endpoints REST cho xác thực
const router = Router()

router.post('/login', handleLogin)
router.post('/admin/login', handleAdminLogin)
router.post('/register', handleRegister)
router.post('/logout', handleLogout)
router.get('/me', authenticate, handleGetMe)

export default router

