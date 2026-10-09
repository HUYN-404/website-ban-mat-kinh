import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import { requestPasswordReset } from '../services/auth.service'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Vui lòng nhập email của bạn.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await requestPasswordReset(email.trim())
      setMessage(result)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không gửi được yêu cầu. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Khôi phục tài khoản"
        title="Quên mật khẩu"
        description="Nhập email bạn đã đăng ký, SeeU sẽ gửi cho bạn liên kết để tạo mật khẩu mới."
      />

      <section className="mx-auto mt-16 max-w-xl px-6">
        <Reveal>
          <div className="rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-white via-alabaster to-white p-8 shadow-sm shadow-black/5">
            {message ? (
              // Đã gửi yêu cầu: không nói rõ email có tồn tại hay không (bảo mật)
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/10 text-gold-600">
                  <FiCheckCircle className="text-2xl" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-charcoal">Kiểm tra hộp thư của bạn</h2>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{message}</p>
                <p className="mt-1 text-sm leading-7 text-neutral-500">
                  Liên kết chỉ có hiệu lực trong 1 giờ và chỉ sử dụng được một lần.
                </p>

                <Link
                  to="/"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-charcoal px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.3em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500"
                >
                  <FiArrowLeft />
                  Về trang chủ
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500"
                  >
                    Email đăng ký
                  </label>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition focus-within:border-gold-500">
                    <FiMail className="text-lg text-neutral-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null)
                      }}
                      placeholder="ban@example.com"
                      className="flex-1 bg-transparent text-sm text-charcoal placeholder:text-neutral-400 focus:outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-xs font-medium text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-charcoal px-8 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
                </button>

                <p className="text-center text-xs leading-6 text-neutral-500">
                  Nhớ ra mật khẩu rồi? Mở hộp thoại đăng nhập ở góc phải thanh điều hướng.
                </p>
              </form>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  )
}

export default ForgotPasswordPage
