import HttpError from '../utils/httpError.js'
import type { CreateRolePayload, Role, UpdateRolePayload } from '../types/role.js'
import {
  countUsersByRoleId,
  createRole as createRoleRepository,
  deleteRole as deleteRoleRepository,
  findAllRoles,
  findRoleById,
  updateRole as updateRoleRepository,
} from '../repositories/roles.repository.js'

// Lớp dịch vụ xử lý nghiệp vụ liên quan đến roles

export const listRoles = async (): Promise<Role[]> => {
  return findAllRoles()
}

export const getRole = async (roleId: number): Promise<Role> => {
  const role = await findRoleById(roleId)

  if (!role) {
    throw new HttpError(404, 'Role không tồn tại.')
  }

  return role
}

export const createRole = async (payload: CreateRolePayload): Promise<Role> => {
  return createRoleRepository(payload)
}

export const updateRole = async (
  roleId: number,
  payload: UpdateRolePayload,
): Promise<Role> => {
  const role = await updateRoleRepository(roleId, payload)

  if (!role) {
    throw new HttpError(404, 'Role không tồn tại.')
  }

  return role
}

export const removeRole = async (roleId: number): Promise<void> => {
  // Kiểm tra xem role đang được user sử dụng không
  const usageCount = await countUsersByRoleId(roleId)

  if (usageCount > 0) {
    throw new HttpError(409, 'Role đang được sử dụng bởi người dùng khác.')
  }

  const deleted = await deleteRoleRepository(roleId)

  if (!deleted) {
    throw new HttpError(404, 'Role không tồn tại.')
  }
}

