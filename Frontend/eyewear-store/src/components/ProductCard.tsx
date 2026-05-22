import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus } from 'react-icons/fi'

import type { Product } from '../data/products'
import { formatCurrency } from '../utils/formatCurrency'
import { useCartContext } from '../contexts/CartContext'

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCartContext()
  const [isAdding, setIsAdding] = useState(false)
  const isOutOfStock = (product.stockQuantity ?? 0) === 0

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

  return (
    <article className="group relative flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm shadow-black/5 transition duration-500 ease-luxury hover:-translate-y-1.5 hover:shadow-soft">
      <Link to={`/products/${product.id}`} className="relative block overflow-hidden rounded-xl">
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

        <div className="mt-auto flex items-center justify-between">
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

