import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react'

import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  type WishlistItem,
} from '../services/wishlist.service'

interface WishlistContextType {
  wishlist: WishlistItem[]
  isLoading: boolean
  isLiked: (productId: number) => boolean
  toggleWishlist: (productId: number) => Promise<void>
  refreshWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const { success, error, warning } = useToast()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load wishlist khi user đăng nhập
  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setWishlist([])
      return
    }
    setIsLoading(true)
    try {
      const data = await getWishlist()
      setWishlist(data)
    } catch {
      setWishlist([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  // Load khi user thay đổi (login/logout)
  useEffect(() => {
    refreshWishlist()
  }, [refreshWishlist])

  // Kiểm tra sản phẩm đã thích chưa
  const isLiked = useCallback(
    (productId: number) => wishlist.some((item) => item.productId === productId),
    [wishlist],
  )

  // Thêm / bỏ yêu thích
  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (!isAuthenticated) {
        warning('Vui lòng đăng nhập để thêm vào yêu thích.')
        return
      }

      try {
        const existing = wishlist.find((item) => item.productId === productId)
        if (existing) {
          await removeFromWishlist(existing.id)
          setWishlist((prev) => prev.filter((item) => item.id !== existing.id))
          success('Đã bỏ khỏi danh sách yêu thích.')
        } else {
          const created = await addToWishlist(productId)
          setWishlist((prev) => [created, ...prev])
          success('Đã thêm vào danh sách yêu thích!')
        }
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'Không thể cập nhật yêu thích.'
        error(message)
      }
    },
    [isAuthenticated, wishlist, success, error, warning],
  )

  return (
    <WishlistContext.Provider
      value={{ wishlist, isLoading, isLiked, toggleWishlist, refreshWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider')
  }
  return context
}
