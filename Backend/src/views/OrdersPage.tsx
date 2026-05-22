import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PackageCheck, Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { StatusDropdown } from '../components/StatusDropdown'
import { getCollection, getResource } from '../api/resources'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import type { Order } from '../types/entities'

const formatCurrency = (value: number) =>
  `${value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`

export function OrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<'all' | Order['status']>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['orders', { status, from, to }],
    queryFn: () =>
      getCollection<Order>('orders', {
        status: status === 'all' ? undefined : status,
        from: from || undefined,
        to: to || undefined,
      }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: number; newStatus: Order['status'] }) =>
      apiClient.patch(`/orders/${orderId}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      success('Cập nhật trạng thái đơn hàng thành công!')
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.')
    },
  })

  const handleRowClick = (order: Order) => {
    navigate(`/orders/${order.id}`)
  }

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    const statusLabels: Record<Order['status'], string> = {
      pending: 'Chờ xử lý',
      paid: 'Đã thanh toán',
      shipped: 'Đang giao',
      completed: 'Hoàn tất',
      cancelled: 'Đã hủy',
    }
    const confirmed = await confirm({
      title: 'Xác nhận đổi trạng thái',
      message: `Bạn có chắc muốn đổi trạng thái đơn hàng #${order.id} sang "${statusLabels[newStatus]}"?`,
      variant: newStatus === 'cancelled' ? 'danger' : 'warning',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
    })
    if (confirmed) {
      updateStatusMutation.mutate({ orderId: order.id, newStatus })
    }
  }

  const filtered = useMemo(() => {
    if (!keyword) return data
    const lower = keyword.toLowerCase().trim()
    const keywordAsNumber = Number(keyword)
    return data.filter(
      (order) =>
        (!isNaN(keywordAsNumber) && order.id === keywordAsNumber) ||
        order.userName?.toLowerCase().includes(lower),
    )
  }, [data, keyword])

  const totals = useMemo(() => {
    const totalRevenue = filtered.reduce((sum, order) => sum + order.totalAmount, 0)
    const cancelled = filtered.filter((order) => order.status === 'cancelled').length
    const paid = filtered.filter((order) => order.status === 'paid').length
    return { totalRevenue, cancelled, paid }
  }, [filtered])

  return (
    <div className="glass-card">
      <PageHeader
        title="Đơn hàng"
        description="Danh sách đơn hàng SeeU cùng tình trạng thực hiện và thanh toán."
      />

      <div className="stat-grid" style={{ margin: '24px 0' }}>
        <StatCard
          label="Doanh thu đơn hàng"
          value={formatCurrency(totals.totalRevenue)}
          icon={<PackageCheck size={22} />}
        />
        <StatCard label="Đơn đã thanh toán" value={totals.paid} />
        <StatCard label="Đơn bị hủy" value={totals.cancelled} />
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Tìm kiếm theo ID đơn hoặc tên khách hàng..."
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
          <option value="pending">Chờ xử lý</option>
          <option value="paid">Đã thanh toán</option>
          <option value="shipped">Đang giao</option>
          <option value="completed">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <input
          type="date"
          className="input"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <input
          type="date"
          className="input"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </div>

      <DataTable<Order>
        data={filtered}
        columns={[
          { key: 'id', header: 'Mã đơn', align: 'right' },
          { key: 'userName', header: 'Khách hàng' },
          {
            key: 'totalAmount',
            header: 'Giá trị',
            render: (row) => formatCurrency(row.totalAmount),
            align: 'right',
          },
          {
            key: 'status',
            header: 'Trạng thái',
            render: (row) => (
              <div onClick={(e) => e.stopPropagation()}>
                <StatusDropdown
                  order={row}
                  onStatusChange={handleStatusChange}
                  isUpdating={updateStatusMutation.isPending}
                />
              </div>
            ),
          },
          {
            key: 'createdAt',
            header: 'Ngày tạo',
            render: (row) => new Date(row.createdAt).toLocaleString('vi-VN'),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={keyword ? 'Không tìm thấy đơn hàng phù hợp.' : 'Không có đơn hàng nào.'}
        onRowClick={handleRowClick}
      />
      <ConfirmDialog />
    </div>
  )
}
