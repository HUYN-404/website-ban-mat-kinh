import type { Request, Response } from 'express'

import {
  createRole,
  getRole,
  listRoles,
  removeRole,
  updateRole,
} from '../services/roles.service.js'
import {
  validateCreateRolePayload,
  validateRoleId,
  validateUpdateRolePayload,
} from '../validators/role.validator.js'

// Controller nhận request HTTP cho module roles

export const handleListRoles = async (_req: Request, res: Response) => {
  const roles = await listRoles()
  res.json({ data: roles })
}

export const handleGetRole = async (req: Request, res: Response) => {
  const roleId = validateRoleId(req.params.roleId)
  const role = await getRole(roleId)
  res.json({ data: role })
}

export const handleCreateRole = async (req: Request, res: Response) => {
  const payload = validateCreateRolePayload(req.body)
  const role = await createRole(payload)
  res.status(201).json({ data: role, message: 'Tạo vai trò thành công.' })
}

export const handleUpdateRole = async (req: Request, res: Response) => {
  const roleId = validateRoleId(req.params.roleId)
  const payload = validateUpdateRolePayload(req.body)
  const role = await updateRole(roleId, payload)
  res.json({ data: role, message: 'Cập nhật vai trò thành công.' })
}

export const handleDeleteRole = async (req: Request, res: Response) => {
  const roleId = validateRoleId(req.params.roleId)
  await removeRole(roleId)
  res.json({ message: 'Xóa vai trò thành công.' })
}

