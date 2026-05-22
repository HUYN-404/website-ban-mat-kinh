import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { useCart, useCartItems, useAddCartItem, useUpdateCartItem, useRemoveCartItem } from '../services/cart.service'
import type { CartItem } from '../services/cart.service'

interface CartContextType {
  cartId: number | null
  items: CartItem[]
  isLoading: boolean
  itemCount: number
  total: number
  addToCart: (productId: number, quantity?: number) => Promise<void>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  refreshCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { success, error, warning } = useToast()
  
  // Lấy cart của user (chỉ khi user đã đăng nhập)
  const { data: cart, isLoading: isLoadingCart, refetch: refetchCart } = useCart(user?.id ?? null)
  
  // Lấy items trong cart (chỉ khi có cart)
  const { data: items = [], isLoading: isLoadingItems, refetch: refetchItems } = useCartItems(cart?.id ?? null)
  
  // Mutations
  const addItemMutation = useAddCartItem()
  const updateItemMutation = useUpdateCartItem()
  const removeItemMutation = useRemoveCartItem()

  // Tính toán
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  // Thêm sản phẩm vào cart
  const addToCart = useCallback(
    async (productId: number, quantity: number = 1) => {
      if (!user?.id) {
        warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.')
        return
      }

      if (!cart) {
        error('Không thể tạo giỏ hàng. Vui lòng thử lại.')
        return
      }

      try {
        await addItemMutation.mutateAsync({
          cartId: cart.id,
          productId,
          quantity,
        })
        // Refetch để cập nhật UI
        await refetchItems()
        success('Đã thêm sản phẩm vào giỏ hàng!')
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Không thể thêm sản phẩm vào giỏ hàng.'
        error(errorMessage)
        throw err
      }
    },
    [user, cart, addItemMutation, refetchItems, success, error, warning],
  )

  // Xóa item (không có confirmation ở đây, sẽ dùng ConfirmationDialog ở component)
  const removeItem = useCallback(
    async (itemId: number) => {
      if (!cart) return

      try {
        await removeItemMutation.mutateAsync({
          cartId: cart.id,
          cartItemId: itemId,
        })
        await refetchItems()
        success('Đã xóa sản phẩm khỏi giỏ hàng!')
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Không thể xóa sản phẩm.'
        error(errorMessage)
        throw err
      }
    },
    [cart, removeItemMutation, refetchItems, success, error],
  )

  // Cập nhật số lượng
  const updateQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      if (!cart) return

      if (quantity <= 0) {
        await removeItem(itemId)
        return
      }

      try {
        await updateItemMutation.mutateAsync({
          cartId: cart.id,
          cartItemId: itemId,
          payload: { quantity },
        })
        await refetchItems()
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật số lượng.'
        error(errorMessage)
        throw err
      }
    },
    [cart, updateItemMutation, refetchItems, removeItem, error],
  )

  // Refresh cart
  const refreshCart = useCallback(() => {
    refetchCart()
    refetchItems()
  }, [refetchCart, refetchItems])

  const value: CartContextType = {
    cartId: cart?.id ?? null,
    items,
    isLoading: isLoadingCart || isLoadingItems,
    itemCount,
    total,
    addToCart,
    updateQuantity,
    removeItem,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCartContext() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider')
  }
  return context
}

