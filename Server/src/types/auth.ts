// Payload đăng nhập
export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
  email: string
  fullName?: string | null
}

// Response đăng nhập
export interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    fullName: string | null
    email: string | null
    roleName: string | null
  }
}

// Payload token (JWT payload)
export interface TokenPayload {
  userId: number
  username: string
  roleId: number | null
}














