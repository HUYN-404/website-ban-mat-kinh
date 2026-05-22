import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Search, Plus, Edit, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { ProductForm } from '../components/ProductForm'
import { getCollection, getResource } from '../api/resources'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import type { Product } from '../types/entities'

const formatCurrency = (value: number) =>
  `${value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`

export function ProductsPage() {
  const queryClient = useQueryClient()
  const { success } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<'all' | 'available' | 'unavailable'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => getCollection<Product>('products'),
  })

  const { data: productDetail } = useQuery({
    queryKey: ['products', selectedProduct?.id],
    queryFn: () => getResource<Product>('products', selectedProduct!.id),
    enabled: !!selectedProduct && isDetailOpen,
  })

  const deleteMutation = useMutation({
    mutationFn: (productId: number) => apiClient.delete(`/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] }) // Đồng bộ với inventory
      success('Xóa sản phẩm thành công')
    },
  })

  const filtered = useMemo(() => {
    return data
      .filter((product) => (status === 'all' ? true : product.status === status))
      .filter((product) => {
        if (!keyword) return true
        const keywordLower = keyword.toLowerCase().trim()
        // Tìm theo ID (nếu keyword là số)
        const keywordAsNumber = Number(keyword)
        if (!isNaN(keywordAsNumber) && product.id === keywordAsNumber) {
          return true
        }
        // Tìm theo tên
        return product.name.toLowerCase().includes(keywordLower)
      })
  }, [data, status, keyword])

  const metrics = useMemo(() => {
    const total = data.length
    const available = data.filter((product) => product.status === 'available').length
    const lowStock = data.filter((product) => product.stockQuantity < 20).length
    return {
      total,
      available,
      lowStock,
    }
  }, [data])

  return (
    <div className="glass-card">
      <PageHeader
        title="Danh sách sản phẩm"
        description="Theo dõi hàng tồn, tình trạng phát hành và thông tin định giá."
      />

      <div className="stat-grid" style={{ margin: '24px 0' }}>
        <StatCard
          label="Tổng sản phẩm"
          value={metrics.total}
          icon={<Package size={22} />}
          helper={`${metrics.available} sản phẩm đang sẵn hàng`}
        />
        <StatCard label="Cảnh báo tồn kho" value={metrics.lowStock} helper="< 20 sản phẩm" />
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Tìm kiếm theo ID hoặc tên sản phẩm..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <select
          className="select"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="available">Đang bán</option>
          <option value="unavailable">Ngưng kinh doanh</option>
        </select>
        <button
          className="button primary"
          onClick={() => {
            setSelectedProduct(null)
            setIsFormOpen(true)
          }}
        >
          <Plus size={16} />
          Tạo sản phẩm
        </button>
      </div>

      <DataTable<Product>
        data={filtered}
        columns={[
          { key: 'id', header: 'ID', align: 'right' },
          { key: 'name', header: 'Tên sản phẩm' },
          { key: 'brandName', header: 'Thương hiệu' },
          { key: 'categoryName', header: 'Danh mục' },
          {
            key: 'price',
            header: 'Giá bán',
            render: (row) => formatCurrency(row.price),
            align: 'right',
          },
          {
            key: 'stockQuantity',
            header: 'Tồn kho',
            align: 'right',
            render: (row) => (
              <span className={row.stockQuantity < 20 ? 'tag warning' : 'tag info'}>
                {row.stockQuantity}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Trạng thái',
            render: (row) => (
              <span className={row.status === 'available' ? 'tag success' : 'tag danger'}>
                {row.status === 'available' ? 'Đang bán' : 'Ngưng bán'}
              </span>
            ),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage="Không tìm thấy sản phẩm phù hợp."
        onRowClick={(row) => {
          setSelectedProduct(row)
          setIsDetailOpen(true)
        }}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className="button secondary"
              style={{ minWidth: 36, padding: 8 }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedProduct(row)
                setIsFormOpen(true)
              }}
              title="Sửa"
            >
              <Edit size={16} />
            </button>
            <button
              className="button secondary"
              style={{ minWidth: 36, padding: 8 }}
              onClick={async (e) => {
                e.stopPropagation()
                const confirmed = await confirm({
                  title: 'Xác nhận xóa',
                  message: `Bạn có chắc muốn xóa sản phẩm "${row.name}"?`,
                  variant: 'danger',
                  confirmText: 'Xóa',
                  cancelText: 'Hủy',
                })
                if (confirmed) {
                  deleteMutation.mutate(row.id)
                }
              }}
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedProduct ? 'Sửa sản phẩm' : 'Tạo sản phẩm mới'}
        size="lg"
      >
        <ProductForm
          product={selectedProduct ?? undefined}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false)
            setSelectedProduct(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedProduct(null)
        }}
        title="Chi tiết sản phẩm"
        size="lg"
      >
        {productDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>ID</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {productDetail.id}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Tên sản phẩm</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {productDetail.name}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Giá bán</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {formatCurrency(productDetail.price)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Tồn kho</span>
                <p style={{ margin: '4px 0 0' }}>
                  <span
                    className={productDetail.stockQuantity < 20 ? 'tag warning' : 'tag info'}
                  >
                    {productDetail.stockQuantity}
                  </span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Trạng thái</span>
                <p style={{ margin: '4px 0 0' }}>
                  <span
                    className={
                      productDetail.status === 'available' ? 'tag success' : 'tag danger'
                    }
                  >
                    {productDetail.status === 'available' ? 'Đang bán' : 'Ngưng bán'}
                  </span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Danh mục</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {productDetail.categoryName || '-'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Thương hiệu</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {productDetail.brandName || '-'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Nhà cung cấp</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {productDetail.supplierName || '-'}
                </p>
              </div>
            </div>
            {productDetail.description && (
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Mô tả</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {productDetail.description}
                </p>
              </div>
            )}
            {productDetail.materials && productDetail.materials.length > 0 && (
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Chất liệu</span>
                <div style={{ margin: '8px 0 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {productDetail.materials.map((material, index) => (
                    <span key={index} className="tag info" style={{ margin: 0 }}>
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {productDetail.highlights && productDetail.highlights.length > 0 && (
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Điểm nổi bật</span>
                <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: '0.95rem' }}>
                  {productDetail.highlights.map((highlight, index) => (
                    <li key={index} style={{ marginBottom: 4 }}>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                className="button secondary"
                onClick={() => {
                  setIsDetailOpen(false)
                  setSelectedProduct(productDetail)
                  setIsFormOpen(true)
                }}
              >
                <Edit size={16} />
                Sửa
              </button>
              <button className="button primary" onClick={() => setIsDetailOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <div>Đang tải...          </div>
        )}
      </Modal>
      <ConfirmDialog />
    </div>
  )
}
