import type { Request, Response } from 'express'

import { adminLogin, login, register } from '../services/auth.service.js'
import { getUser } from '../services/users.service.js'
import { validateLoginPayload, validateRegisterPayload } from '../validators/auth.validator.js'

// Controller tiếp nhận request HTTP cho module auth

export const handleLogin = async (req: Request, res: Response) => {
  const payload = validateLoginPayload(req.body)
  const result = await login(payload)
  res.json({ data: result, message: 'Đăng nhập thành công.' })
}

export const handleAdminLogin = async (req: Request, res: Response) => {
  const payload = validateLoginPayload(req.body)
  const result = await adminLogin(payload)
  res.json({ data: result, message: 'Đăng nhập dashboard thành công.' })
}

export const handleRegister = async (req: Request, res: Response) => {
  const payload = validateRegisterPayload(req.body)
  const result = await register(payload)
  res.status(201).json({ data: result, message: 'Đăng ký thành công.' })
}

export const handleLogout = async (_req: Request, res: Response) => {
  // Logout chỉ cần xóa token ở client, không cần xử lý gì ở server
  res.json({ message: 'Đăng xuất thành công.' })
}

export const handleGetMe = async (req: Request, res: Response) => {
  // req.user được set bởi auth middleware
  if (!req.user) {
    return res.status(401).json({ message: 'Không xác thực được người dùng.' })
  }

  const user = await getUser(req.user.userId)
  // User object từ getUser đã không có password (đã được mapUser loại bỏ)
  res.json({ data: user })
}

