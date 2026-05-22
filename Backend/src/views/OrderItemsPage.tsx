import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { DataTable } from '../components/DataTable'
import { getCollection } from '../api/resources'
import type { OrderItem } from '../types/entities'

const formatCurrency = (value: number) =>
  `${value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`

export function OrderItemsPage() {
  const [orderIdInput, setOrderIdInput] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['order-items', selectedOrderId],
    queryFn: () => getCollection<OrderItem>(`orders/${selectedOrderId}/items`),
    enabled: selectedOrderId !== null,
  })

  return (
    <div className="glass-card">
      <PageHeader
        title="Chi tiết đơn hàng"
        description="Theo dõi danh sách sản phẩm trong từng đơn để hỗ trợ hậu kỳ và CSKH."
      />

      <div className="toolbar" style={{ margin: '20px 0' }}>
        <input
          className="input"
          placeholder="Nhập mã đơn hàng"
          value={orderIdInput}
          onChange={(event) => setOrderIdInput(event.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button
          className="button"
          type="button"
          onClick={() => {
            const parsed = Number(orderIdInput)
            if (Number.isInteger(parsed) && parsed > 0) {
              setSelectedOrderId(parsed)
            }
          }}
        >
          <ClipboardList size={16} />
          Tải chi tiết
        </button>
      </div>

      {selectedOrderId === null ? (
        <div className="empty-state">Nhập mã đơn hàng để xem danh sách sản phẩm.</div>
      ) : (
        <DataTable<OrderItem>
          data={data}
          columns={[
            { key: 'id', header: 'ID', align: 'right' },
            { key: 'productId', header: 'Mã sản phẩm', align: 'right' },
            { key: 'productName', header: 'Tên sản phẩm' },
            {
              key: 'quantity',
              header: 'Số lượng',
              align: 'right',
            },
            {
              key: 'unitPrice',
              header: 'Đơn giá',
              align: 'right',
              render: (row) => formatCurrency(row.unitPrice),
            },
            {
              key: 'subtotal',
              header: 'Thành tiền',
              align: 'right',
              render: (row) => formatCurrency(row.subtotal),
            },
          ]}
          isLoading={isLoading}
          error={error instanceof Error ? error.message : undefined}
          emptyMessage="Không tìm thấy sản phẩm trong đơn."
        />
      )}
    </div>
  )
}
