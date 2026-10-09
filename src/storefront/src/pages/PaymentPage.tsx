import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { createVnPayPaymentUrl } from '../services/payments.service'

/**
 * Trang trung gian thanh toán:
 * - Có `?orderId=` → gọi backend lấy URL VNPay rồi redirect sang cổng thanh toán.
 * - Không có `orderId` → giữ luồng mô phỏng (demo khi chưa cấu hình VNPay).
 */
const PaymentPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  const status = searchParams.get('status') || 'success'
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    if (!orderId) {
      const timer = setTimeout(() => {
        navigate(`/payment/result?status=${status}`)
      }, 800)

      return () => clearTimeout(timer)
    }

    let isCancelled = false

    createVnPayPaymentUrl(Number(orderId))
      .then((paymentUrl) => {
        if (!isCancelled) {
          window.location.href = paymentUrl
        }
      })
      .catch((err) => {
        if (isCancelled) {
          return
        }
        setError(
          err?.response?.data?.message ||
            'Chưa kết nối được cổng thanh toán VNPay. Kiểm tra cấu hình VNPAY_TMN_CODE / VNPAY_HASH_SECRET.',
        )
      })

    return () => {
      isCancelled = true
    }
  }, [navigate, orderId, status])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-2 border-neutral-200 border-t-gold-500"
        />
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold-500" />
      </div>
      {error ? (
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-red-200 bg-red-50/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-500">
            Cổng thanh toán
          </p>
          <p className="text-sm leading-6 text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => navigate(`/payment/result?status=${status}`)}
            className="rounded-full border border-neutral-900 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-900 transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white"
          >
            Tiếp tục (chế độ mô phỏng)
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold-500">
            SeeU Secure Checkout
          </p>
          <h1 className="text-2xl font-semibold text-charcoal">Đang xử lý thanh toán</h1>
          <p className="text-sm text-neutral-600">
            {orderId ? 'Đang kết nối cổng VNPay...' : 'Vui lòng chờ trong giây lát...'}
          </p>
        </div>
      )}
    </div>
  )
}

export default PaymentPage





