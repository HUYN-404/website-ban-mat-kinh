import apiClient from './client'
import type { ApiResponse } from '../types/api'

export async function getCollection<T>(path: string, params?: Record<string, unknown>) {
  const response = await apiClient.get<ApiResponse<T[]>>(path, { params })
  return response.data.data ?? []
}

export async function getResource<T>(path: string, id: number | string) {
  const response = await apiClient.get<ApiResponse<T>>(`${path}/${id}`)
  return response.data.data
}

// Lấy 1 bản ghi theo đường dẫn trực tiếp (không cần id ở cuối URL)
export async function getSingle<T>(path: string) {
  const response = await apiClient.get<ApiResponse<T>>(path)
  return response.data.data
}


