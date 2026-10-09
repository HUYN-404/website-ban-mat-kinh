import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ticket, Plus, Edit, Trash2, Search, Power, Ban } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { CouponForm } from '../components/CouponForm'
import { getCollection } from '../api/resources'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import type { Coupon } from '../types/entities'

const formatMoney = (value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`
const formatPercent = (value: number) => `${Number(value)}%`

const formatDate = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function CouponsPage() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [keyword, setKeyword] = useState('')
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => getCollection<Coupon>('coupons'),
  })

  const deleteMutation = useMutation({
    mutationFn: (couponId: number) => apiClient.delete(`/coupons/${couponId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      success('Xóa mã giảm giá thành công')
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || err?.message || 'Xóa mã giảm giá thất bại')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (coupon: Coupon) =>
      apiClient.put(`/coupons/${coupon.id}`, { isActive: !coupon.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      success('Cập nhật trạng thái thành công')
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || err?.message || 'Cập nhật trạng thái thất bại')
    },
  })

  const filtered = useMemo(() => {
    if (!keyword) return data
    const lower = keyword.toLowerCase().trim()
    const keywordAsNumber = Number(keyword)
    return data.filter(
      (coupon) =>
        (!isNaN(keywordAsNumber) && coupon.id === keywordAsNumber) ||
        coupon.code.toLowerCase().includes(lower),
    )
  }, [data, keyword])

  const activeCount = data.filter((c) => c.isActive).length
  const exhaustedCount = data.filter((c) => c.usageLimit != null && c.usedCount >= c.usageLimit).length

  return (
    <div className="glass-card">
      <PageHeader
        title="Mã giảm giá"
        description="Tạo và quản lý mã giảm giá cho khách hàng."
      />

      <div className="stat-grid" style={{ margin: '24px 0' }}>
        <StatCard label="Tổng mã" value={data.length} icon={<Ticket size={24} />} />
        <StatCard label="Đang hoạt động" value={activeCount} icon={<Power size={24} />} />
        <StatCard label="Đã hết lượt" value={exhaustedCount} icon={<Ban size={24} />} />
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Tìm theo mã hoặc ID..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <button
          className="button primary"
          onClick={() => {
            setSelectedCoupon(null)
            setIsFormOpen(true)
          }}
        >
          <Plus size={16} />
          Tạo mã giảm giá
        </button>
      </div>

      <DataTable<Coupon>
        data={filtered}
        columns={[
          { key: 'id', header: 'ID', align: 'right' },
          {
            key: 'code',
            header: 'Mã',
            render: (row) => <strong>{row.code}</strong>,
          },
          {
            key: 'discountType',
            header: 'Giảm giá',
            render: (row) =>
              row.discountType === 'percent' ? formatPercent(row.discountValue) : formatMoney(row.discountValue),
          },
          {
            key: 'validFrom',
            header: 'Hiệu lực',
            render: (row) => {
              if (!row.validFrom && !row.validTo) return 'Vô thời hạn'
              const from = formatDate(row.validFrom) ?? '…'
              const to = formatDate(row.validTo) ?? '∞'
              return `${from} → ${to}`
            },
          },
          {
            key: 'usedCount',
            header: 'Lượt dùng',
            align: 'right',
            render: (row) => (
              <span style={{ color: row.usageLimit != null && row.usedCount >= row.usageLimit ? 'var(--danger)' : undefined }}>
                {row.usedCount} / {row.usageLimit ?? '∞'}
              </span>
            ),
          },
          {
            key: 'isActive',
            header: 'Trạng thái',
            render: (row) => (
              <span className={row.isActive ? 'tag success' : 'tag danger'}>
                {row.isActive ? 'Hoạt động' : 'Tắt'}
              </span>
            ),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={keyword ? 'Không tìm thấy mã phù hợp.' : 'Chưa có mã giảm giá nào.'}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className="icon-button"
              onClick={() => {
                setSelectedCoupon(row)
                setIsFormOpen(true)
              }}
              title="Sửa"
            >
              <Edit size={16} />
            </button>
            <button
              className="icon-button"
              onClick={() => toggleMutation.mutate(row)}
              title={row.isActive ? 'Tắt mã' : 'Bật mã'}
              disabled={toggleMutation.isPending}
            >
              <Power size={16} />
            </button>
            <button
              className="icon-button"
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'Xác nhận xóa',
                  message: `Bạn có chắc muốn xóa mã "${row.code}"?`,
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
        title={selectedCoupon ? `Sửa mã ${selectedCoupon.code}` : 'Tạo mã giảm giá'}
        size="md"
      >
        <CouponForm
          coupon={selectedCoupon ?? undefined}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => setSelectedCoupon(null)}
        />
      </Modal>

      <ConfirmDialog />
    </div>
  )
}
