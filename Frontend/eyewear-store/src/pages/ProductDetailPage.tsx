import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import ProductCard from '../components/ProductCard'
import SectionHeading from '../components/SectionHeading'
import ImageViewer from '../components/ImageViewer'
import { useProduct, useProducts } from '../services/products.service'
import { formatCurrency } from '../utils/formatCurrency'
import { useCartContext } from '../contexts/CartContext'
import NotFoundPage from './NotFoundPage'

const ProductDetailPage = () => {
  const { productId } = useParams()
  const { data: product, isLoading, error } = useProduct(productId || '')
  const [activeImage, setActiveImage] = useState<string>('')
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0)
  const { addToCart } = useCartContext()
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const isOutOfStock = (product?.stockQuantity ?? 0) === 0
  const maxQuantity = Math.min(product?.stockQuantity ?? 1, 10) // Giới hạn tối đa 10 hoặc stockQuantity

  // Fetch related products (cùng category)
  const { data: allProducts = [] } = useProducts({
    status: 'available',
  })
  
  const relatedProducts = useMemo(() => {
    if (!product) return []
    return allProducts
      .filter((item) => item.id !== product.id && item.category === product.category)
      .slice(0, 3)
  }, [product, allProducts])

  // Update active image when product changes
  useEffect(() => {
    if (product && product.images.length > 0) {
      setActiveImage(product.images[0])
    }
  }, [product])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-charcoal">Đang tải sản phẩm...</h2>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return <NotFoundPage />
  }

  const handleAddToCart = async () => {
    if (isOutOfStock) return
    
    setIsAdding(true)
    try {
      await addToCart(Number(product.id), quantity)
      // Có thể thêm toast notification ở đây
    } catch (error) {
      // Error đã được xử lý trong addToCart
    } finally {
      setIsAdding(false)
    }
  }


  return (
    <div className="pb-24">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <button
              type="button"
              onClick={() => {
                const index = product.images.findIndex((img) => img === (activeImage || product.images[0]))
                setViewerInitialIndex(index >= 0 ? index : 0)
                setIsImageViewerOpen(true)
              }}
              className="relative w-full overflow-hidden rounded-[32px] border border-neutral-200/80 bg-alabaster transition duration-300 ease-luxury hover:scale-[1.02]"
            >
              <img
                src={activeImage || product.images[0]}
                alt={product.name}
                className="w-full object-cover transition duration-[1500ms] ease-luxury"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition hover:opacity-100">
                <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-charcoal backdrop-blur-sm">
                  Click để xem toàn màn hình
                </div>
              </div>
            </button>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => {
                    setActiveImage(image)
                    setViewerInitialIndex(index)
                    setIsImageViewerOpen(true)
                  }}
                  className={`overflow-hidden rounded-2xl border transition duration-300 ease-luxury hover:-translate-y-1 hover:shadow-soft cursor-pointer ${
                    activeImage === image ? 'border-gold-400' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt={`${product.name} góc chụp ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-[0.4em] text-gold-500">{product.brand}</span>
              <h1 className="text-4xl font-semibold text-charcoal">{product.name}</h1>
              <p className="text-sm uppercase tracking-[0.35em] text-neutral-500">{product.colorway}</p>
            </div>

            <p className="text-base leading-8 text-neutral-600">{product.description}</p>

            <div className="space-y-4 rounded-3xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm shadow-black/5">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Chất liệu</span>
              <ul className="grid gap-4 text-sm text-neutral-600 sm:grid-cols-2">
                {product.materials.map((material) => (
                  <li key={material} className="rounded-2xl bg-alabaster px-4 py-3">
                    {material}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
                Điểm nổi bật
              </span>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-neutral-600">
                {product.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3">
                    <span className="mt-1 inline-block h-1 w-6 flex-none rounded-full bg-gold-400" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Giá bán</span>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <span className="text-3xl font-semibold text-charcoal">{formatCurrency(product.price)}</span>
                {isOutOfStock ? (
                  <div className="flex items-center gap-4">
                    <span className="rounded-full border border-red-300 bg-red-50 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-red-600">
                      Hết hàng
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-neutral-600 hover:text-charcoal"
                        disabled={quantity <= 1}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                        className="text-neutral-600 hover:text-charcoal"
                        disabled={quantity >= maxQuantity}
                      >
                        +
                      </button>
                    </div>
                    {product.stockQuantity && product.stockQuantity < 10 && (
                      <span className="text-xs text-neutral-500">
                        Còn {product.stockQuantity} sản phẩm
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isAdding}
                      className="rounded-full bg-charcoal px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-6 text-sm leading-7 text-neutral-600">
              <p>
                <span className="font-semibold text-charcoal">Bảo hành 24 tháng:</span> bao gồm chỉnh sửa dáng gọng, làm sạch và đánh bóng miễn phí.
              </p>
              <p className="mt-3">
                <span className="font-semibold text-charcoal">Thời gian đặt kính:</span> 3 – 5 ngày làm việc đối với kính cận, 1 – 2 ngày đối với kính mát.
              </p>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length ? (
        <section className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Gợi ý đi kèm"
            title="Có thể bạn sẽ yêu thích"
            description="Những thiết kế mang ngôn ngữ thẩm mỹ tương đồng, giúp hoàn thiện phong cách của bạn."
          />
          <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <ImageViewer
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        images={product.images}
        initialIndex={viewerInitialIndex}
        productName={product.name}
      />
    </div>
  )
}

export default ProductDetailPage


