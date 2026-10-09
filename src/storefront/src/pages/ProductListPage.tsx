import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiChevronDown, FiHeart } from 'react-icons/fi'

import PageHeader from '../components/PageHeader'
import ProductCard from '../components/ProductCard'
import ProductCardSkeleton from '../components/ProductCardSkeleton'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import type { ProductCategory } from '../data/products'
import { useProducts, useCategories } from '../services/products.service'
import { useWishlist } from '../contexts/WishlistContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

interface ProductListPageProps {
  eyebrow?: string
  title: string
  description?: string
  filter?: {
    category?: ProductCategory
  }
}

// Kiểu lựa chọn bộ lọc: category (eyewear/accessory hoặc id), all, hoặc wishlist
type FilterValue = ProductCategory | 'all' | 'wishlist' | number


const ProductListPage = ({ eyebrow, title, description, filter }: ProductListPageProps) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<FilterValue>(
    filter?.category ?? 'all',
  )
  const rawSearchKeyword = searchParams.get('search')?.trim() ?? ''

  const { isAuthenticated } = useAuth()
  const { wishlist } = useWishlist()
  const { error } = useToast()

  // Lấy danh sách categories động từ API
  const { data: categories = [] } = useCategories()

  // Chỉ gọi filter categoryId khi cần (chọn category con theo id, hoặc accessory)
  const categoryId = useMemo(() => {
    // Nếu chọn 1 category con cụ thể (theo id) → truyền id
    if (typeof selectedCategory === 'number') {
      return selectedCategory
    }
    if (filter?.category === 'accessory' || selectedCategory === 'accessory') {
      return categories.find((c) => c.type === 'accessory')?.id
    }
    return undefined // 'all', 'eyewear' hoặc 'wishlist' = lấy tất cả (sẽ filter ở FE)
  }, [categories, filter?.category, selectedCategory])

  // Khi chọn "Yêu thích" → fetch tất cả (kể cả hết hàng) để hiển thị đủ wishlist
  const isWishlist = selectedCategory === 'wishlist'

  // Fetch products từ API
  const { data: allProducts = [], isLoading, error: productsError } = useProducts({
    categoryId: categoryId,
    status: 'available',
    search: rawSearchKeyword || undefined,
    includeUnavailable: isWishlist, // Yêu thích cần hiện cả sản phẩm hết hàng
  })

  // Wishlist IDs để lọc
  const wishlistIds = useMemo(
    () => new Set(wishlist.map((item) => item.productId)),
    [wishlist],
  )

  // Filter products theo category hoặc wishlist
  const products = useMemo(() => {
    // Nếu chọn "Yêu thích" → chỉ lấy sản phẩm có trong wishlist
    if (isWishlist) {
      return allProducts.filter((p) => wishlistIds.has(Number(p.id)))
    }
    // Nếu chọn category con cụ thể (theo id) → backend đã lọc, dùng thẳng
    if (typeof selectedCategory === 'number') {
      return allProducts
    }
    // Trang /phu-kien → hiện phụ kiện
    if (filter?.category === 'accessory' || selectedCategory === 'accessory') {
      return allProducts.filter((p) => p.category === 'accessory')
    }
    // Mặc định (Tất cả / Kính mắt) → chỉ hiện KÍNH, loại bỏ phụ kiện
    return allProducts.filter((p) => p.category === 'eyewear')
  }, [allProducts, filter?.category, selectedCategory, isWishlist, wishlistIds])

  const filteredProducts = useMemo(() => {
    if (!products.length) return []

    return products.filter((product) => {
      // Filter theo category (category con theo id → backend đã lọc, không cần ở đây)
      const matchCategory =
        typeof selectedCategory === 'number'
          ? true
          : selectedCategory === 'all' || selectedCategory === 'wishlist'
            ? true
            : product.category === selectedCategory
      const baseCategory = filter?.category ? product.category === filter.category : true

      // Tìm kiếm đã do BACKEND xử lý (bỏ dấu + FULLTEXT) → FE không cần lọc lại
      return matchCategory && baseCategory
    })
  }, [products, filter?.category, selectedCategory])

  const handleCategoryChange = (value: FilterValue) => {
    if (value === 'wishlist' && !isAuthenticated) {
      error('Vui lòng đăng nhập để xem sản phẩm yêu thích.')
      return
    }
    setSelectedCategory(value)
    setIsDropdownOpen(false)
  }

  // State & logic cho custom dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lấy label hiển thị cho lựa chọn hiện tại
  const selectedLabel = useMemo(() => {
    if (selectedCategory === 'wishlist') return 'Yêu thích'
    if (selectedCategory === 'accessory') return 'Phụ kiện'
    if (selectedCategory === 'all') return 'Tất cả'
    if (typeof selectedCategory === 'number') {
      const cat = categories.find((c) => c.id === selectedCategory)
      return cat ? cat.name : 'Tất cả'
    }
    return 'Tất cả'
  }, [selectedCategory, categories])

  // Danh sách option động
  const dropdownOptions = useMemo(() => {
    const options: { label: string; value: FilterValue }[] = []
    // Eyewear categories
    categories
      .filter((c) => c.type === 'eyewear')
      .forEach((c) => options.push({ label: c.name, value: c.id }))
    // Phụ kiện (chỉ khi trang /phu-kien)
    if (filter?.category === 'accessory') {
      options.push({ label: 'Phụ kiện', value: 'accessory' })
    }
    return options
  }, [categories, filter?.category])

  return (
    <div className="pb-20">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <section className="mx-auto mt-10 max-w-6xl px-6">
        <div className="flex flex-col gap-6 rounded-3xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm shadow-black/5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-neutral-500">Bộ lọc</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Chọn phân loại để tìm nhanh mẫu kính phù hợp phong cách của bạn.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
                Phân loại
              </span>
              <div className="relative" ref={dropdownRef}>
                {/* Nút bấm hiển thị lựa chọn */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex h-11 min-w-[220px] items-center justify-between gap-3 rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition duration-300 ease-luxury hover:border-neutral-400 focus:border-gold-400 focus:outline-none"
                >
                  <span className="truncate">{selectedLabel}</span>
                  <FiChevronDown
                    size={16}
                    className={`flex-none text-neutral-500 transition duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Menu dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-soft">
                    {/* Tất cả */}
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('all')}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition duration-200 ease-luxury ${
                        selectedCategory === 'all'
                          ? 'bg-alabaster font-semibold text-charcoal'
                          : 'text-neutral-600 hover:bg-alabaster'
                      }`}
                    >
                      Tất cả
                      {selectedCategory === 'all' && <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />}
                    </button>

                    {/* Category động (eyewear) */}
                    {dropdownOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleCategoryChange(option.value)}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition duration-200 ease-luxury ${
                          selectedCategory === option.value
                            ? 'bg-alabaster font-semibold text-charcoal'
                            : 'text-neutral-600 hover:bg-alabaster'
                        }`}
                      >
                        {option.label}
                        {selectedCategory === option.value && (
                          <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                        )}
                      </button>
                    ))}

                    {/* Đường kẻ ngăn cách */}
                    <div className="my-1 h-px bg-neutral-200" />

                    {/* Yêu thích — cuối */}
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('wishlist')}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition duration-200 ease-luxury ${
                        selectedCategory === 'wishlist'
                          ? 'bg-alabaster font-semibold text-charcoal'
                          : 'text-neutral-600 hover:bg-alabaster'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <FiHeart size={14} className="text-gold-500" />
                        Yêu thích
                      </span>
                      {selectedCategory === 'wishlist' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {rawSearchKeyword && (
          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-neutral-200/80 bg-neutral-50 px-6 py-5 text-sm text-neutral-600 shadow-sm shadow-black/5 md:flex-row md:items-center md:justify-between">
            <p>
              Kết quả cho từ khóa{' '}
              <span className="font-semibold text-charcoal">"{rawSearchKeyword}"</span>{' '}
              {isLoading
                ? 'đang tải...'
                : filteredProducts.length
                  ? `(${filteredProducts.length} sản phẩm phù hợp)`
                  : 'không tìm thấy sản phẩm phù hợp.'}
            </p>
            <Link
              to={filter?.category === 'accessory' ? '/phu-kien' : '/products'}
              className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500 transition hover:text-charcoal"
            >
              Xóa tìm kiếm
            </Link>
          </div>
        )}

        <div className="mt-14 space-y-10">
          <Reveal>
            <SectionHeading
              eyebrow="Sắp xếp tinh tế"
              title="Danh sách sản phẩm"
              description="Mỗi sản phẩm là một câu chuyện về chất liệu cao cấp, phom dáng chuẩn và công nghệ bảo vệ thị lực hiện đại."
            />
          </Reveal>

          {isLoading ? (
            <div
              className="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
              aria-busy="true"
              aria-label="Đang tải sản phẩm"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : productsError ? (
            <Reveal>
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-red-300 bg-red-50/60 p-16 text-center">
                <h4 className="text-xl font-semibold text-red-600">Lỗi tải sản phẩm</h4>
                <p className="max-w-md text-sm leading-7 text-red-600">
                  Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.
                </p>
              </div>
            </Reveal>
          ) : filteredProducts.length ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product, index) => (
                <Reveal key={product.id} delay={(index % 3) * 90}>
                  <ProductCard product={product} tilt />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-neutral-300 bg-white/60 p-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-alabaster text-gold-500">
                  <FiHeart size={22} />
                </span>
                <h4 className="text-xl font-semibold text-charcoal">Không tìm thấy sản phẩm phù hợp</h4>
                <p className="max-w-md text-sm leading-7 text-neutral-600">
                  Vui lòng thử lại với lựa chọn khác hoặc liên hệ với SeeU Studio để được tư vấn mẫu kính riêng dành cho bạn.
                </p>
                {/* Xoá bộ lọc: trả về "Tất cả" (trang phụ kiện giữ nguyên phụ kiện) + bỏ từ khoá tìm kiếm */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(filter?.category === 'accessory' ? 'accessory' : 'all')
                      setIsDropdownOpen(false)
                      if (rawSearchKeyword) {
                        navigate(filter?.category === 'accessory' ? '/phu-kien' : '/products')
                      }
                    }}
                    className="rounded-full border border-neutral-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-900 transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white"
                  >
                    Xoá bộ lọc
                  </button>
                  <Link
                    to="/"
                    className="rounded-full border border-neutral-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500 transition duration-300 ease-luxury hover:-translate-y-0.5 hover:border-neutral-900 hover:text-neutral-900"
                  >
                    Về trang chủ
                  </Link>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </div>
  )
}

export default ProductListPage

