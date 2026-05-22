import type { Request, Response } from 'express'

import {
  changeUserStatus,
  createUser,
  deactivateUser,
  getUser,
  listUsers,
  updateUserProfile,
} from '../services/users.service.js'
import {
  validateCreateUserPayload,
  validateUpdateUserPayload,
  validateUpdateUserStatusPayload,
  validateUserId,
  validateUsersQuery,
} from '../validators/user.validator.js'

// Controller tiếp nhận request HTTP cho module users

export const handleListUsers = async (req: Request, res: Response) => {
  const filters = validateUsersQuery(req.query)
  const users = await listUsers(filters)
  res.json({ data: users })
}

export const handleGetUser = async (req: Request, res: Response) => {
  const userId = validateUserId(req.params.userId)
  const user = await getUser(userId)
  res.json({ data: user })
}

export const handleCreateUser = async (req: Request, res: Response) => {
  const payload = validateCreateUserPayload(req.body)
  const user = await createUser(payload)
  res.status(201).json({ data: user, message: 'Tạo người dùng thành công.' })
}

export const handleUpdateUser = async (req: Request, res: Response) => {
  const userId = validateUserId(req.params.userId)
  const payload = validateUpdateUserPayload(req.body)
  const user = await updateUserProfile(userId, payload)
  res.json({ data: user, message: 'Cập nhật người dùng thành công.' })
}

export const handleUpdateUserStatus = async (req: Request, res: Response) => {
  const userId = validateUserId(req.params.userId)
  const payload = validateUpdateUserStatusPayload(req.body)
  const user = await changeUserStatus(userId, payload)
  res.json({ data: user, message: 'Cập nhật trạng thái người dùng thành công.' })
}

export const handleDeleteUser = async (req: Request, res: Response) => {
  const userId = validateUserId(req.params.userId)
  const user = await deactivateUser(userId)
  res.json({ data: user, message: 'Đã chuyển trạng thái người dùng sang inactive.' })
}


