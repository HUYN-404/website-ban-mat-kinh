import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCoreClient, resolveFileUrl } from '../api/client'

// Types từ Backend
interface BackendCart {
  id: number
  userId: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

interface BackendCartItem {
  id: number
  cartId: number
  productId: number
  productName: string | null
  quantity: number
  unitPrice: number
  subtotal: number
  createdAt: string
  updatedAt: string
}

interface CartResponse {
  data: BackendCart
}

interface CartItemsResponse {
  data: BackendCartItem[]
}

// interface CreateCartPayload {
//   userId: number
// }
// Note: CreateCartPayload không được sử dụng, có thể cần trong tương lai

interface AddCartItemPayload {
  cartId: number
  productId: number
  quantity?: number
}

interface UpdateCartItemPayload {
  quantity: number
}

// Frontend Cart Item type (có thêm product info)
export interface CartItem {
  id: number
  cartId: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  productImage?: string
  createdAt: string
  updatedAt: string
}

// Lấy active cart của user
export const getActiveCart = async (userId: number): Promise<BackendCart | null> => {
  try {
    const response = await getCoreClient().get<CartResponse>(`/carts/user/${userId}/active`)
    return response.data.data
  } catch (error: any) {
    // Nếu không tìm thấy cart (404), trả về null
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

// Tạo cart mới
export const createCart = async (userId: number): Promise<BackendCart> => {
  const response = await getCoreClient().post<CartResponse>('/carts', { userId })
  return response.data.data
}

// Lấy hoặc tạo cart (helper function)
export const getOrCreateCart = async (userId: number): Promise<BackendCart> => {
  let cart = await getActiveCart(userId)
  if (!cart) {
    cart = await createCart(userId)
  }
  return cart
}

// Lấy danh sách items trong cart
export const getCartItems = async (cartId: number): Promise<CartItem[]> => {
  const coreClient = getCoreClient()
  const response = await coreClient.get<CartItemsResponse>(`/carts/${cartId}/items`)
  const items = response.data.data

  // Fetch product images cho mỗi item
  const itemsWithImages = await Promise.all(
    items.map(async (item) => {
      try {
        const imagesResponse = await coreClient.get<{ data: Array<{ imageUrl: string }> }>(
          `/products/${item.productId}/images`,
        )
        const firstImage = imagesResponse.data.data[0]?.imageUrl
        return {
          ...item,
          productName: item.productName || 'Unknown Product',
          productImage: firstImage
            ? resolveFileUrl(firstImage)
            : undefined,
        }
      } catch (error) {
        return {
          ...item,
          productName: item.productName || 'Unknown Product',
        }
      }
    }),
  )

  return itemsWithImages
}

// Thêm item vào cart
export const addCartItem = async (payload: AddCartItemPayload): Promise<CartItem[]> => {
  await getCoreClient().post<CartItemsResponse>(`/carts/${payload.cartId}/items`, {
    cartId: payload.cartId,
    productId: payload.productId,
    quantity: payload.quantity ?? 1,
  })
  
  // Fetch lại với images
  return getCartItems(payload.cartId)
}

// Cập nhật số lượng item
export const updateCartItem = async (
  cartId: number,
  cartItemId: number,
  payload: UpdateCartItemPayload,
): Promise<CartItem[]> => {
  await getCoreClient().put(`/carts/${cartId}/items/${cartItemId}`, payload)
  return getCartItems(cartId)
}

// Xóa item khỏi cart
export const removeCartItem = async (cartId: number, cartItemId: number): Promise<CartItem[]> => {
  await getCoreClient().delete(`/carts/${cartId}/items/${cartItemId}`)
  return getCartItems(cartId)
}

// Hooks
export const useCart = (userId: number | null) => {
  return useQuery({
    queryKey: ['cart', userId],
    queryFn: async () => {
      if (!userId) return null
      return getOrCreateCart(userId)
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useCartItems = (cartId: number | null) => {
  return useQuery({
    queryKey: ['cart-items', cartId],
    queryFn: () => getCartItems(cartId!),
    enabled: !!cartId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useAddCartItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart-items', variables.cartId] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ cartId, cartItemId, payload }: { cartId: number; cartItemId: number; payload: UpdateCartItemPayload }) =>
      updateCartItem(cartId, cartItemId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart-items', variables.cartId] })
    },
  })
}

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ cartId, cartItemId }: { cartId: number; cartItemId: number }) =>
      removeCartItem(cartId, cartItemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart-items', variables.cartId] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}




