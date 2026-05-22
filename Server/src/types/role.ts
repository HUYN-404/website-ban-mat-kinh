// Định nghĩa model Role trao đổi giữa các lớp
export interface Role {
  id: number
  roleName: string
  description: string | null
}

// Payload khi tạo mới vai trò
export interface CreateRolePayload {
  roleName: string
  description?: string | null
}

// Payload khi cập nhật vai trò
export interface UpdateRolePayload {
  roleName?: string
  description?: string | null
}

