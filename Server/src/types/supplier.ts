// Kiểu dữ liệu cho nhà cung cấp
export interface Supplier {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

// Payload tạo nhà cung cấp
export interface CreateSupplierPayload {
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
}

// Payload cập nhật nhà cung cấp
export interface UpdateSupplierPayload {
  name?: string
  phone?: string | null
  email?: string | null
  address?: string | null
}


