import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { getCollection, getResource } from '../api/resources'
import type { Cart } from '../types/entities'

export function CartsPage() {
  const [userIdInput, setUserIdInput] = useState('')
  const [userId, setUserId] = useState<number | null>(null)

  const {
    data: activeCart,
    isLoading: loadingActive,
    error: activeError,
  } = useQuery({
    queryKey: ['cart-active', userId],
    queryFn: () => getResource<Cart>(`carts/user/${userId}/active`),
    enabled: userId !== null,
  })

  const {
    data: history = [],
    isLoading: loadingHistory,
    error: historyError,
  } = useQuery({
    queryKey: ['cart-history', userId],
    queryFn: () => getCollection<Cart>(`carts/user/${userId}/history`),
    enabled: userId !== null,
  })

  return (
    <div className="glass-card">
      <PageHeader
        title="Giỏ hàng"
        description="Theo dõi giỏ hàng hoạt động của khách hàng và lịch sử chuyển đổi."
      />

      <div className="toolbar" style={{ margin: '20px 0' }}>
        <input
          className="input"
          placeholder="Nhập user ID (ví dụ: 2)"
          value={userIdInput}
          onChange={(event) => setUserIdInput(event.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button
          className="button"
          type="button"
          onClick={() => {
            const parsed = Number(userIdInput)
            if (Number.isInteger(parsed) && parsed > 0) {
              setUserId(parsed)
            }
          }}
        >
          <ShoppingCart size={16} />
          Tải giỏ hàng
        </button>
      </div>

      {userId === null ? (
        <div className="empty-state">Nhập user ID để xem giỏ hàng tương ứng.</div>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <StatCard
              label="Giỏ đang hoạt động"
              value={activeCart ? `#${activeCart.id}` : 'Không có'}
              icon={<ShoppingCart size={22} />}
              helper={
                activeCart
                  ? `Trạng thái: ${activeCart.status}`
                  : 'Khách hàng chưa có giỏ hàng hoạt động'
              }
            />
          </div>

          {activeError instanceof Error ? (
            <div className="error-banner">{activeError.message}</div>
          ) : null}

          <DataTable<Cart>
            data={history}
            columns={[
              { key: 'id', header: 'Cart ID', align: 'right' },
              { key: 'status', header: 'Trạng thái' },
              {
                key: 'createdAt',
                header: 'Tạo vào',
                render: (row) => new Date(row.createdAt).toLocaleString('vi-VN'),
              },
              {
                key: 'updatedAt',
                header: 'Cập nhật',
                render: (row) => new Date(row.updatedAt).toLocaleString('vi-VN'),
              },
            ]}
            isLoading={loadingActive || loadingHistory}
            error={historyError instanceof Error ? historyError.message : undefined}
            emptyMessage="Người dùng chưa có lịch sử giỏ hàng."
          />
        </>
      )}
    </div>
  )
}
