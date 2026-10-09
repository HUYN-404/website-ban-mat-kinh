import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarRange } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { getCollection } from '../api/resources'
import type { OrderItem, OrderStatus, Product, ReportRecord } from '../types/entities'
import { formatCurrency, formatDateTime } from '../utils/format'
import { paymentStatusLabel } from '../utils/labels'

// Trạng thái đơn được coi là "đã thanh toán" (đã thu được tiền)
const PAID_ORDER_STATUSES: OrderStatus[] = ['paid', 'shipped', 'in_transit', 'completed', 'returned']

// ISO "YYYY-MM-DD" → "dd/mm" để hiển thị trên trục biểu đồ
const formatDayLabel = (isoDay: string) => {
  const [, month, day] = isoDay.split('-')
  return `${day}/${month}`
}

// Rút gọn tiền cho trục tung (tránh nhãn quá dài)
const formatCompactCurrency = (value: number) => {
  const amount = Number(value) || 0
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} tr`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} k`
  return `${amount}`
}

const getStatusClass = (status: ReportRecord['paymentStatus']) => {
  if (status === 'completed') return 'tag success'
  if (status === 'failed') return 'tag danger'
  if (status === 'pending') return 'tag warning'
  return 'tag info'
}

export function ReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('all')

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['reports', { from, to, paymentStatus }],
    queryFn: () =>
      getCollection<ReportRecord>('reports', {
        from: from || undefined,
        to: to || undefined,
        paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus,
      }),
  })

  // Dữ liệu cho 2 biểu đồ phụ: top sản phẩm bán chạy + đơn theo trạng thái
  const { data: orderItems = [] } = useQuery({
    queryKey: ['order-items'],
    queryFn: () => getCollection<OrderItem>('order-items'),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getCollection<Product>('products'),
  })

  // Tập orderId khớp bộ lọc (data = báo cáo đã lọc theo from/to/paymentStatus)
  const filteredOrderIds = useMemo(() => new Set(data.map((row) => row.orderId)), [data])

  // Top 5 sản phẩm bán chạy — chỉ tính trong phạm vi bộ lọc
  const topProducts = useMemo(() => {
    const quantityByProduct = new Map<number, number>()
    orderItems
      .filter((item) => filteredOrderIds.has(item.orderId))
      .forEach((item) => {
        quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) || 0) + item.quantity)
      })

    const nameById = new Map(products.map((product) => [product.id, product.name]))
    const rows = Array.from(quantityByProduct.entries())
      .map(([productId, quantity]) => ({
        productId,
        quantity,
        name: nameById.get(productId) || `Sản phẩm #${productId}`,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    return { rows, max: Math.max(...rows.map((row) => row.quantity), 1) }
  }, [orderItems, products, filteredOrderIds])

  // Phân bổ đơn hàng theo trạng thái — chỉ tính trong phạm vi bộ lọc
  const ordersByStatus = useMemo(() => {
    const statusLabels: Record<OrderStatus, string> = {
      pending: 'Chờ xử lý',
      paid: 'Đã thanh toán',
      refund_requested: 'Chờ hoàn tiền',
      shipped: 'Đang giao',
      in_transit: 'Đang vận chuyển',
      completed: 'Hoàn tất',
      cancelled: 'Đã huỷ',
      refunded: 'Đã hoàn tiền',
      returned: 'Đã trả hàng',
    }

    const items = (
      [
        'pending',
        'paid',
        'refund_requested',
        'shipped',
        'in_transit',
        'completed',
        'cancelled',
        'refunded',
        'returned',
      ] as OrderStatus[]
    ).map(
      (status) => ({
        status,
        label: statusLabels[status],
        count: data.filter((row) => row.orderStatus === status).length,
      }),
    )

    return { items, total: data.length, max: Math.max(...items.map((item) => item.count), 1) }
  }, [data])

  const metrics = useMemo(() => {
    // "Đã thanh toán" = đơn đã thu được tiền (loại pending / cancelled / hoàn tiền)
    const paidRecords = data.filter((item) => PAID_ORDER_STATUSES.includes(item.orderStatus))
    const totalRevenue = paidRecords.reduce((sum, item) => sum + item.totalOrderValue, 0)
    const paidOrders = paidRecords.length
    const unpaidOrders = data.length - paidOrders
    
    // Tính toán dữ liệu cho biểu đồ doanh thu theo ngày
    const revenueByDate = paidRecords.reduce((acc, item) => {
      if (!item.orderDate) return acc
      const day = item.orderDate.slice(0, 10) // giữ ISO "YYYY-MM-DD" để tính + sắp xếp
      acc[day] = (acc[day] || 0) + item.totalOrderValue
      return acc
    }, {} as Record<string, number>)

    const chartData = Object.entries(revenueByDate)
      .sort(([a], [b]) => a.localeCompare(b)) // ISO → đúng thứ tự thời gian
      .slice(-7) // Lấy 7 ngày gần nhất
    
    const maxRevenue = Math.max(...chartData.map(([, value]) => value), 1)
    
    return {
      totalRevenue,
      paidOrders,
      unpaidOrders,
      totalOrders: data.length,
      chartData,
      maxRevenue,
    }
  }, [data])

  // Ngày hôm nay (ISO, theo giờ máy) — để tô đậm cột "hôm nay"
  const todayIso = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  return (
    <div className="glass-card">
      <PageHeader
        title="Bảng điều khiển"
        description="Xem nhanh doanh thu, tình trạng thanh toán và các đơn hàng nổi bật."
      />

      <div className="toolbar" style={{ marginTop: 24, marginBottom: 20 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Từ ngày</span>
          <input
            type="date"
            className="input"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Đến ngày</span>
          <input
            type="date"
            className="input"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Trạng thái thanh toán</span>
          <select
            className="select"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="completed">Đã thanh toán</option>
            <option value="pending">Đang xử lý</option>
            <option value="failed">Thất bại</option>
            <option value="unpaid">Chưa thanh toán</option>
          </select>
        </label>
        <button className="button secondary" type="button" onClick={() => {
          const now = new Date()
          const start = new Date(now)
          start.setDate(now.getDate() - 29)
          setFrom(start.toISOString().slice(0, 10))
          setTo(now.toISOString().slice(0, 10))
        }}>
          <CalendarRange size={16} />
          30 ngày gần nhất
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <StatCard
          label="Tổng doanh thu"
          value={formatCurrency(metrics.totalRevenue)}
          helper={`Đặt hàng trong phạm vi ${
            from ? `từ ${new Date(from).toLocaleDateString('vi-VN')}` : 'tất cả thời gian'
          }`}
        />
        <StatCard
          label="Đơn đã thanh toán"
          value={metrics.paidOrders}
          helper={`Trong tổng số ${metrics.totalOrders} đơn`}
        />
        <StatCard
          label="Đơn chưa thanh toán"
          value={metrics.unpaidOrders}
          helper="Chờ xử lý · đã huỷ · yêu cầu/đã hoàn tiền"
        />
      </div>

      {/* Biểu đồ doanh thu */}
      {metrics.chartData.length > 0 && (
        <div
          className="glass-card"
          style={{
            marginBottom: 24,
            padding: 32,
            borderRadius: 16,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 30px rgba(185, 139, 59, 0.12), 0 2px 8px rgba(138, 109, 59, 0.08)',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 4 }}>
              Doanh thu theo ngày
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0 }}>
              7 ngày gần nhất
            </p>
          </div>

          <div style={{ position: 'relative', marginTop: 24 }}>
            {/* Y-axis labels */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: 240,
                width: 50,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                paddingRight: 12,
              }}
            >
              {[100, 75, 50, 25, 0].map((percent) => (
                <span
                  key={percent}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                    textAlign: 'right',
                    transform: 'translateY(50%)',
                  }}
                >
                  {formatCompactCurrency((metrics.maxRevenue * percent) / 100)}
                </span>
              ))}
            </div>

            {/* Grid lines */}
            <div
              style={{
                position: 'absolute',
                left: 50,
                right: 0,
                top: 0,
                height: 240,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '100%',
                    height: 1,
                    background: 'var(--border)',
                    opacity: 0.3,
                  }}
                />
              ))}
            </div>

            {/* Chart bars */}
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                gap: 16,
                height: 240,
                marginLeft: 50,
                padding: '0 8px',
              }}
            >
              {metrics.chartData.map(([date, revenue], index) => {
                const height = (revenue / metrics.maxRevenue) * 100
                const isToday = date === todayIso
                
                return (
                  <div
                    key={date}
                    style={{
                      flex: 1,
                      maxWidth: 120,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      position: 'relative',
                    }}
                  >
                    {/* Tooltip on hover */}
                    <div
                      className="chart-bar-container"
                      style={{
                        width: '100%',
                        height: `${height}%`,
                        minHeight: revenue > 0 ? 8 : 0,
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        className="chart-bar"
                        style={{
                          width: '100%',
                          height: '100%',
                          background: isToday
                            ? 'linear-gradient(180deg, #f2e2b4 0%, var(--primary) 55%, #8a6d3b 100%)'
                            : 'linear-gradient(180deg, #ece0c2 0%, #c9a962 60%, #a1742f 100%)',
                          borderRadius: '8px 8px 0 0',
                          position: 'relative',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isToday
                            ? '0 6px 18px rgba(185, 139, 59, 0.45)'
                            : '0 2px 8px rgba(138, 109, 59, 0.22)',
                          animation: `slideUp 0.6s ease-out ${index * 0.1}s both`,
                        }}
                        title={`${date}: ${formatCurrency(revenue)}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scaleY(1.05) translateY(-4px)'
                          e.currentTarget.style.boxShadow = '0 10px 24px rgba(185, 139, 59, 0.55)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scaleY(1) translateY(0)'
                          e.currentTarget.style.boxShadow = isToday
                            ? '0 6px 18px rgba(185, 139, 59, 0.45)'
                            : '0 2px 8px rgba(138, 109, 59, 0.22)'
                        }}
                      >
                        {/* Value label on hover */}
                        <div
                          className="chart-value-label"
                          style={{
                            position: 'absolute',
                            top: -32,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'var(--surface)',
                            padding: '6px 10px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            border: '1px solid var(--border)',
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            pointerEvents: 'none',
                          }}
                        >
                          {formatCurrency(revenue)}
                        </div>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>

            {/* Date labels */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginLeft: 50, padding: '0 8px', marginTop: 12 }}>
              {metrics.chartData.map(([date]) => {
                const isToday = date === todayIso
                return (
                  <div key={date} style={{ flex: 1, maxWidth: 120, textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: isToday ? 600 : 400,
                        color: isToday ? 'var(--primary)' : 'var(--muted)',
                      }}
                    >
                      {formatDayLabel(date)}
                    </div>
                    {isToday && (
                      <div style={{ fontSize: '0.625rem', color: 'var(--primary)', marginTop: 2 }}>
                        Hôm nay
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}

      {/* Top sản phẩm bán chạy + Đơn theo trạng thái */}
      <div
        className="stat-grid"
        style={{ marginBottom: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
      >
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>
            Top 5 sản phẩm bán chạy
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 0, marginBottom: 18 }}>
            Tính theo tổng số lượng đã bán trong phạm vi bộ lọc
          </p>

          {topProducts.rows.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Chưa có dữ liệu bán hàng.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topProducts.rows.map((row, index) => (
                <div key={row.productId}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      fontSize: '0.85rem',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ display: 'flex', gap: 8, minWidth: 0 }}>
                      <strong style={{ color: 'var(--primary)' }}>#{index + 1}</strong>
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.name}
                      </span>
                    </span>
                    <strong>{row.quantity}</strong>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: 'var(--hover-bg)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${(row.quantity / topProducts.max) * 100}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, #e3c98a 0%, var(--primary) 60%, #8a6d3b 100%)',
                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>
            Đơn hàng theo trạng thái
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 0, marginBottom: 18 }}>
            Tổng {ordersByStatus.total} đơn hàng trong phạm vi bộ lọc
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ordersByStatus.items.map((item) => (
              <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 104, fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  {item.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    background: 'var(--hover-bg)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(item.count / ordersByStatus.max) * 100}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: 'linear-gradient(90deg, #b98b3b 0%, #8a6d3b 100%)',
                      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, width: 64, textAlign: 'right' }}>
                  {item.count} đơn
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataTable<ReportRecord>
        data={data}
        columns={[
          { key: 'orderId', header: 'Mã đơn' },
          { key: 'customerName', header: 'Khách hàng' },
          {
            key: 'orderDate',
            header: 'Ngày đặt',
            render: (row) => formatDateTime(row.orderDate),
          },
          {
            key: 'totalOrderValue',
            header: 'Giá trị đơn',
            render: (row) => formatCurrency(row.totalOrderValue),
            align: 'right',
          },
          {
            key: 'totalItems',
            header: 'Sản phẩm',
            align: 'right',
          },
          {
            key: 'paymentStatus',
            header: 'Thanh toán',
            render: (row) => (
              <span className={getStatusClass(row.paymentStatus)}>
                {row.paymentStatus ? paymentStatusLabel(row.paymentStatus) : 'Chưa thanh toán'}
              </span>
            ),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage="Không có đơn hàng nào phù hợp với bộ lọc hiện tại."
      />
    </div>
  )
}
