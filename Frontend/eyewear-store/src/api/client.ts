import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const API_V2_BASE_URL = import.meta.env.VITE_API_V2_BASE_URL || 'http://localhost:8000/api/v2'
const USE_API_V2_CATALOG = import.meta.env.VITE_USE_API_V2_CATALOG === '1'
const USE_API_V2_CORE = import.meta.env.VITE_USE_API_V2_CORE === '1'
export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const withAuthHeaders = (client: ReturnType<typeof axios.create>) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`
  }
  return client
}

export const getCatalogClient = () => {
  if (USE_API_V2_CATALOG) {
    return withAuthHeaders(axios.create({
      baseURL: API_V2_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    }))
  }
  return apiClient
}

export const getCoreClient = () => {
  if (USE_API_V2_CORE) {
    return withAuthHeaders(axios.create({
      baseURL: API_V2_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    }))
  }
  return apiClient
}

export const resolveFileUrl = (pathOrUrl: string | undefined) => {
  if (!pathOrUrl) return undefined
  if (pathOrUrl.startsWith('/')) {
    return `${FILE_BASE_URL}${pathOrUrl}`
  }
  return pathOrUrl
}

export default apiClient













