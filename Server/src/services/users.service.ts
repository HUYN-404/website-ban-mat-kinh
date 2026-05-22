import bcrypt from 'bcryptjs'

import HttpError from '../utils/httpError.js'
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  User,
} from '../types/user.js'
import {
  createUser as createUserRepository,
  findAllUsers,
  findUserById,
  findUserByUsername,
  updateUser,
  updateUserStatus,
} from '../repositories/users.repository.js'
import { findRoleById } from '../repositories/roles.repository.js'

// Xử lý nghiệp vụ người dùng (hash password, validate quan hệ)

const HASH_ROUNDS = 10

export const listUsers = async (options: {
  status?: 'active' | 'inactive'
  roleId?: number
  search?: string
}): Promise<User[]> => {
  return findAllUsers(options)
}

export const getUser = async (userId: number): Promise<User> => {
  const user = await findUserById(userId)
  if (!user) {
    throw new HttpError(404, 'Người dùng không tồn tại.')
  }
  return user
}

const ensureRoleExist = async (roleId: number | null | undefined) => {
  if (roleId === null || roleId === undefined) {
    return
  }
  const role = await findRoleById(roleId)
  if (!role) {
    throw new HttpError(400, 'roleId không tồn tại.')
  }
}

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, HASH_ROUNDS)
}

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  await ensureRoleExist(payload.roleId)

  const existingUser = await findUserByUsername(payload.username)
  if (existingUser) {
    throw new HttpError(409, 'username đã tồn tại.')
  }

  const hashedPassword = await hashPassword(payload.password)
  const newUserId = await createUserRepository({
    ...payload,
    password: hashedPassword,
  })

  const user = await findUserById(newUserId)
  if (!user) {
    throw new HttpError(500, 'Không thể lấy thông tin người dùng sau khi tạo.')
  }
  return user
}

export const updateUserProfile = async (
  userId: number,
  payload: UpdateUserPayload,
): Promise<User> => {
  await getUser(userId)

  if (payload.username) {
    const existing = await findUserByUsername(payload.username)
    if (existing && existing.id !== userId) {
      throw new HttpError(409, 'username đã tồn tại.')
    }
  }

  if (payload.roleId !== undefined) {
    await ensureRoleExist(payload.roleId)
  }

  let hashedPassword: string | undefined
  if (payload.password) {
    hashedPassword = await hashPassword(payload.password)
  }

  const updated = await updateUser(userId, {
    ...payload,
    password: hashedPassword ?? payload.password,
  })

  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật người dùng.')
  }

  return getUser(userId)
}

export const changeUserStatus = async (
  userId: number,
  payload: UpdateUserStatusPayload,
): Promise<User> => {
  await getUser(userId)

  const updated = await updateUserStatus(userId, payload)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật trạng thái người dùng.')
  }

  return getUser(userId)
}

export const deactivateUser = async (userId: number): Promise<User> => {
  return changeUserStatus(userId, { status: 'inactive' })
}


