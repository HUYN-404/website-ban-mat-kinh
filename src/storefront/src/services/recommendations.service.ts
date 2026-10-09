import { getApiClient } from '../api/client'

export type RecommendationReason = 'popular' | 'personalized' | 'similar'

interface RecommendationsResponse {
  data: {
    productIds: number[]
    reason: RecommendationReason
  }
}

export interface RecommendationResult {
  productIds: number[]
  reason: RecommendationReason
}

// Gợi ý cá nhân theo lịch sử mua (yêu cầu đăng nhập)
export const fetchUserRecommendations = async (limit = 6): Promise<RecommendationResult> => {
  const response = await getApiClient().get<RecommendationsResponse>('/recommendations/user', {
    params: { limit },
  })
  return response.data.data
}

// Sản phẩm phổ biến — dùng khi chưa đăng nhập / chưa có lịch sử
export const fetchPopularRecommendations = async (limit = 6): Promise<RecommendationResult> => {
  const response = await getApiClient().get<RecommendationsResponse>('/recommendations/popular', {
    params: { limit },
  })
  return response.data.data
}

// Sản phẩm tương tự (trang chi tiết) — content-based từ backend
export const fetchSimilarProducts = async (
  productId: number | string,
  limit = 3,
): Promise<RecommendationResult> => {
  const response = await getApiClient().get<RecommendationsResponse>(
    `/recommendations/product/${productId}`,
    { params: { limit } },
  )
  return response.data.data
}
