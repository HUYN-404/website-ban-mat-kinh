import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarRange, Filter } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { getCollection } from '../api/resources'
import type { ReportRecord } from '../types/entities'

const formatCurrency = (value: number) =>
  `${value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`

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

  const metrics = useMemo(() => {
    const totalRevenue = data.reduce((sum, item) => sum + item.totalOrderValue, 0)
    const paidOrders = data.filter((item) => item.paymentStatus === 'completed').length
    const unpaidOrders = data.filter((item) => !item.paymentStatus).length
    
    // Tính toán dữ liệu cho biểu đồ doanh thu theo ngày
    const revenueByDate = data.reduce((acc, item) => {
      const date = new Date(item.orderDate).toLocaleDateString('vi-VN')
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += item.totalOrderValue
      return acc
    }, {} as Record<string, number>)
    
    const chartData = Object.entries(revenueByDate)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
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
        <button className="button secondary" type="button">
          <Filter size={16} />
          Bộ lọc nâng cao
        </button>
        <button className="button secondary" type="button">
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
          helper="Bao gồm đơn chưa thanh toán hoặc thất bại"
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
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
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

          <div style={{ position: 'relative', padding: '24px 0 40px 0' }}>
            {/* Y-axis labels */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 40,
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
                  {formatCurrency((metrics.maxRevenue * percent) / 100)}
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
                bottom: 40,
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
                alignItems: 'flex-end',
                gap: 16,
                height: 240,
                marginLeft: 50,
                padding: '0 8px',
              }}
            >
              {metrics.chartData.map(([date, revenue], index) => {
                const height = (revenue / metrics.maxRevenue) * 100
                const isToday = new Date(date).toDateString() === new Date().toDateString()
                
                return (
                  <div
                    key={date}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
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
                            ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)'
                            : 'linear-gradient(180deg, #10b981 0%, #059669 50%, #047857 100%)',
                          borderRadius: '8px 8px 0 0',
                          position: 'relative',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isToday
                            ? '0 4px 12px rgba(59, 130, 246, 0.4)'
                            : '0 2px 8px rgba(16, 185, 129, 0.3)',
                          animation: `slideUp 0.6s ease-out ${index * 0.1}s both`,
                        }}
                        title={`${date}: ${formatCurrency(revenue)}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scaleY(1.05) translateY(-4px)'
                          e.currentTarget.style.boxShadow = isToday
                            ? '0 8px 20px rgba(59, 130, 246, 0.5)'
                            : '0 6px 16px rgba(16, 185, 129, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scaleY(1) translateY(0)'
                          e.currentTarget.style.boxShadow = isToday
                            ? '0 4px 12px rgba(59, 130, 246, 0.4)'
                            : '0 2px 8px rgba(16, 185, 129, 0.3)'
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

                    {/* Date label */}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: isToday ? 600 : 400,
                          color: isToday ? '#3b82f6' : 'var(--muted)',
                        }}
                      >
                        {new Date(date).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </div>
                      {isToday && (
                        <div
                          style={{
                            fontSize: '0.625rem',
                            color: '#3b82f6',
                            marginTop: 2,
                          }}
                        >
                          Hôm nay
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CSS Animation */}
          <style>{`
            @keyframes slideUp {
              from {
                transform: scaleY(0);
                opacity: 0;
              }
              to {
                transform: scaleY(1);
                opacity: 1;
              }
            }
            .chart-bar-container:hover .chart-value-label {
              opacity: 1 !important;
            }
          `}</style>
        </div>
      )}

      <DataTable<ReportRecord>
        data={data}
        columns={[
          { key: 'orderId', header: 'Mã đơn' },
          { key: 'customerName', header: 'Khách hàng' },
          {
            key: 'orderDate',
            header: 'Ngày đặt',
            render: (row) => new Date(row.orderDate).toLocaleString('vi-VN'),
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
                {row.paymentStatus ?? 'Chưa thanh toán'}
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
