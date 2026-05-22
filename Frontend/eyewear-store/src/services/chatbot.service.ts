import { getCoreClient } from '../api/client'

export interface ChatbotProduct {
  id: number
  name: string
  price: number
  brandName: string | null
  categoryName: string | null
  stockQuantity: number
}

export interface ChatbotResponse {
  intent: string
  reply: string
  suggestions: string[]
  products: ChatbotProduct[]
}

interface ApiResponse {
  data: ChatbotResponse
}

export const sendChatbotMessage = async (message: string): Promise<ChatbotResponse> => {
  const response = await getCoreClient().post<ApiResponse>('/chatbot', { message })
  return response.data.data
}
