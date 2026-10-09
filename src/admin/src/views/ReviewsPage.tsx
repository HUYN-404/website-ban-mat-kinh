import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Search, Star, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'

// Đánh giá trả về từ /api/reviews/manage (AdminReviewSerializer)
interface AdminReview {
  id: number
  userId: number
  userName: string | null
  productId: number
  productName: string | null
  rating: number
  comment: string | null
  status: 'visible' | 'hidden'
  createdAt: string
  updatedAt: string
}

async function fetchReviews(): Promise<AdminReview[]> {
  const response = await apiClient.get<{ data: AdminReview[] }>('/reviews/manage')
  return response.data.data
}

export function ReviewsPage() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all')
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all')
  const [selected, setSelected] = useState<AdminReview | null>(null)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['reviews', 'manage'],
    queryFn: fetchReviews,
  })

  // Lọc ngay trên FE cho mượt; backend cũng lọc được (keyword/status/rating) khi cần
  const filtered = useMemo(() => {
    const lower = keyword.toLowerCase().trim()
    return data.filter((review) => {
      if (statusFilter !== 'all' && review.status !== statusFilter) return false
      if (ratingFilter !== 'all' && review.rating !== ratingFilter) return false
      if (!lower) return true
      return (
        review.comment?.toLowerCase().includes(lower) ||
        review.userName?.toLowerCase().includes(lower) ||
        review.productName?.toLowerCase().includes(lower) ||
        String(review.id) === lower
      )
    })
  }, [data, keyword, statusFilter, ratingFilter])

  const totals = useMemo(() => {
    const hidden = filtered.filter((review) => review.status === 'hidden').length
    const average =
      filtered.length > 0
        ? filtered.reduce((sum, review) => sum + review.rating, 0) / filtered.length
        : 0
    return { hidden, average }
  }, [filtered])

  const updateReview = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { status?: 'visible' | 'hidden'; comment?: string } }) =>
      apiClient.patch(`/reviews/manage/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'manage'] })
      success('Cập nhật đánh giá thành công!')
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Không thể cập nhật đánh giá.')
    },
  })

  const deleteReview = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/reviews/manage/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'manage'] })
      setSelected(null)
      success('Đã xoá đánh giá.')
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Không thể xoá đánh giá.')
    },
  })

  const handleToggleStatus = async (review: AdminReview) => {
    const willHide = review.status === 'visible'
    const confirmed = await confirm({
      title: willHide ? 'Ẩn đánh giá' : 'Hiện lại đánh giá',
      message: willHide
        ? `Ẩn đánh giá #${review.id} của "${review.userName || 'khách'}"? Đánh giá này sẽ không còn hiển thị ở trang sản phẩm.`
        : `Cho đánh giá #${review.id} hiển thị lại ở trang sản phẩm?`,
      variant: willHide ? 'warning' : 'info',
      confirmText: willHide ? 'Ẩn' : 'Hiện lại',
      cancelText: 'Hủy',
    })
    if (confirmed) {
      updateReview.mutate({ id: review.id, payload: { status: willHide ? 'hidden' : 'visible' } })
    }
  }

  const handleDelete = async (review: AdminReview) => {
    const confirmed = await confirm({
      title: 'Xoá đánh giá',
      message: `Xoá vĩnh viễn đánh giá #${review.id}? Hành động này không thể hoàn tác.`,
      variant: 'danger',
      confirmText: 'Xoá',
      cancelText: 'Hủy',
    })
    if (confirmed) {
      deleteReview.mutate(review.id)
    }
  }

  return (
    <div className="glass-card">
      <PageHeader
        title="Quản lý đánh giá"
        description="Xem, tìm kiếm, ẩn/hiện và xoá đánh giá của khách hàng."
      />

      <div className="stat-grid" style={{ margin: '24px 0' }}>
        <StatCard label="Tổng đánh giá" value={filtered.length} />
        <StatCard label="Đang bị ẩn" value={totals.hidden} />
        <StatCard label="Điểm trung bình" value={totals.average.toFixed(1)} />
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 400 }}>
          <Search size={16} />
          <input
            placeholder="Tìm theo nội dung, tên khách, tên sản phẩm hoặc mã đánh giá..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <select
          className="select"
          value={String(ratingFilter)}
          onChange={(event) =>
            setRatingFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))
          }
        >
          <option value="all">Tất cả số sao</option>
          {[5, 4, 3, 2, 1].map((star) => (
            <option key={star} value={star}>
              {star} sao
            </option>
          ))}
        </select>
        <select
          className="select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="visible">Đang hiển thị</option>
          <option value="hidden">Đang bị ẩn</option>
        </select>
      </div>

      <DataTable<AdminReview>
        data={filtered}
        columns={[
          { key: 'id', header: 'Mã', align: 'right' },
          { key: 'userName', header: 'Khách hàng', render: (row) => row.userName || `Khách #${row.userId}` },
          { key: 'productName', header: 'Sản phẩm', render: (row) => row.productName || `SP #${row.productId}` },
          {
            key: 'rating',
            header: 'Số sao',
            render: (row) => (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Star size={14} /> {row.rating}/5
              </span>
            ),
          },
          {
            key: 'comment',
            header: 'Nội dung',
            render: (row) => {
              const text = row.comment || '—'
              return text.length > 48 ? `${text.slice(0, 48)}...` : text
            },
          },
          {
            key: 'status',
            header: 'Trạng thái',
            render: (row) => (
              <span className={row.status === 'visible' ? 'tag success' : 'tag warning'}>
                {row.status === 'visible' ? 'Đang hiển thị' : 'Đang bị ẩn'}
              </span>
            ),
          },
          {
            key: 'createdAt',
            header: 'Ngày tạo',
            render: (row) => new Date(row.createdAt).toLocaleString('vi-VN'),
          },
          {
            key: 'actions',
            header: 'Thao tác',
            render: (row) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="button secondary" type="button" onClick={() => setSelected(row)}>
                  Chi tiết
                </button>
                <button className="button secondary" type="button" onClick={() => handleToggleStatus(row)}>
                  {row.status === 'visible' ? <EyeOff size={14} /> : <Eye size={14} />}
                  {row.status === 'visible' ? 'Ẩn' : 'Hiện'}
                </button>
                <button className="button danger" type="button" onClick={() => handleDelete(row)}>
                  <Trash2 size={14} /> Xoá
                </button>
              </div>
            ),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={keyword ? 'Không tìm thấy đánh giá phù hợp.' : 'Chưa có đánh giá nào.'}
      />

      {/* Xem chi tiết: hiển thị ngay dưới bảng để không cần thêm cửa sổ modal */}
      {selected && (
        <div className="glass-card" style={{ marginTop: 20, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Chi tiết đánh giá #{selected.id}</h3>
            <button className="button secondary" type="button" onClick={() => setSelected(null)}>
              Đóng
            </button>
          </div>
          <p style={{ marginTop: 12 }}>
            <strong>Khách hàng:</strong> {selected.userName || `Khách #${selected.userId}`} (mã KH:{' '}
            {selected.userId})
          </p>
          <p>
            <strong>Sản phẩm:</strong> {selected.productName || `SP #${selected.productId}`} (mã SP:{' '}
            {selected.productId})
          </p>
          <p>
            <strong>Số sao:</strong> {selected.rating}/5
          </p>
          <p>
            <strong>Nội dung:</strong> {selected.comment || '—'}
          </p>
          <p>
            <strong>Trạng thái:</strong>{' '}
            {selected.status === 'visible' ? 'Đang hiển thị' : 'Đang bị ẩn'}
          </p>
          <p>
            <strong>Ngày tạo:</strong> {new Date(selected.createdAt).toLocaleString('vi-VN')} ·{' '}
            <strong>Cập nhật:</strong> {new Date(selected.updatedAt).toLocaleString('vi-VN')}
          </p>
        </div>
      )}

      <ConfirmDialog />
    </div>
  )
}

export default ReviewsPage
