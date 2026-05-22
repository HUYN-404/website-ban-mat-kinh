import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layers, Plus, Edit, Trash2, Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { CategoryForm } from '../components/CategoryForm'
import { getCollection, getResource } from '../api/resources'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import type { Category } from '../types/entities'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const { success } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [keyword, setKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCollection<Category>('categories'),
  })

  const { data: categoryDetail } = useQuery({
    queryKey: ['categories', selectedCategory?.id],
    queryFn: () => getResource<Category>('categories', selectedCategory!.id),
    enabled: !!selectedCategory && isDetailOpen,
  })

  const deleteMutation = useMutation({
    mutationFn: (categoryId: number) => apiClient.delete(`/categories/${categoryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      success('Xóa danh mục thành công')
    },
  })

  const rootCategories = data.filter((category) => !category.parentId).length

  const filtered = useMemo(() => {
    if (!keyword) return data
    const lower = keyword.toLowerCase().trim()
    const keywordAsNumber = Number(keyword)
    return data.filter(
      (category) =>
        (!isNaN(keywordAsNumber) && category.id === keywordAsNumber) ||
        category.name.toLowerCase().includes(lower) ||
        category.description?.toLowerCase().includes(lower) ||
        category.parentName?.toLowerCase().includes(lower),
    )
  }, [data, keyword])

  return (
    <div className="glass-card">
      <PageHeader
        title="Danh mục sản phẩm"
        description="Cấu trúc phân loại giúp khách hàng khám phá bộ sưu tập nhanh chóng."
      />

      <div className="stat-grid" style={{ margin: '24px 0' }}>
        <StatCard
          label="Tổng danh mục"
          value={data.length}
          icon={<Layers size={24} />}
          helper={`${rootCategories} danh mục gốc`}
        />
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Tìm kiếm theo ID, tên hoặc mô tả..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <button
          className="button primary"
          onClick={() => {
            setSelectedCategory(null)
            setIsFormOpen(true)
          }}
        >
          <Plus size={16} />
          Tạo danh mục
        </button>
      </div>

      <DataTable<Category>
        data={filtered}
        columns={[
          { key: 'id', header: 'ID', align: 'right' },
          { key: 'name', header: 'Tên danh mục' },
          { key: 'parentName', header: 'Danh mục cha' },
          { key: 'description', header: 'Mô tả' },
          {
            key: 'createdAt',
            header: 'Ngày tạo',
            render: (row) => new Date(row.createdAt).toLocaleDateString('vi-VN'),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={keyword ? 'Không tìm thấy danh mục phù hợp.' : 'Chưa có danh mục nào.'}
        onRowClick={(row) => {
          setSelectedCategory(row)
          setIsDetailOpen(true)
        }}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className="button secondary"
              style={{ minWidth: 36, padding: 8 }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedCategory(row)
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
                  message: `Bạn có chắc muốn xóa danh mục "${row.name}"?`,
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
        title={selectedCategory ? 'Sửa danh mục' : 'Tạo danh mục mới'}
      >
        <CategoryForm
          category={selectedCategory ?? undefined}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false)
            setSelectedCategory(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedCategory(null)
        }}
        title="Chi tiết danh mục"
        size="md"
      >
        {categoryDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>ID</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {categoryDetail.id}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Tên danh mục</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {categoryDetail.name}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Danh mục cha</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {categoryDetail.parentName || '-'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Mô tả</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {categoryDetail.description || '-'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                className="button secondary"
                onClick={() => {
                  setIsDetailOpen(false)
                  setSelectedCategory(categoryDetail)
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
