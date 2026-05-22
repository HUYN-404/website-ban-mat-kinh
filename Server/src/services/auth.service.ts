import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import HttpError from '../utils/httpError.js'
import type { LoginPayload, LoginResponse, RegisterPayload, TokenPayload } from '../types/auth.js'
import { findUserByUsernameWithPassword } from '../repositories/users.repository.js'
import { findRoleByName } from '../repositories/roles.repository.js'
import { createUser as createUserService } from './users.service.js'

// Xử lý nghiệp vụ xác thực (đăng nhập, đăng ký, tạo token)

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']

const buildAuthResponse = (params: {
  userId: number
  username: string
  fullName: string | null
  email: string | null
  roleId: number | null
  roleName: string | null
}): LoginResponse => {
  const tokenPayload: TokenPayload = {
    userId: params.userId,
    username: params.username,
    roleId: params.roleId,
  }

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

  return {
    token,
    user: {
      id: params.userId,
      username: params.username,
      fullName: params.fullName,
      email: params.email,
      roleName: params.roleName,
    },
  }
}

// Đăng nhập dành cho khách hàng (store) - không check role, chỉ cần active
export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const user = await findUserByUsernameWithPassword(payload.username)

  if (!user) {
    throw new HttpError(401, 'Tên đăng nhập hoặc mật khẩu không đúng.')
  }

  if (user.status !== 'active') {
    throw new HttpError(403, 'Tài khoản đã bị vô hiệu hóa.')
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password)
  if (!isPasswordValid) {
    throw new HttpError(401, 'Tên đăng nhập hoặc mật khẩu không đúng.')
  }

  return buildAuthResponse({
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    roleId: user.roleId,
    roleName: user.roleName,
  })
}

// Đăng nhập dành cho dashboard (admin/staff)
export const adminLogin = async (payload: LoginPayload): Promise<LoginResponse> => {
  const user = await findUserByUsernameWithPassword(payload.username)

  if (!user) {
    throw new HttpError(401, 'Tên đăng nhập hoặc mật khẩu không đúng.')
  }

  if (user.status !== 'active') {
    throw new HttpError(403, 'Tài khoản đã bị vô hiệu hóa.')
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password)
  if (!isPasswordValid) {
    throw new HttpError(401, 'Tên đăng nhập hoặc mật khẩu không đúng.')
  }

  const allowedRoles = ['admin', 'staff']
  const userRole = user.roleName?.toLowerCase()
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new HttpError(403, 'Bạn không đủ quyền để đăng nhập vào hệ thống quản trị.')
  }

  return buildAuthResponse({
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    roleId: user.roleId,
    roleName: user.roleName,
  })
}

// Đăng ký khách hàng mới (role: customer)
export const register = async (payload: RegisterPayload): Promise<LoginResponse> => {
  const customerRole = await findRoleByName('customer')
  if (!customerRole) {
    throw new HttpError(500, 'Không tìm thấy role "customer" để đăng ký người dùng mới.')
  }

  const newUser = await createUserService({
    username: payload.username,
    password: payload.password,
    email: payload.email,
    fullName: payload.fullName ?? null,
    roleId: customerRole.id,
    status: 'active',
  })

  return buildAuthResponse({
    userId: newUser.id,
    username: newUser.username,
    fullName: newUser.fullName,
    email: newUser.email,
    roleId: newUser.roleId,
    roleName: newUser.roleName,
  })
}

// Verify token và trả về payload
export const verifyToken = (token: string): TokenPayload => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload
    return payload
  } catch (error) {
    throw new HttpError(401, 'Token không hợp lệ hoặc đã hết hạn.')
  }
}
