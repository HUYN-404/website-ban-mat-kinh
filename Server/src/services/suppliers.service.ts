import HttpError from '../utils/httpError.js'
import type { CreateSupplierPayload, Supplier, UpdateSupplierPayload } from '../types/supplier.js'
import {
  countProductsBySupplierId,
  createSupplier as createSupplierRepository,
  deleteSupplier as deleteSupplierRepository,
  findAllSuppliers,
  findSupplierById,
  updateSupplier as updateSupplierRepository,
} from '../repositories/suppliers.repository.js'

// Nghiệp vụ quản lý nhà cung cấp

const ensureSupplierExist = async (supplierId: number): Promise<Supplier> => {
  const supplier = await findSupplierById(supplierId)
  if (!supplier) {
    throw new HttpError(404, 'Nhà cung cấp không tồn tại.')
  }
  return supplier
}

export const listSuppliers = async (): Promise<Supplier[]> => {
  return findAllSuppliers()
}

export const getSupplier = async (supplierId: number): Promise<Supplier> => {
  return ensureSupplierExist(supplierId)
}

export const createSupplier = async (payload: CreateSupplierPayload): Promise<Supplier> => {
  const newSupplierId = await createSupplierRepository(payload)
  const supplier = await findSupplierById(newSupplierId)
  if (!supplier) {
    throw new HttpError(500, 'Không thể lấy thông tin nhà cung cấp vừa tạo.')
  }
  return supplier
}

export const updateSupplier = async (
  supplierId: number,
  payload: UpdateSupplierPayload,
): Promise<Supplier> => {
  await ensureSupplierExist(supplierId)

  const updated = await updateSupplierRepository(supplierId, payload)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật nhà cung cấp.')
  }

  return ensureSupplierExist(supplierId)
}

export const removeSupplier = async (supplierId: number): Promise<void> => {
  await ensureSupplierExist(supplierId)

  const productCount = await countProductsBySupplierId(supplierId)
  if (productCount > 0) {
    throw new HttpError(409, 'Không thể xóa do nhà cung cấp đang được sản phẩm sử dụng.')
  }

  const deleted = await deleteSupplierRepository(supplierId)
  if (!deleted) {
    throw new HttpError(500, 'Không thể xóa nhà cung cấp.')
  }
}


