import HttpError from '../utils/httpError.js'
import type { InventoryItem, UpdateInventoryPayload } from '../types/inventory.js'
import {
  createInventoryRecord,
  findAllInventory,
  findInventoryByProductId,
  updateInventory,
} from '../repositories/inventory.repository.js'
import { findProductById } from '../repositories/products.repository.js'

// Nghiệp vụ tồn kho

const ensureProductExists = async (productId: number) => {
  const product = await findProductById(productId)
  if (!product) {
    throw new HttpError(404, 'Sản phẩm không tồn tại.')
  }
}

const ensureInventoryRecord = async (productId: number): Promise<InventoryItem> => {
  const existing = await findInventoryByProductId(productId)
  if (existing) {
    return existing
  }
  return createInventoryRecord(productId, 0)
}

export const listInventory = async (): Promise<InventoryItem[]> => {
  return findAllInventory()
}

export const getInventory = async (productId: number): Promise<InventoryItem> => {
  await ensureProductExists(productId)
  return ensureInventoryRecord(productId)
}

export const setInventoryQuantity = async (
  productId: number,
  payload: UpdateInventoryPayload,
): Promise<InventoryItem> => {
  await ensureProductExists(productId)
  await ensureInventoryRecord(productId)

  const updated = await updateInventory(productId, payload)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật tồn kho.')
  }

  return getInventory(productId)
}


