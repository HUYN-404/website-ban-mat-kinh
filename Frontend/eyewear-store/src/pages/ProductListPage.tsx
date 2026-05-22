import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import PageHeader from '../components/PageHeader'
import ProductCard from '../components/ProductCard'
import SectionHeading from '../components/SectionHeading'
import type { ProductCategory } from '../data/products'
import { useProducts } from '../services/products.service'
import normalizeSearchText from '../utils/normalizeSearchText'

interface ProductListPageProps {
  eyebrow?: string
  title: string
  description?: string
  filter?: {
    category?: ProductCategory
  }
}

const categories: { label: string; value: ProductCategory | 'all' }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Kính mắt', value: 'eyewear' },
  { label: 'Phụ kiện', value: 'accessory' },
]


const ProductListPage = ({ eyebrow, title, description, filter }: ProductListPageProps) => {
  const [searchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>(
    filter?.category ?? 'all',
  )
  const rawSearchKeyword = searchParams.get('search')?.trim() ?? ''
  const normalizedSearchKeyword = normalizeSearchText(rawSearchKeyword)

  // Map category filter sang categoryId
  // categoryId 5 = Accessories, còn lại = Products (eyewear)
  const categoryId = useMemo(() => {
    if (filter?.category === 'accessory') return 5
    if (selectedCategory === 'accessory') return 5
    return undefined // 'all' hoặc 'eyewear' = lấy tất cả (sẽ filter ở FE)
  }, [filter?.category, selectedCategory])

  // Fetch products từ API
  const { data: allProducts = [], isLoading, error } = useProducts({
    categoryId: categoryId, // Chỉ filter khi chọn accessory
    status: 'available',
    search: rawSearchKeyword || undefined,
  })

  // Filter products theo category (nếu chọn eyewear thì loại bỏ categoryId 5)
  const products = useMemo(() => {
    if (filter?.category === 'eyewear' || selectedCategory === 'eyewear') {
      return allProducts.filter((p) => p.category === 'eyewear')
    }
    return allProducts
  }, [allProducts, filter?.category, selectedCategory])

  const filteredProducts = useMemo(() => {
    if (!products.length) return []
    
    return products.filter((product) => {
      // Filter theo category
      const matchCategory =
        selectedCategory === 'all' ? true : product.category === selectedCategory
      const baseCategory = filter?.category ? product.category === filter.category : true
      
      // Search đã được xử lý ở API, nhưng có thể filter thêm ở FE nếu cần
      const haystack = normalizeSearchText(
        `${product.name} ${product.brand} ${product.colorway} ${product.description}`,
      )
      const matchSearch = normalizedSearchKeyword ? haystack.includes(normalizedSearchKeyword) : true
      
      return matchCategory && baseCategory && matchSearch
    })
  }, [products, filter?.category, normalizedSearchKeyword, selectedCategory])

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as ProductCategory | 'all'
    setSelectedCategory(value)
  }

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
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
              Phân loại
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="h-11 rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition focus:border-gold-400 focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
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
          <SectionHeading
            eyebrow="Sắp xếp tinh tế"
            title="Danh sách sản phẩm"
            description="Mỗi sản phẩm là một câu chuyện về chất liệu cao cấp, phom dáng chuẩn và công nghệ bảo vệ thị lực hiện đại."
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-neutral-300 bg-white/60 p-16 text-center">
              <h4 className="text-xl font-semibold text-charcoal">Đang tải sản phẩm...</h4>
              <p className="max-w-md text-sm leading-7 text-neutral-600">
                Vui lòng đợi trong giây lát.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-red-300 bg-red-50/60 p-16 text-center">
              <h4 className="text-xl font-semibold text-red-600">Lỗi tải sản phẩm</h4>
              <p className="max-w-md text-sm leading-7 text-red-600">
                Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.
              </p>
            </div>
          ) : filteredProducts.length ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-neutral-300 bg-white/60 p-16 text-center">
              <h4 className="text-xl font-semibold text-charcoal">Không tìm thấy sản phẩm phù hợp</h4>
              <p className="max-w-md text-sm leading-7 text-neutral-600">
                Vui lòng thử lại với lựa chọn khác hoặc liên hệ với SeeU Studio để được tư vấn mẫu kính riêng dành cho bạn.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ProductListPage

