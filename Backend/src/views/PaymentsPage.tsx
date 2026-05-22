import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { getCollection } from '../api/resources'
import type { Payment } from '../types/entities'

const formatCurrency = (value: number) =>
  `${value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`

export function PaymentsPage() {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all')

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: () => getCollection<Payment>('payments'),
  })

  const filtered = useMemo(() => {
    let result = data.filter((payment) =>
      statusFilter === 'all' ? true : payment.status === statusFilter,
    )

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
  }, [data, statusFilter, keyword])

  const totals = useMemo(() => {
    const totalAmount = filtered.reduce((sum, payment) => sum + payment.amount, 0)
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
          label="Tổng giá trị thanh toán"
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
        <select
          className="select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="completed">Đã hoàn tất</option>
          <option value="failed">Thất bại</option>
        </select>
      </div>

      <DataTable<Payment>
        data={filtered}
        columns={[
          { key: 'id', header: 'ID', align: 'right' },
          { key: 'orderId', header: 'Đơn hàng', align: 'right' },
          { key: 'method', header: 'Phương thức' },
          {
            key: 'amount',
            header: 'Số tiền',
            align: 'right',
            render: (row) => formatCurrency(row.amount),
          },
          {
            key: 'status',
            header: 'Trạng thái',
            render: (row) => (
              <span
                className={
                  row.status === 'completed'
                    ? 'tag success'
                    : row.status === 'failed'
                    ? 'tag danger'
                    : 'tag warning'
                }
              >
                {row.status === 'completed'
                  ? 'Đã hoàn tất'
                  : row.status === 'failed'
                  ? 'Thất bại'
                  : 'Chờ xử lý'}
              </span>
            ),
          },
          {
            key: 'paymentDate',
            header: 'Ngày thanh toán',
            render: (row) => new Date(row.paymentDate).toLocaleString('vi-VN'),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={keyword ? 'Không tìm thấy giao dịch phù hợp.' : 'Chưa có giao dịch thanh toán nào.'}
      />
    </div>
  )
}
