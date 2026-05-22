import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { HiCalendar, HiShoppingBag } from 'react-icons/hi2'

import { useAuth } from '../contexts/AuthContext'
import { getUserOrders } from '../services/orders.service'

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Chờ xử lý',
    paid: 'Đã thanh toán',
    shipped: 'Đang giao hàng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const OrdersPage = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: () => getUserOrders(user!.id),
    enabled: isAuthenticated && !!user?.id,
  })

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-charcoal">Vui lòng đăng nhập</h1>
          <p className="mt-4 text-neutral-600">Bạn cần đăng nhập để xem đơn hàng của mình.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-charcoal">Đang tải đơn hàng...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-charcoal">Có lỗi xảy ra</h1>
          <p className="mt-4 text-red-600">{error instanceof Error ? error.message : 'Không thể tải đơn hàng'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold text-charcoal">Đơn hàng của tôi</h1>
        <p className="mt-2 text-neutral-600">Theo dõi trạng thái và chi tiết các đơn hàng của bạn</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-16 text-center shadow-soft">
          <HiShoppingBag className="mx-auto mb-4 h-16 w-16 text-neutral-400" />
          <h2 className="text-xl font-semibold text-charcoal">Chưa có đơn hàng nào</h2>
          <p className="mt-2 text-neutral-600">Khi bạn đặt hàng, đơn hàng sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="group cursor-pointer rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft transition-all hover:shadow-lg"
              onClick={() => navigate(`/don-hang/${order.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-charcoal">Đơn hàng #{order.id}</h3>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-6 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                      <HiCalendar className="h-4 w-4" />
                      <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiShoppingBag className="h-4 w-4" />
                      <span>
                        {Array.isArray(order.items) ? order.items.length : 0} sản phẩm
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-charcoal">
                    {order.totalAmount.toLocaleString('vi-VN')} ₫
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">Tổng tiền</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrdersPage

