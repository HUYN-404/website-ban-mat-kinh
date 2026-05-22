import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ImagePlus, Package, Tag } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { ProductImageManager } from '../components/ProductImageManager'
import { useToast } from '../contexts/ToastContext'
import apiClient from '../api/client'
import type { Product } from '../types/entities'

export function ProductImagesPage() {
  const { warning } = useToast()
  const [productIdInput, setProductIdInput] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)

  // Fetch thông tin sản phẩm khi có selectedProductId
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null
      const response = await apiClient.get<{ data: Product }>(
        `/products/${selectedProductId}`,
      )
      return response.data.data
    },
    enabled: selectedProductId !== null,
  })

  const handleLoadImages = () => {
    const value = Number(productIdInput)
    if (Number.isInteger(value) && value > 0) {
      setSelectedProductId(value)
    } else {
      warning('Vui lòng nhập ID sản phẩm hợp lệ (số nguyên dương)')
    }
  }

  return (
    <div className="glass-card">
      <PageHeader
        title="Thư viện ảnh sản phẩm"
        description="Quản lý và upload ảnh cho sản phẩm. Nhập ID sản phẩm để xem và thêm ảnh."
      />

      <div className="toolbar" style={{ margin: '20px 0' }}>
        <input
          className="input"
          placeholder="Nhập ID sản phẩm (ví dụ: 1)"
          value={productIdInput}
          onChange={(event) => setProductIdInput(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleLoadImages()
            }
          }}
          style={{ maxWidth: 220 }}
        />
        <button
          className="button primary"
          type="button"
          onClick={handleLoadImages}
        >
          <ImagePlus size={16} />
          Xem ảnh
        </button>
        {selectedProductId && (
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setSelectedProductId(null)
              setProductIdInput('')
            }}
          >
            Đóng
          </button>
        )}
      </div>

      {selectedProductId === null ? (
        <div className="empty-state">
          Nhập ID sản phẩm để xem và quản lý ảnh của sản phẩm đó.
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          {isLoadingProduct ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>
              Đang tải thông tin sản phẩm...
            </div>
          ) : product ? (
            <>
              {/* Hiển thị thông tin sản phẩm */}
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <Package size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      marginBottom: '4px',
                      color: 'var(--text)',
                    }}
                  >
                    {product.name}
                  </div>
                  {product.brandName && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--muted)',
                        fontSize: '0.875rem',
                      }}
                    >
                      <Tag size={14} />
                      <span>{product.brandName}</span>
                    </div>
                  )}
                </div>
              </div>
              <ProductImageManager productId={selectedProductId} />
            </>
          ) : (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--error)',
              }}
            >
              Không tìm thấy sản phẩm với ID: {selectedProductId}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
