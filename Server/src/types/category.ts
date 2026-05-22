// Kiểu dữ liệu cho danh mục sản phẩm
export interface Category {
  id: number
  name: string
  description: string | null
  parentId: number | null
  parentName: string | null
  createdAt: string
  updatedAt: string
}

// Payload tạo danh mục mới
export interface CreateCategoryPayload {
  name: string
  description?: string | null
  parentId?: number | null
}

// Payload cập nhật danh mục
export interface UpdateCategoryPayload {
  name?: string
  description?: string | null
  parentId?: number | null
}


