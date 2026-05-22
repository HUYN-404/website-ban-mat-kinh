// Loại giao dịch kho
export type InventoryTransactionType = 'import' | 'export'

// Dữ liệu giao dịch kho
export interface InventoryTransaction {
  id: number
  productId: number
  productName: string | null
  userId: number | null
  userName: string | null
  roleName: string | null
  type: InventoryTransactionType
  quantity: number
  note: string | null
  createdAt: string
}

// Payload tạo giao dịch kho
export interface CreateInventoryTransactionPayload {
  productId: number
  userId?: number | null
  transactionType: InventoryTransactionType
  quantity: number
  note?: string | null
}

// Payload tạo nhiều giao dịch kho cùng lúc (bulk)
export interface BulkInventoryTransactionItem {
  productId: number
  quantity: number
}

export interface CreateBulkInventoryTransactionPayload {
  items: BulkInventoryTransactionItem[]
  userId?: number | null
  transactionType: InventoryTransactionType
  note?: string | null
}


