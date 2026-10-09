import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus } from 'react-icons/fi'
import { HiHeart, HiOutlineHeart } from 'react-icons/hi2'

import type { Product } from '../data/products'
import { formatCurrency } from '../utils/formatCurrency'
import { useCartContext } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import TiltCard from './TiltCard'

interface ProductCardProps {
  product: Product
  /** Bật hiệu ứng 3D nghiêng theo chuột (framer-motion) — mặc định tắt */
  tilt?: boolean
}

const ProductCard = ({ product, tilt = false }: ProductCardProps) => {
  const { addToCart } = useCartContext()
  const { isLiked, toggleWishlist } = useWishlist()
  const [isAdding, setIsAdding] = useState(false)
  const [isTogglingWish, setIsTogglingWish] = useState(false)
  const [isHeartPopping, setIsHeartPopping] = useState(false)
  const stockQuantity = product.stockQuantity ?? 0
  const isOutOfStock = stockQuantity === 0
  // Sắp hết: còn 1–3 sản phẩm → nhắc khách nhanh tay
  const isLowStock = stockQuantity > 0 && stockQuantity <= 3
  const liked = isLiked(Number(product.id))

  // Nhịp "nảy" cho nút tim ngay khi khách vừa thích sản phẩm
  useEffect(() => {
    if (!liked) {
      setIsHeartPopping(false)
      return
    }

    setIsHeartPopping(true)
    const timeoutId = window.setTimeout(() => setIsHeartPopping(false), 350)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [liked])

  const handleAddToCart = useCallback(async () => {
    if (isOutOfStock) return
    
    setIsAdding(true)
    try {
      await addToCart(Number(product.id), 1)
      // Có thể thêm toast notification ở đây
    } catch (error) {
      // Error đã được xử lý trong addToCart
    } finally {
      setIsAdding(false)
    }
  }, [product.id, addToCart, isOutOfStock])

  const handleToggleWishlist = useCallback(async () => {
    if (isTogglingWish) return
    setIsTogglingWish(true)
    try {
      await toggleWishlist(Number(product.id))
    } finally {
      setIsTogglingWish(false)
    }
  }, [isTogglingWish, toggleWishlist, product.id])

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm shadow-black/5 transition duration-500 ease-luxury hover:-translate-y-1.5 hover:shadow-soft">
      <div className="relative block">
        {tilt ? (
          <TiltCard glare>
            <Link to={`/products/${product.id}`} className="block overflow-hidden rounded-xl">
              <div className="aspect-[4/5] overflow-hidden rounded-xl bg-alabaster p-3">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-contain transition duration-700 ease-luxury group-hover:scale-105"
                />
              </div>
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-0 transition duration-500 ease-luxury group-hover:opacity-100" />
            </Link>
          </TiltCard>
        ) : (
          <Link to={`/products/${product.id}`} className="block overflow-hidden rounded-xl">
            <div className="aspect-[4/5] overflow-hidden rounded-xl bg-alabaster p-3">
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-contain transition duration-700 ease-luxury group-hover:scale-105"
              />
            </div>
            <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-0 transition duration-500 ease-luxury group-hover:opacity-100" />
          </Link>
        )}

        {/* Badge trạng thái tồn kho — góc trên trái */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-2">
          {isOutOfStock ? (
            <span className="rounded-full bg-charcoal/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
              Hết hàng
            </span>
          ) : isLowStock ? (
            <span className="rounded-full bg-gold-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
              Sắp hết · còn {stockQuantity}
            </span>
          ) : null}
        </div>

        {/* Nút yêu thích — góc trên phải */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={isTogglingWish}
          aria-label={liked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition duration-300 ease-luxury active:scale-90 ${
            liked
              ? 'border-charcoal bg-charcoal text-white'
              : 'border-neutral-900 bg-white/90 text-neutral-900 backdrop-blur-sm hover:bg-neutral-900 hover:text-white'
          } disabled:opacity-60 ${isHeartPopping ? 'animate-heart-pop' : ''}`}
        >
          {liked ? <HiHeart size={20} /> : <HiOutlineHeart size={20} />}
        </button>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Link
            to={`/products/${product.id}`}
            className="text-lg font-semibold text-charcoal transition hover:text-gold-600"
          >
            {product.name}
          </Link>
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">{product.brand}</p>
          <p className="text-base text-neutral-600">{product.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4">
          <span className="text-lg font-medium text-charcoal">{formatCurrency(product.price)}</span>
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
              Hết hàng
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-900 px-4 py-2 text-sm font-medium text-neutral-900 transition duration-300 ease-luxury hover:bg-neutral-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus className="text-base" />
              {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProductCard

