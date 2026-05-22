import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe2, Plus, Edit, Trash2, Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { BrandForm } from '../components/BrandForm'
import { getCollection, getResource } from '../api/resources'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import type { Brand } from '../types/entities'

export function BrandsPage() {
  const queryClient = useQueryClient()
  const { success } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [keyword, setKeyword] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getCollection<Brand>('brands'),
  })

  const { data: brandDetail } = useQuery({
    queryKey: ['brands', selectedBrand?.id],
    queryFn: () => getResource<Brand>('brands', selectedBrand!.id),
    enabled: !!selectedBrand && isDetailOpen,
  })

  const deleteMutation = useMutation({
    mutationFn: (brandId: number) => apiClient.delete(`/brands/${brandId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      success('Xóa thương hiệu thành công')
    },
  })

  const filtered = useMemo(() => {
    if (!keyword) return data
    const lower = keyword.toLowerCase().trim()
    const keywordAsNumber = Number(keyword)
    return data.filter(
      (brand) =>
        (!isNaN(keywordAsNumber) && brand.id === keywordAsNumber) ||
        brand.name.toLowerCase().includes(lower) ||
        brand.description?.toLowerCase().includes(lower) ||
        brand.country?.toLowerCase().includes(lower),
    )
  }, [data, keyword])

  return (
    <div className="glass-card">
      <PageHeader
        title="Thương hiệu hợp tác"
        description="Danh sách các đối tác eyewear cao cấp hiện diện tại SeeU Studio."
      />

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Tìm kiếm theo ID, tên, quốc gia hoặc mô tả..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <button
          className="button primary"
          onClick={() => {
            setSelectedBrand(null)
            setIsFormOpen(true)
          }}
        >
          <Plus size={16} />
          Tạo thương hiệu
        </button>
      </div>

      <DataTable<Brand>
        data={filtered}
        columns={[
          { key: 'id', header: 'ID', align: 'right' },
          {
            key: 'name',
            header: 'Thương hiệu',
            render: (row) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Globe2 size={16} />
                <span>{row.name}</span>
              </div>
            ),
          },
          { key: 'country', header: 'Quốc gia' },
          { key: 'description', header: 'Mô tả' },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={keyword ? 'Không tìm thấy thương hiệu phù hợp.' : 'Chưa có thương hiệu nào.'}
        onRowClick={(row) => {
          setSelectedBrand(row)
          setIsDetailOpen(true)
        }}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className="button secondary"
              style={{ minWidth: 36, padding: 8 }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedBrand(row)
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
                  message: `Bạn có chắc muốn xóa thương hiệu "${row.name}"?`,
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
        title={selectedBrand ? 'Sửa thương hiệu' : 'Tạo thương hiệu mới'}
      >
        <BrandForm
          brand={selectedBrand ?? undefined}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false)
            setSelectedBrand(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedBrand(null)
        }}
        title="Chi tiết thương hiệu"
        size="md"
      >
        {brandDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>ID</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>{brandDetail.id}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Tên thương hiệu</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>{brandDetail.name}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Quốc gia</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {brandDetail.country || '-'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Mô tả</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {brandDetail.description || '-'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                className="button secondary"
                onClick={() => {
                  setIsDetailOpen(false)
                  setSelectedBrand(brandDetail)
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
          <div>Đang tải...</div>
        )}
      </Modal>
      <ConfirmDialog />
    </div>
  )
}
