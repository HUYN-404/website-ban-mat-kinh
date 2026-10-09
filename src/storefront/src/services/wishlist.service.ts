import { getApiClient } from '../api/client'

export interface WishlistItem {
  id: number
  userId: number
  productId: number
  productName: string | null
  productPrice: number | null
  productImage: string | null
  createdAt: string
}

interface WishlistResponse {
  data: WishlistItem[]
}

interface WishlistItemResponse {
  data: WishlistItem
}

// Lấy danh sách yêu thích của user
export const getWishlist = async (): Promise<WishlistItem[]> => {
  const response = await getApiClient().get<WishlistResponse>('/wishlist')
  return response.data.data
}

// Thêm sản phẩm vào yêu thích
export const addToWishlist = async (productId: number): Promise<WishlistItem> => {
  const response = await getApiClient().post<WishlistItemResponse>('/wishlist', { productId })
  return response.data.data
}

// Bỏ yêu thích (cần id của wishlist item)
export const removeFromWishlist = async (itemId: number): Promise<void> => {
  await getApiClient().delete(`/wishlist/${itemId}`)
}
