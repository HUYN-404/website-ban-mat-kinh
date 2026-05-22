import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import HttpError from '../utils/httpError.js'
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  User,
  UserStatus,
  UserWithPassword,
} from '../types/user.js'

// Thao tác trực tiếp với bảng users

type UserRow = RowDataPacket & {
  user_id: number
  username: string
  password: string
  full_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  status: UserStatus
  role_id: number | null
  role_name: string | null
  created_at: Date
  updated_at: Date
}

const mapUser = (row: UserRow): User => ({
  id: row.user_id,
  username: row.username,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  address: row.address,
  status: row.status,
  roleId: row.role_id,
  roleName: row.role_name,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
})

// Map user với password (chỉ dùng cho auth)
const mapUserWithPassword = (row: UserRow): UserWithPassword => ({
  ...mapUser(row),
  password: row.password,
})

interface FindUsersOptions {
  status?: UserStatus
  roleId?: number
  search?: string
}

export const findAllUsers = async (options: FindUsersOptions): Promise<User[]> => {
  const filters: string[] = []
  const values: Array<string | number> = []

  if (options.status) {
    filters.push('u.status = ?')
    values.push(options.status)
  }

  if (options.roleId) {
    filters.push('u.role_id = ?')
    values.push(options.roleId)
  }

  if (options.search) {
    filters.push('(u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)')
    const keyword = `%${options.search}%`
    values.push(keyword, keyword, keyword)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const [rows] = await pool.query<UserRow[]>(
    `
    SELECT
      u.user_id,
      u.username,
      u.password,
      u.full_name,
      u.email,
      u.phone,
      u.address,
      u.status,
      u.role_id,
      r.role_name,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    ${whereClause}
    ORDER BY u.user_id DESC
  `,
    values,
  )

  return rows.map(mapUser)
}

export const findUserById = async (userId: number): Promise<User | null> => {
  const [rows] = await pool.query<UserRow[]>(
    `
    SELECT
      u.user_id,
      u.username,
      u.password,
      u.full_name,
      u.email,
      u.phone,
      u.address,
      u.status,
      u.role_id,
      r.role_name,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = ?
    LIMIT 1
  `,
    [userId],
  )

  if (!rows.length) {
    return null
  }

  return mapUser(rows[0])
}

export const findUserByUsername = async (username: string): Promise<User | null> => {
  const [rows] = await pool.query<UserRow[]>(
    `
    SELECT
      u.user_id,
      u.username,
      u.password,
      u.full_name,
      u.email,
      u.phone,
      u.address,
      u.status,
      u.role_id,
      r.role_name,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.username = ?
    LIMIT 1
  `,
    [username],
  )

  if (!rows.length) {
    return null
  }

  return mapUser(rows[0])
}

// Tìm user với password (chỉ dùng cho auth)
export const findUserByUsernameWithPassword = async (
  username: string,
): Promise<UserWithPassword | null> => {
  const [rows] = await pool.query<UserRow[]>(
    `
    SELECT
      u.user_id,
      u.username,
      u.password,
      u.full_name,
      u.email,
      u.phone,
      u.address,
      u.status,
      u.role_id,
      r.role_name,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.username = ?
    LIMIT 1
  `,
    [username],
  )

  if (!rows.length) {
    return null
  }

  return mapUserWithPassword(rows[0])
}

export const createUser = async (payload: CreateUserPayload & { password: string }) => {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `
      INSERT INTO users
        (username, password, full_name, email, phone, address, status, role_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        payload.username,
        payload.password,
        payload.fullName ?? null,
        payload.email ?? null,
        payload.phone ?? null,
        payload.address ?? null,
        payload.status ?? 'active',
        payload.roleId ?? null,
      ],
    )

    return Number(result.insertId)
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'username đã tồn tại.')
    }
    throw error
  }
}

export const updateUser = async (
  userId: number,
  payload: UpdateUserPayload,
): Promise<boolean> => {
  if (!Object.keys(payload).length) {
    return false
  }

  const fields: string[] = []
  const values: Array<string | number | null> = []

  if (payload.username !== undefined) {
    fields.push('username = ?')
    values.push(payload.username)
  }

  if (payload.password !== undefined) {
    fields.push('password = ?')
    values.push(payload.password)
  }

  if (payload.fullName !== undefined) {
    fields.push('full_name = ?')
    values.push(payload.fullName)
  }

  if (payload.email !== undefined) {
    fields.push('email = ?')
    values.push(payload.email)
  }

  if (payload.phone !== undefined) {
    fields.push('phone = ?')
    values.push(payload.phone)
  }

  if (payload.address !== undefined) {
    fields.push('address = ?')
    values.push(payload.address)
  }

  if (payload.roleId !== undefined) {
    fields.push('role_id = ?')
    values.push(payload.roleId)
  }

  if (!fields.length) {
    return false
  }

  values.push(userId)

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
      values,
    )

    return result.affectedRows > 0
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'username đã tồn tại.')
    }
    throw error
  }
}

export const updateUserStatus = async (
  userId: number,
  payload: UpdateUserStatusPayload,
): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE users SET status = ? WHERE user_id = ?',
    [payload.status, userId],
  )

  return result.affectedRows > 0
}


