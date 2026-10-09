import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { FilterSelect } from '../components/FilterSelect'
import { StatusDropdown } from '../components/StatusDropdown'
import { getCollection } from '../api/resources'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import type { Order, OrderStatus, Payment, PaymentStatus } from '../types/entities'
import { lastNDays } from '../utils/date'
import { formatCurrency, formatDateTime, sumMoney } from '../utils/format'
import {
  ORDER_STATUS_FILTERS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_FILTERS,
  paymentStatusLabel,
} from '../utils/labels'

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all')
  const initialRange = useMemo(() => lastNDays(30), [])
  const [from, setFrom] = useState(initialRange.from)
  const [to, setTo] = useState(initialRange.to)
  const isDefaultRange = from === initialRange.from && to === initialRange.to

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['payments', { from, to }],
    queryFn: () =>
      getCollection<Payment>('payments', {
        from: from || undefined,
        to: to || undefined,
      }),
  })

  // Cần danh sách đơn hàng để biết trạng thái đơn + tên khách khi đối soát thanh toán
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getCollection<Order>('orders'),
  })

  const orderMap = useMemo(() => new Map(orders.map((order) => [order.id, order])), [orders])

  // Đổi trạng thái ĐƠN HÀNG (nghiệp vụ nay thuộc quản lý thanh toán)
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: number; newStatus: Order['status'] }) =>
      apiClient.patch(`/orders/${orderId}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      success('Cập nhật trạng thái đơn hàng thành công!')
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.')
    },
  })

  const handleOrderStatusChange = async (order: Order, newStatus: Order['status']) => {
    const confirmed = await confirm({
      title: 'Xác nhận đổi trạng thái đơn hàng',
      message: `Đổi trạng thái đơn #${order.id} sang "${ORDER_STATUS_LABELS[newStatus]}"?`,
      variant: newStatus === 'cancelled' ? 'danger' : 'warning',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
    })
    if (confirmed) {
      updateOrderStatusMutation.mutate({ orderId: order.id, newStatus })
    }
  }

  const filtered = useMemo(() => {
    // Lọc 2 chiều: trạng thái THANH TOÁN (của chính giao dịch) và trạng thái ĐƠN HÀNG liên kết.
    // Hai cột này khác nhau nên trước đây dễ tưởng bộ lọc "không hoạt động".
    let result = data.filter((payment) => {
      if (statusFilter !== 'all' && payment.status !== statusFilter) return false
      if (orderStatusFilter !== 'all') {
        const order = orderMap.get(payment.orderId)
        if (order?.status !== orderStatusFilter) return false
      }
      return true
    })

    if (keyword) {
      const lower = keyword.toLowerCase().trim()
      const keywordAsNumber = Number(keyword)
      result = result.filter(
        (payment) =>
          (!isNaN(keywordAsNumber) && (payment.id === keywordAsNumber || payment.orderId === keywordAsNumber)) ||
          payment.method?.toLowerCase().includes(lower),
      )
    }

    return result
  }, [data, statusFilter, orderStatusFilter, keyword, orderMap])

  const totals = useMemo(() => {
    // amount là chuỗi (DRF Decimal) → dùng sumMoney để tránh nối chuỗi thành "NaN ₫"
    const totalAmount = sumMoney(filtered.map((payment) => payment.amount))
    const completed = filtered.filter((payment) => payment.status === 'completed').length
    return { totalAmount, completed }
  }, [filtered])

  return (
    <div className="glass-card">
      <PageHeader
        title="Thanh toán"
        description="Quản lý giao dịch, đối soát và trạng thái thanh toán đơn hàng."
      />

      <div className="stat-grid" style={{ margin: '24px 0' }}>
        <StatCard
          label={
            isDefaultRange
              ? 'Tổng giá trị thanh toán (30 ngày gần nhất)'
              : 'Tổng giá trị thanh toán (theo khoảng đã chọn)'
          }
          value={formatCurrency(totals.totalAmount)}
          icon={<CreditCard size={22} />}
        />
        <StatCard label="Giao dịch hoàn tất" value={totals.completed} />
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Tìm kiếm theo ID, mã đơn hoặc phương thức..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <div className="date-field">
          <span>Trạng thái thanh toán</span>
          <FilterSelect
            value={statusFilter}
            options={PAYMENT_STATUS_FILTERS}
            onChange={setStatusFilter}
            ariaLabel="Lọc theo trạng thái thanh toán"
            minWidth={200}
          />
        </div>
        <div className="date-field">
          <span>Trạng thái đơn hàng</span>
          <FilterSelect
            value={orderStatusFilter}
            options={ORDER_STATUS_FILTERS}
            onChange={setOrderStatusFilter}
            ariaLabel="Lọc theo trạng thái đơn hàng"
            minWidth={200}
          />
        </div>
        <label className="date-field">
          <span>Từ ngày</span>
          <input
            type="date"
            className="input"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label className="date-field">
          <span>Đến ngày</span>
          <input
            type="date"
            className="input"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <div className="range-pills">
          <button
            type="button"
            className={isDefaultRange ? 'range-pill active' : 'range-pill'}
            onClick={() => {
              const range = lastNDays(30)
              setFrom(range.from)
              setTo(range.to)
            }}
          >
            30 ngày
          </button>
          <button
            type="button"
            className={!from && !to ? 'range-pill active' : 'range-pill'}
            onClick={() => {
              setFrom('')
              setTo('')
            }}
          >
            Tất cả
          </button>
        </div>
      </div>

      <DataTable<Payment>
        data={filtered}
        columns={[
          { key: 'id', header: 'ID', align: 'right' },
          { key: 'orderId', header: 'Đơn hàng', align: 'right' },
          {
            key: 'customer',
            header: 'Khách hàng',
            render: (row) => {
              const order = orderMap.get(row.orderId)
              return order?.userName || `Khách #${order?.userId ?? '?'}`
            },
          },
          { key: 'method', header: 'Phương thức' },
          {
            key: 'amount',
            header: 'Số tiền',
            align: 'right',
            render: (row) => formatCurrency(row.amount),
          },
          {
            key: 'status',
            header: 'Trạng thái thanh toán',
            render: (row) => {
              const order = orderMap.get(row.orderId)
              // Một đơn có thể có NHIỀU lần thử thanh toán (VD: khách chọn chuyển khoản rồi bỏ,
              // sau đó trả bằng VNPay). Giao dịch khớp `order.paymentId` mới là giao dịch
              // đã dùng cho đơn → gắn nhãn 'chính' để không tưởng là dữ liệu sai.
              const isPrimary = Boolean(order && order.paymentId === row.id)
              return (
                <span className="status-cell">
                  <span
                    className={
                      row.status === 'completed'
                        ? 'tag success'
                        : row.status === 'failed'
                        ? 'tag danger'
                        : row.status === 'refunded'
                        ? 'tag info'
                        : 'tag warning'
                    }
                  >
                    {paymentStatusLabel(row.status)}
                  </span>
                  {isPrimary && (
                    <span className="tag info" title="Giao dịch được đơn hàng sử dụng">
                      chính
                    </span>
                  )}
                </span>
              )
            },
          },
          {
            key: 'orderStatus',
            header: 'Trạng thái đơn hàng',
            // Nơi DUY NHẤT đổi được trạng thái đơn hàng (trang Đơn hàng chỉ đọc)
            render: (row) => {
              const order = orderMap.get(row.orderId)
              if (!order) {
                return <span className="tag">—</span>
              }
              return (
                <StatusDropdown
                  order={order}
                  onStatusChange={handleOrderStatusChange}
                  isUpdating={updateOrderStatusMutation.isPending}
                />
              )
            },
          },
          {
            key: 'createdAt',
            header: 'Ngày thanh toán',
            render: (row) => formatDateTime(row.createdAt),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={
          keyword
            ? 'Không tìm thấy giao dịch phù hợp.'
            : from || to
            ? 'Không có giao dịch trong khoảng ngày đã chọn — thử mở rộng ngày hoặc bấm "Tất cả".'
            : 'Chưa có giao dịch thanh toán nào.'
        }
      />
      <ConfirmDialog />
    </div>
  )
}
