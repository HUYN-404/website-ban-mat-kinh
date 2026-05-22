import axios from 'axios'

import { getCatalogClient } from '../api/client'

const API_V2_BASE_URL = import.meta.env.VITE_API_V2_BASE_URL || 'http://localhost:8000/api/v2'

const tryOnClient = axios.create({
  baseURL: API_V2_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface TryOnSession {
  id: number
  userId?: number | null
  productId?: number | null
  faceImageUrl?: string | null
  resultImageUrl?: string | null
  status: 'created' | 'face_uploaded' | 'rendered' | string
  createdAt?: string
}

const extractData = <T>(response: { data: { data: T } }): T => response.data.data

export const createTryOnSession = async (): Promise<TryOnSession> => {
  const response = await tryOnClient.post<{ data: TryOnSession }>('/tryon/sessions')
  return extractData(response)
}

export const uploadTryOnFaceImage = async (sessionId: number, imageFile: File): Promise<TryOnSession> => {
  const formData = new FormData()
  formData.append('image', imageFile)
  const response = await tryOnClient.post<{ data: TryOnSession }>(
    `/tryon/sessions/${sessionId}/face-image`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return extractData(response)
}

export const renderTryOnSession = async (
  sessionId: number,
  productId: number,
): Promise<TryOnSession> => {
  const response = await tryOnClient.post<{ data: TryOnSession }>(
    `/tryon/sessions/${sessionId}/render`,
    { productId },
  )
  return extractData(response)
}

export const listCatalogProducts = async () => {
  const catalogClient = getCatalogClient()
  const response = await catalogClient.get<{ data: Array<{ id: number; name: string }> }>('/products')
  return response.data.data
}
