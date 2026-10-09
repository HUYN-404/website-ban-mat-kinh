import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PackageCheck, Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { FilterSelect } from '../components/FilterSelect'
import { getCollection, getResource } from '../api/resources'
import type { Order, OrderStatus } from '../types/entities'
import { lastNDays } from '../utils/date'
import { formatCurrency, formatDateTime, sumMoney } from '../utils/format'
import { ORDER_STATUS_FILTERS, ORDER_STATUS_LABELS } from '../utils/labels'

export function OrdersPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<'all' | OrderStatus>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const last30 = useMemo(() => lastNDays(30), [])

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['orders', { status, from, to }],
    queryFn: () =>
      getCollection<Order>('orders', {
        status: status === 'all' ? undefined : status,
        from: from || undefined,
        to: to || undefined,
      }),
  })

  const handleRowClick = (order: Order) => {
    navigate(`/orders/${order.id}`)
  }

  const filtered = useMemo(() => {
    if (!keyword) return data
    const lower = keyword.toLowerCase().trim()
    const keywordAsNumber = Number(keyword)
    return data.filter(
      (order) =>
        (!isNaN(keywordAsNumber) && (order.id === keywordAsNumber || order.userId === keywordAsNumber)) ||
        order.userName?.toLowerCase().includes(lower),
    )
  }, [data, keyword])

  const totals = useMemo(() => {
    // totalAmount là chuỗi (DRF Decimal) → dùng sumMoney để tránh nối chuỗi thành "NaN ₫"
    const totalRevenue = sumMoney(filtered.map((order) => order.totalAmount))
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
          label={from || to ? 'Doanh thu đơn hàng (theo lọc ngày)' : 'Doanh thu đơn hàng (tất cả)'}
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
        <div className="date-field">
          <span>Trạng thái đơn</span>
          <FilterSelect
            value={status}
            options={ORDER_STATUS_FILTERS}
            onChange={setStatus}
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
            className={!from && !to ? 'range-pill active' : 'range-pill'}
            onClick={() => {
              setFrom('')
              setTo('')
            }}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={from === last30.from && to === last30.to ? 'range-pill active' : 'range-pill'}
            onClick={() => {
              setFrom(last30.from)
              setTo(last30.to)
            }}
          >
            30 ngày
          </button>
        </div>
      </div>

      <DataTable<Order>
        data={filtered}
        columns={[
          { key: 'id', header: 'Mã đơn', align: 'right' },
          { key: 'userId', header: 'Mã KH', align: 'right' },
          { key: 'userName', header: 'Khách hàng', render: (row) => row.userName || `Khách #${row.userId}` },
          {
            key: 'totalAmount',
            header: 'Giá trị',
            render: (row) => formatCurrency(row.totalAmount),
            align: 'right',
          },
          {
            key: 'status',
            header: 'Trạng thái',
            // Đơn hàng chỉ ĐỌC trạng thái — việc đổi trạng thái đã chuyển sang trang Thanh toán
            render: (row) => (
              <span
                className={
                  row.status === 'completed'
                    ? 'tag success'
                    : row.status === 'cancelled' || row.status === 'returned'
                    ? 'tag danger'
                    : row.status === 'refunded'
                    ? 'tag info'
                    : 'tag warning'
                }
              >
                {ORDER_STATUS_LABELS[row.status] ?? row.status}
              </span>
            ),
          },
          {
            key: 'createdAt',
            header: 'Ngày tạo',
            render: (row) => formatDateTime(row.createdAt),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={keyword ? 'Không tìm thấy đơn hàng phù hợp.' : 'Không có đơn hàng nào.'}
        onRowClick={handleRowClick}
      />
    </div>
  )
}
