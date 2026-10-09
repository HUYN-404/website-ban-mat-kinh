import { useEffect, useMemo, useState } from 'react'
import { HiStar, HiOutlineStar } from 'react-icons/hi2'

import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getProductReviews, createReview, type Review } from '../services/reviews.service'

interface ProductReviewsProps {
  productId: number
}

// Component hiển thị sao (read-only)
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= rating ? (
          <HiStar key={star} className="text-gold-400" size={16} />
        ) : (
          <HiOutlineStar key={star} className="text-neutral-300" size={16} />
        )
      ))}
    </div>
  )
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { isAuthenticated, user } = useAuth()
  const { success, error } = useToast()

  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load reviews khi component mount hoặc productId thay đổi
  const loadReviews = async () => {
    setIsLoading(true)
    try {
      const data = await getProductReviews(productId)
      setReviews(data)
    } catch {
      // Lỗi đã được xử lý ở mức API, giữ list rỗng
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  // Tính điểm trung bình
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

  // Phân bố số sao 5 → 1 (index 0 = 1 sao ... index 4 = 5 sao) — phục vụ biểu đồ cột ngang
  const ratingDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    reviews.forEach((review) => {
      const index = Math.min(Math.max(review.rating, 1), 5) - 1
      counts[index] += 1
    })
    return counts
  }, [reviews])

  // Cho các thanh phân bố "mọc lên" sau khi mount (chỉ dùng transform → nhẹ)
  const [areBarsReady, setAreBarsReady] = useState(false)

  useEffect(() => {
    if (reviews.length === 0) {
      return
    }

    const timeoutId = window.setTimeout(() => setAreBarsReady(true), 80)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [reviews.length])

  // Gửi review
  const handleSubmit = async () => {
    if (rating === 0) {
      error('Vui lòng chọn số sao đánh giá')
      return
    }

    setIsSubmitting(true)
    try {
      await createReview(productId, rating, comment)
      success('Cảm ơn bạn đã đánh giá sản phẩm!')
      setRating(0)
      setComment('')
      await loadReviews()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Không thể gửi đánh giá.'
      error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Lấy chữ cái đầu cho avatar
  const getInitial = (name: string | null) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  return (
    <section className="mx-auto mt-16 max-w-6xl px-6">
      <div className="rounded-3xl border border-neutral-200/80 bg-white/80 p-8 shadow-sm shadow-black/5">
        {/* Tiêu đề + Tóm tắt */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-charcoal">Đánh giá sản phẩm</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {reviews.length > 0
                ? `${reviews.length} đánh giá từ khách hàng đã mua`
                : 'Chưa có đánh giá nào'}
            </p>
          </div>

          {reviews.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  star <= Math.round(averageRating) ? (
                    <HiStar key={star} className="text-gold-400" size={20} />
                  ) : (
                    <HiOutlineStar key={star} className="text-neutral-300" size={20} />
                  )
                ))}
              </div>
              <span className="text-lg font-semibold text-charcoal">
                {averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Biểu đồ phân bố số sao (5 → 1) */}
        {reviews.length > 0 && (
          <div className="mt-6 grid gap-6 border-t border-neutral-200/70 pt-6 sm:grid-cols-[auto,1fr] sm:items-center sm:gap-10">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-5xl font-semibold leading-none text-charcoal">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-neutral-500">/ 5</span>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution[star - 1]
                const percent = reviews.length ? Math.round((count / reviews.length) * 100) : 0

                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="flex w-10 items-center gap-1 text-xs font-medium text-neutral-500">
                      {star}
                      <HiStar className="text-gold-400" size={12} />
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <span
                        className="block h-full origin-left rounded-full bg-gold-400 transition-transform duration-700 ease-luxury"
                        style={{ transform: `scaleX(${areBarsReady ? percent / 100 : 0})` }}
                      />
                    </span>
                    <span className="w-10 text-right text-xs text-neutral-500">{percent}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Danh sách review */}
        {isLoading ? (
          <div className="mt-8 text-center text-sm text-neutral-500">Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-alabaster p-8 text-center text-sm text-neutral-500">
            Sản phẩm chưa có đánh giá. Hãy là người đầu tiên đánh giá!
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-neutral-200/60 bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-100 text-sm font-semibold text-gold-700">
                    {getInitial(review.userName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">
                      {review.userName || 'Khách hàng ẩn danh'}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-neutral-400">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-4 text-sm leading-7 text-neutral-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Form viết review */}
        {isAuthenticated ? (
          <div className="mt-8 rounded-2xl border border-gold-200 bg-champagne/40 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-charcoal">
              Viết đánh giá của bạn
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Xin chào {user?.fullName || user?.username}, hãy chia sẻ trải nghiệm của bạn.
            </p>

            {/* Chọn sao */}
            <div className="mt-4 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition hover:scale-110"
                  aria-label={`${star} sao`}
                >
                  {(hoveredStar || rating) >= star ? (
                    <HiStar className="text-gold-400" size={28} />
                  ) : (
                    <HiOutlineStar className="text-neutral-300" size={28} />
                  )}
                </button>
              ))}
              <span className="ml-2 text-sm text-neutral-500">
                {rating > 0 ? `${rating} sao` : 'Chọn số sao'}
              </span>
            </div>

            {/* Textarea comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              rows={4}
              className="mt-4 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-neutral-400 focus:border-gold-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-4 rounded-full bg-charcoal px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl bg-alabaster p-6 text-center text-sm text-neutral-500">
            Đăng nhập để viết đánh giá sản phẩm.
          </div>
        )}
      </div>
    </section>
  )
}

export default ProductReviews
