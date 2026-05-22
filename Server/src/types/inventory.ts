// Kiểu dữ liệu tồn kho
export interface InventoryItem {
  id: number
  productId: number
  productName: string | null
  totalQuantity: number
  lastUpdated: string
}

// Payload cập nhật tồn kho (dành cho admin)
export interface UpdateInventoryPayload {
  totalQuantity: number
}


