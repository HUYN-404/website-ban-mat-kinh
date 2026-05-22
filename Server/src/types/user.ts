// Mô tả cấu trúc dữ liệu người dùng dùng trong ứng dụng
export type UserStatus = 'active' | 'inactive'

export interface User {
  id: number
  username: string
  fullName: string | null
  email: string | null
  phone: string | null
  address: string | null
  status: UserStatus
  roleId: number | null
  roleName: string | null
  createdAt: string
  updatedAt: string
}

// User với password (chỉ dùng nội bộ, không trả về API)
export interface UserWithPassword extends User {
  password: string
}

// Payload khi tạo người dùng mới
export interface CreateUserPayload {
  username: string
  password: string
  fullName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  roleId?: number | null
  status?: UserStatus
}

// Payload khi cập nhật thông tin người dùng
export interface UpdateUserPayload {
  username?: string
  password?: string
  fullName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  roleId?: number | null
}

// Payload dùng riêng cho cập nhật trạng thái
export interface UpdateUserStatusPayload {
  status: UserStatus
}

