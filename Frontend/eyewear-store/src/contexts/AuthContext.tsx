import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import apiClient, { getCoreClient } from '../api/client'

// Types
interface User {
  id: number
  username: string
  fullName: string | null
  email: string | null
  phone: string | null
  address: string | null
  status: string
  roleId: number | null
  roleName: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (params: { username: string; password: string; email: string; fullName?: string }) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'auth_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load token từ localStorage khi app khởi động
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedToken) {
      setToken(savedToken)
      // Set token vào axios header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
      // Lấy thông tin user (async, không block render)
      fetchUser(savedToken).catch(() => {
        // Nếu lỗi (API chưa sẵn sàng), vẫn cho app render
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async (authToken: string) => {
    try {
      const coreClient = getCoreClient()
      coreClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
      const response = await coreClient.get('/auth/me')
      setUser(response.data.data)
      setIsLoading(false)
    } catch (error) {
      // Token không hợp lệ hoặc API chưa sẵn sàng, xóa token
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      delete apiClient.defaults.headers.common['Authorization']
      setIsLoading(false)
      // Không throw error để app vẫn render được
    }
  }

  const login = useCallback(async (username: string, password: string) => {
    try {
      const coreClient = getCoreClient()
      const response = await coreClient.post('/auth/login', { username, password })
      const { token: newToken, user: userData } = response.data.data

      // Lưu token vào localStorage
      localStorage.setItem(TOKEN_KEY, newToken)
      setToken(newToken)
      setUser(userData)

      // Set token vào axios header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
      throw new Error(message)
    }
  }, [])

  const register = useCallback(
    async (params: { username: string; password: string; email: string; fullName?: string }) => {
      try {
        const coreClient = getCoreClient()
        const response = await coreClient.post('/auth/register', params)
        const { token: newToken, user: userData } = response.data.data

        localStorage.setItem(TOKEN_KEY, newToken)
        setToken(newToken)
        setUser(userData)
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      } catch (error: any) {
        const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
        throw new Error(message)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    // Xóa token khỏi localStorage
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    delete apiClient.defaults.headers.common['Authorization']
  }, [])

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null))
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

