import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams()
  const status = useMemo(() => searchParams.get('status') || 'success', [searchParams])

  const isSuccess = status === 'success'

  return (
    <div style={{ padding: '64px 24px', textAlign: 'center' }}>
      <h1>{isSuccess ? 'Thanh toán thành công (mock)' : 'Thanh toán thất bại (mock)'}</h1>
      <p>
        {isSuccess
          ? 'Cảm ơn bạn đã thanh toán. Đơn hàng sẽ được xử lý.'
          : 'Có lỗi trong quá trình thanh toán. Vui lòng thử lại.'}
      </p>
      <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link to="/" style={{ textDecoration: 'underline' }}>
          Về trang chủ
        </Link>
        <Link to="/don-hang" style={{ textDecoration: 'underline' }}>
          Xem đơn hàng
        </Link>
      </div>
    </div>
  )
}

export default PaymentResultPage





