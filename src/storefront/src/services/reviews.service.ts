import { getApiClient } from '../api/client'

export interface Review {
  id: number
  userId: number
  userName: string | null
  productId: number
  rating: number
  comment: string | null
  createdAt: string
}

interface ReviewsResponse {
  data: Review[]
}

interface ReviewResponse {
  data: Review
}

// Lấy tất cả review của 1 sản phẩm
export const getProductReviews = async (productId: number): Promise<Review[]> => {
  const response = await getApiClient().get<ReviewsResponse>(`/products/${productId}/reviews`)
  return response.data.data
}

// Tạo review mới
export const createReview = async (
  productId: number,
  rating: number,
  comment: string,
): Promise<Review> => {
  const response = await getApiClient().post<ReviewResponse>('/reviews', {
    productId,
    rating,
    comment,
  })
  return response.data.data
}
