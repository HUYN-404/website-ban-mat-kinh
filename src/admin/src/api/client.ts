import axios from 'axios'

// ── CHỈ CÒN DJANGO ── Node đã bị xoá hoàn toàn ──
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? 'http://localhost:8000/api'
export const FILE_BASE_URL =
  import.meta.env.VITE_FILE_BASE_URL?.toString() ?? 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 12000,
})

export const resolveFileUrl = (pathOrUrl: string | undefined) => {
  if (!pathOrUrl) return ''
  if (pathOrUrl.startsWith('/')) return `${FILE_BASE_URL}${pathOrUrl}`
  return pathOrUrl
}

export default apiClient


