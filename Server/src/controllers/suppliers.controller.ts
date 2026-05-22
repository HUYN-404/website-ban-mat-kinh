import type { Request, Response } from 'express'

import {
  createSupplier,
  getSupplier,
  listSuppliers,
  removeSupplier,
  updateSupplier,
} from '../services/suppliers.service.js'
import {
  validateCreateSupplierPayload,
  validateSupplierId,
  validateUpdateSupplierPayload,
} from '../validators/supplier.validator.js'

// Controller cho nhà cung cấp

export const handleListSuppliers = async (_req: Request, res: Response) => {
  const suppliers = await listSuppliers()
  res.json({ data: suppliers })
}

export const handleGetSupplier = async (req: Request, res: Response) => {
  const supplierId = validateSupplierId(req.params.supplierId)
  const supplier = await getSupplier(supplierId)
  res.json({ data: supplier })
}

export const handleCreateSupplier = async (req: Request, res: Response) => {
  const payload = validateCreateSupplierPayload(req.body)
  const supplier = await createSupplier(payload)
  res.status(201).json({ data: supplier, message: 'Tạo nhà cung cấp thành công.' })
}

export const handleUpdateSupplier = async (req: Request, res: Response) => {
  const supplierId = validateSupplierId(req.params.supplierId)
  const payload = validateUpdateSupplierPayload(req.body)
  const supplier = await updateSupplier(supplierId, payload)
  res.json({ data: supplier, message: 'Cập nhật nhà cung cấp thành công.' })
}

export const handleDeleteSupplier = async (req: Request, res: Response) => {
  const supplierId = validateSupplierId(req.params.supplierId)
  await removeSupplier(supplierId)
  res.json({ message: 'Xóa nhà cung cấp thành công.' })
}


