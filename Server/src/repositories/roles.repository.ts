import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import pool from '../db/pool.js'
import HttpError from '../utils/httpError.js'
import type { CreateRolePayload, Role, UpdateRolePayload } from '../types/role.js'

// Các hàm làm việc trực tiếp với bảng roles trong MySQL

type RoleRow = RowDataPacket & {
  role_id: number
  role_name: string
  description: string | null
}

// Chuyển đổi dữ liệu từ DB sang model Role
const mapRole = (row: RoleRow): Role => ({
  id: row.role_id,
  roleName: row.role_name,
  description: row.description,
})

export const findAllRoles = async (): Promise<Role[]> => {
  const [rows] = await pool.query<RoleRow[]>(
    'SELECT role_id, role_name, description FROM roles ORDER BY role_id ASC',
  )

  return rows.map(mapRole)
}

export const findRoleById = async (roleId: number): Promise<Role | null> => {
  const [rows] = await pool.query<RoleRow[]>(
    'SELECT role_id, role_name, description FROM roles WHERE role_id = ? LIMIT 1',
    [roleId],
  )

  if (!rows.length) {
    return null
  }

  return mapRole(rows[0])
}

export const findRoleByName = async (roleName: string): Promise<Role | null> => {
  const [rows] = await pool.query<RoleRow[]>(
    'SELECT role_id, role_name, description FROM roles WHERE role_name = ? LIMIT 1',
    [roleName],
  )

  if (!rows.length) {
    return null
  }

  return mapRole(rows[0])
}

export const createRole = async (payload: CreateRolePayload): Promise<Role> => {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO roles(role_name, description) VALUES (?, ?)',
      [payload.roleName, payload.description ?? null],
    )

    return {
      id: Number(result.insertId),
      roleName: payload.roleName,
      description: payload.description ?? null,
    }
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'roleName đã tồn tại.')
    }
    throw error
  }
}

export const updateRole = async (
  roleId: number,
  payload: UpdateRolePayload,
): Promise<Role | null> => {
  if (!Object.keys(payload).length) {
    return findRoleById(roleId)
  }

  const fields: string[] = []
  const values: Array<string | number | null> = []

  if (payload.roleName !== undefined) {
    fields.push('role_name = ?')
    values.push(payload.roleName)
  }

  if (payload.description !== undefined) {
    fields.push('description = ?')
    values.push(payload.description)
  }

  if (!fields.length) {
    return findRoleById(roleId)
  }

  values.push(roleId)

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE roles SET ${fields.join(', ')} WHERE role_id = ?`,
      values,
    )

    if (result.affectedRows === 0) {
      return null
    }

    return findRoleById(roleId)
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'roleName đã tồn tại.')
    }
    throw error
  }
}

export const deleteRole = async (roleId: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM roles WHERE role_id = ?',
    [roleId],
  )

  return result.affectedRows > 0
}

export const countUsersByRoleId = async (roleId: number): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM users WHERE role_id = ?',
    [roleId],
  )

  const total = rows[0]?.total

  return typeof total === 'number' ? total : Number(total ?? 0)
}

