import { HiMiniCheckCircle } from 'react-icons/hi2'

import { formatCurrency } from '../utils/formatCurrency'

interface OrderSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: number
  totalAmount: number
  onViewOrder?: () => void
}

const OrderSuccessModal = ({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  onViewOrder,
}: OrderSuccessModalProps) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-md px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-2xl shadow-black/20 animate-scale-in">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <HiMiniCheckCircle className="text-5xl text-green-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            <h2
              id="success-title"
              className="mb-2 text-2xl font-semibold text-charcoal"
            >
              Đặt hàng thành công!
            </h2>
            <p className="mb-6 text-sm leading-7 text-neutral-600">
              Cảm ơn bạn đã đặt hàng tại SeeU Eyewear. Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.
            </p>

            {/* Order Info */}
            <div className="mb-6 space-y-3 rounded-2xl border border-neutral-200/80 bg-white/80 p-6 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Mã đơn hàng</span>
                <span className="font-semibold text-charcoal">#{orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Tổng tiền</span>
                <span className="font-semibold text-charcoal">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Thời gian giao hàng dự kiến</span>
                <span className="font-semibold text-charcoal">3-5 ngày</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="mb-6 rounded-2xl bg-blue-50 p-4 text-left text-sm leading-7 text-blue-800">
              <p>
                <span className="font-semibold">Lưu ý:</span> Chúng tôi sẽ liên hệ với bạn qua số điện thoại và email đã cung cấp để xác nhận đơn hàng.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {onViewOrder ? (
                <button
                  type="button"
                  onClick={onViewOrder}
                  className="flex-1 rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-700 transition duration-300 ease-luxury hover:bg-neutral-50"
                >
                  Xem đơn hàng
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-charcoal px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccessModal


