import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { HiArrowLeft, HiCalendar, HiTruck, HiPhoto } from 'react-icons/hi2'

import ConfirmationDialog from '../components/ConfirmationDialog'
import Reveal from '../components/Reveal'
import { useToast } from '../contexts/ToastContext'
import { cancelOrder, getOrder, requestRefund } from '../services/orders.service'
import { useProducts } from '../services/products.service'
import { formatCurrency } from '../utils/formatCurrency'

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Chờ xử lý',
    paid: 'Đã thanh toán',
    refund_requested: 'Chờ hoàn tiền',
    shipped: 'Đã gửi hàng',
    in_transit: 'Đang vận chuyển',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    refunded: 'Đã hoàn tiền',
    returned: 'Đã trả hàng',
  }
  return labels[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-blue-100 text-blue-800 border-blue-200',
    refund_requested: 'bg-orange-100 text-orange-800 border-orange-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    in_transit: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-teal-100 text-teal-800 border-teal-200',
    returned: 'bg-slate-100 text-slate-700 border-slate-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const getStatusDescription = (status: string) => {
  const descriptions: Record<string, string> = {
    pending: 'Đơn hàng đang được xử lý, vui lòng chờ xác nhận.',
    paid: 'Đơn hàng đã được thanh toán và đang được chuẩn bị.',
    refund_requested: 'Yêu cầu hoàn tiền đã được gửi, cửa hàng sẽ xử lý trong thời gian sớm nhất.',
    shipped: 'Đơn đã được xác nhận và gửi đi.',
    in_transit: 'Đơn hàng đang trên đường giao đến bạn.',
    completed: 'Đơn hàng đã được giao thành công.',
    cancelled: 'Đơn hàng đã bị hủy.',
    refunded: 'Đơn hàng đã được hoàn tiền.',
    returned: 'Đơn hàng đã được trả lại.',
  }
  return descriptions[status] || ''
}

const OrderDetailPage = () => {
  const { orderId } = useParams()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRefundOpen, setIsRefundOpen] = useState(false)
  const [isRequestingRefund, setIsRequestingRefund] = useState(false)

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(Number(orderId)),
    enabled: !!orderId,
  })

  // Luật huỷ/hoàn tiền do BACKEND quyết định (xem apps/commerce/services.py)
  const canCancelOrder = Boolean(order?.canCancel)
  const canRequestRefund = Boolean(order?.canRequestRefund)
  // Lý do bị khoá — hiện khi không huỷ được nhưng đơn vẫn còn cửa (hoàn hàng)
  const refundHint =
    order && !canCancelOrder && !['cancelled', 'refunded', 'returned'].includes(order.status)
      ? order.cancelBlockedReason
      : null

  const refreshOrder = async () => {
    await queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    await queryClient.invalidateQueries({ queryKey: ['orders'] })
  }

  const handleCancelOrder = async () => {
    if (!order) {
      return
    }

    setIsCancelling(true)
    try {
      await cancelOrder(Number(order.id))
      await refreshOrder()
      success('Đã huỷ đơn hàng thành công.')
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Không thể huỷ đơn hàng. Vui lòng thử lại.')
    } finally {
      setIsCancelling(false)
      setIsCancelOpen(false)
    }
  }

  const handleRequestRefund = async () => {
    if (!order) {
      return
    }

    setIsRequestingRefund(true)
    try {
      await requestRefund(Number(order.id))
      await refreshOrder()
      success('Đã gửi yêu cầu hoàn tiền. Cửa hàng sẽ liên hệ với bạn sớm nhất.')
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Không thể gửi yêu cầu hoàn tiền. Vui lòng thử lại.')
    } finally {
      setIsRequestingRefund(false)
      setIsRefundOpen(false)
    }
  }

  // Fetch products để lấy hình ảnh
  const { data: allProducts = [] } = useProducts({ status: 'available' })
  const productMap = new Map(allProducts.map((p) => [p.id, p]))

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-charcoal">Đang tải chi tiết đơn hàng...</h1>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-charcoal">Không tìm thấy đơn hàng</h1>
          <p className="mt-4 text-neutral-600">
            {error instanceof Error ? error.message : 'Đơn hàng không tồn tại hoặc đã bị xóa.'}
          </p>
          <Link
            to="/don-hang"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-charcoal px-6 py-3 text-white transition hover:bg-gold-500"
          >
            <HiArrowLeft className="h-5 w-5" />
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    )
  }

  // Số tiền backend trả dạng chuỗi (Decimal) → ép number; giảm giá là snapshot lưu trên đơn.
  // `|| 0` để field thiếu/không hợp lệ không lan thành NaN ra giao diện.
  const total = Number(order.totalAmount) || 0
  const discount = Number(order.discountAmount ?? 0) || 0
  const subtotal = total + discount

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link
        to="/don-hang"
        className="mb-6 inline-flex items-center gap-2 text-neutral-600 transition hover:text-charcoal"
      >
        <HiArrowLeft className="h-5 w-5" />
        <span>Quay lại danh sách đơn hàng</span>
      </Link>

      <Reveal className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-charcoal">Đơn hàng #{order.id}</h1>
            <p className="mt-2 text-neutral-600">{getStatusDescription(order.status)}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className={`rounded-full border px-4 py-2 text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
            {canCancelOrder && (
              <button
                type="button"
                onClick={() => setIsCancelOpen(true)}
                className="rounded-full border border-red-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-600 transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-red-600 hover:text-white"
              >
                Huỷ đơn hàng
              </button>
            )}
            {canRequestRefund && (
              <button
                type="button"
                onClick={() => setIsRefundOpen(true)}
                className="rounded-full border border-amber-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-amber-600 hover:text-white"
              >
                Yêu cầu hoàn hàng
              </button>
            )}
            {refundHint && (
              <p className="max-w-xs text-right text-xs leading-relaxed text-neutral-500">{refundHint}</p>
            )}
          </div>
        </div>
      </Reveal>

      <ConfirmationDialog
        isOpen={isCancelOpen}
        title="Huỷ đơn hàng?"
        message="Đơn hàng sẽ bị huỷ và không thể khôi phục. Nếu bạn đã dùng mã giảm giá, lượt dùng sẽ được hoàn lại."
        confirmText="Huỷ đơn"
        isLoading={isCancelling}
        onConfirm={handleCancelOrder}
        onClose={() => setIsCancelOpen(false)}
      />

      <ConfirmationDialog
        isOpen={isRefundOpen}
        title="Gửi yêu cầu hoàn hàng?"
        message="Đơn đã thanh toán hoặc đã gửi đi nên không thể huỷ. Cửa hàng sẽ tiếp nhận yêu cầu hoàn hàng/hoàn tiền và liên hệ với bạn để xác nhận."
        confirmText="Gửi yêu cầu"
        isLoading={isRequestingRefund}
        onConfirm={handleRequestRefund}
        onClose={() => setIsRefundOpen(false)}
      />

      <Reveal>
        <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin đơn hàng */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-charcoal">Chi tiết đơn hàng</h2>
            <div className="space-y-3">
              {order.items?.map((item) => {
                const product = productMap.get(item.productId.toString())
                const productImage = product?.images?.[0] || ''
                return (
                  <div key={item.id} className="flex items-center gap-4 border-b border-neutral-100 pb-3 last:border-0">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={item.productName || `Sản phẩm #${item.productId}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-400">
                          <HiPhoto className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-charcoal">{item.productName || `Sản phẩm #${item.productId}`}</h3>
                      <p className="text-sm text-neutral-600">Số lượng: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-charcoal">
                        {formatCurrency(Number(item.unitPrice) * Number(item.quantity))}
                      </p>
                      <p className="text-xs text-neutral-500">{formatCurrency(item.unitPrice)}/sản phẩm</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-charcoal">Thông tin đơn hàng</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <HiCalendar className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-neutral-500">Ngày đặt hàng</p>
                  <p className="font-medium text-charcoal">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {order.status === 'shipped' && (
                <div className="flex items-center gap-3 text-sm">
                  <HiTruck className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-neutral-500">Đang giao hàng</p>
                    <p className="font-medium text-charcoal">Dự kiến 2-5 ngày</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-charcoal">Tóm tắt</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Tạm tính</span>
                <span className="text-charcoal">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    Giảm giá {order.couponCode ? `(${order.couponCode})` : ''}
                  </span>
                  <span className="text-green-600">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Phí vận chuyển</span>
                <span className="text-charcoal">Miễn phí</span>
              </div>
              <div className="border-t border-neutral-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-charcoal">Tổng cộng</span>
                  <span className="text-xl font-semibold text-charcoal">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Reveal>
    </div>
  )
}

export default OrderDetailPage
