import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Placeholder mock payment page to keep routes working after deletion
// In real flow, redirect to payment gateway or simulate processing
const PaymentPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Simulate quick processing then send to result page
    const timer = setTimeout(() => {
      const status = searchParams.get('status') || 'success'
      navigate(`/payment/result?status=${status}`)
    }, 800)
    return () => clearTimeout(timer)
  }, [navigate, searchParams])

  return (
    <div style={{ padding: '64px 24px', textAlign: 'center' }}>
      <h1>Đang xử lý thanh toán (mock)</h1>
      <p>Vui lòng chờ trong giây lát...</p>
    </div>
  )
}

export default PaymentPage





