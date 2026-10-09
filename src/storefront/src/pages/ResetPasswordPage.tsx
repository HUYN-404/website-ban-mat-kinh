import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiLock, FiArrowLeft, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import { resetPassword } from '../services/auth.service'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Hai lần nhập mật khẩu không khớp.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await resetPassword(token, newPassword)
      setMessage(result)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không đặt lại được mật khẩu. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Không có token trên URL → link sai hoặc khách tự gõ tay địa chỉ
  if (!token) {
    return (
      <div className="pb-24">
        <PageHeader
          eyebrow="Khôi phục tài khoản"
          title="Đặt lại mật khẩu"
          description="Liên kết đặt lại mật khẩu không hợp lệ hoặc đã bị cắt ngắn."
        />

        <section className="mx-auto mt-16 max-w-xl px-6">
          <Reveal>
            <div className="rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-white via-alabaster to-white p-8 text-center shadow-sm shadow-black/5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                <FiAlertTriangle className="text-2xl" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-charcoal">Liên kết không hợp lệ</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                Vui lòng mở lại email và nhấn trực tiếp vào liên kết, hoặc yêu cầu gửi liên kết mới.
              </p>
              <Link
                to="/quen-mat-khau"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-charcoal px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.3em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500"
              >
                Yêu cầu liên kết mới
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Khôi phục tài khoản"
        title="Đặt lại mật khẩu"
        description="Tạo mật khẩu mới cho tài khoản SeeU Eyewear của bạn."
      />

      <section className="mx-auto mt-16 max-w-xl px-6">
        <Reveal>
          <div className="rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-white via-alabaster to-white p-8 shadow-sm shadow-black/5">
            {message ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/10 text-gold-600">
                  <FiCheckCircle className="text-2xl" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-charcoal">Đặt lại mật khẩu thành công</h2>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{message}</p>
                <p className="mt-1 text-sm leading-7 text-neutral-500">
                  Hãy mở hộp thoại đăng nhập ở góc phải thanh điều hướng và dùng mật khẩu mới.
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
                    htmlFor="newPassword"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500"
                  >
                    Mật khẩu mới
                  </label>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition focus-within:border-gold-500">
                    <FiLock className="text-lg text-neutral-400" />
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        setError(null)
                      }}
                      placeholder="Tối thiểu 6 ký tự"
                      className="flex-1 bg-transparent text-sm text-charcoal placeholder:text-neutral-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500"
                  >
                    Nhập lại mật khẩu mới
                  </label>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition focus-within:border-gold-500">
                    <FiLock className="text-lg text-neutral-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setError(null)
                      }}
                      placeholder="Nhập lại mật khẩu"
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
                  {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  )
}

export default ResetPasswordPage
