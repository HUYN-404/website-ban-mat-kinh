import type { Request, Response } from 'express'

import { getInventory, listInventory, setInventoryQuantity } from '../services/inventory.service.js'
import {
  validateInventoryProductId,
  validateUpdateInventoryPayload,
} from '../validators/inventory.validator.js'

// Controller cho tồn kho

export const handleListInventory = async (_req: Request, res: Response) => {
  const items = await listInventory()
  res.json({ data: items })
}

export const handleGetInventory = async (req: Request, res: Response) => {
  const productId = validateInventoryProductId(req.params.productId)
  const item = await getInventory(productId)
  res.json({ data: item })
}

export const handleUpdateInventory = async (req: Request, res: Response) => {
  const productId = validateInventoryProductId(req.params.productId)
  const payload = validateUpdateInventoryPayload(req.body)
  const item = await setInventoryQuantity(productId, payload)
  res.json({ data: item, message: 'Cập nhật tồn kho thành công.' })
}


