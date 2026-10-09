import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams()
  const status = useMemo(() => searchParams.get('status') || 'success', [searchParams])

  const isSuccess = status === 'success'

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          isSuccess ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}
        aria-hidden="true"
      >
        {isSuccess ? (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </span>
      <div className="space-y-2">
        <p
          className={`text-xs font-semibold uppercase tracking-[0.4em] ${
            isSuccess ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
        </p>
        <h1 className="text-2xl font-semibold text-charcoal">
          {isSuccess ? 'Cảm ơn bạn!' : 'Rất tiếc!'}
        </h1>
        <p className="max-w-md text-sm leading-7 text-neutral-600">
          {isSuccess
            ? 'Đơn hàng của bạn đã được thanh toán và sẽ sớm được xử lý.'
            : 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-charcoal px-7 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500"
        >
          Về trang chủ
        </Link>
        <Link
          to="/don-hang"
          className="inline-flex items-center gap-2 rounded-full border border-neutral-900 px-7 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-900 transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white"
        >
          Xem đơn hàng
        </Link>
      </div>
    </div>
  )
}

export default PaymentResultPage





