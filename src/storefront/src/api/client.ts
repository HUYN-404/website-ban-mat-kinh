import axios from 'axios'

// ── CHỈ CÒN DJANGO ── Node đã bị xoá hoàn toàn ──
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Tự động gắn auth token vào mọi request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Ống nối DUY NHẤT — mọi API đều qua đây */
export const getApiClient = () => apiClient

/** Chuyển đường dẫn ảnh relative → full URL */
export const resolveFileUrl = (pathOrUrl: string | undefined) => {
  if (!pathOrUrl) return undefined
  if (pathOrUrl.startsWith('/')) return `${FILE_BASE_URL}${pathOrUrl}`
  return pathOrUrl
}

export default apiClient













