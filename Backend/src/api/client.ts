import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? 'http://localhost:3000/api'
export const API_V2_BASE_URL =
  import.meta.env.VITE_API_V2_BASE_URL?.toString() ?? 'http://localhost:8000/api/v2'
export const FILE_BASE_URL =
  import.meta.env.VITE_FILE_BASE_URL?.toString() ?? 'http://localhost:3000'
export const USE_API_V2_CATALOG = import.meta.env.VITE_USE_API_V2_CATALOG === '1'

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


