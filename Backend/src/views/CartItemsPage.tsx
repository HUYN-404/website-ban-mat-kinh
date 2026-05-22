import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { DataTable } from '../components/DataTable'
import { getCollection } from '../api/resources'
import type { CartItem } from '../types/entities'

const formatCurrency = (value: number) =>
  `${value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`

export function CartItemsPage() {
  const [cartIdInput, setCartIdInput] = useState('')
  const [cartId, setCartId] = useState<number | null>(null)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['cart-items', cartId],
    queryFn: () => getCollection<CartItem>(`carts/${cartId}/items`),
    enabled: cartId !== null,
  })

  return (
    <div className="glass-card">
      <PageHeader
        title="Sản phẩm trong giỏ"
        description="Kiểm tra các sản phẩm khách đang giữ để hỗ trợ tư vấn cá nhân hóa."
      />

      <div className="toolbar" style={{ margin: '20px 0' }}>
        <input
          className="input"
          placeholder="Nhập mã giỏ hàng"
          value={cartIdInput}
          onChange={(event) => setCartIdInput(event.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button
          className="button"
          type="button"
          onClick={() => {
            const parsed = Number(cartIdInput)
            if (Number.isInteger(parsed) && parsed > 0) {
              setCartId(parsed)
            }
          }}
        >
          <ShoppingBag size={16} />
          Xem sản phẩm
        </button>
      </div>

      {cartId === null ? (
        <div className="empty-state">Nhập mã giỏ hàng để xem chi tiết.</div>
      ) : (
        <DataTable<CartItem>
          data={data}
          columns={[
            { key: 'id', header: 'ID', align: 'right' },
            { key: 'productId', header: 'Sản phẩm', align: 'right' },
            { key: 'productName', header: 'Tên sản phẩm' },
            { key: 'quantity', header: 'Số lượng', align: 'right' },
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
          emptyMessage="Giỏ hàng hiện chưa có sản phẩm."
        />
      )}
    </div>
  )
}
