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


