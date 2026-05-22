import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCoreClient } from '../api/client'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  })

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }

    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
    })
  }, [user, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const response = await getCoreClient().put(`/users/${user?.id}`, formData)
      const updatedUser = response.data.data
      
      // Cập nhật user info trong context (API trả về camelCase)
      updateUser({
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
      })
      
      setSuccess('Cập nhật thông tin thành công!')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-charcoal">Thông tin tài khoản</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Quản lý và cập nhật thông tin cá nhân của bạn
        </p>
      </div>

      <div className="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-600">
              {success}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-neutral-400">Tên đăng nhập không thể thay đổi</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition focus:border-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition focus:border-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+84 912 345 678"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition focus:border-charcoal focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Địa chỉ
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Nhập địa chỉ của bạn"
              rows={3}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition focus:border-charcoal focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-200/60">
            <div className="text-xs text-neutral-500">
              Vai trò: <span className="font-medium text-neutral-700">{user.roleName || 'Customer'}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-full border border-neutral-200 bg-white px-6 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-charcoal px-6 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage

