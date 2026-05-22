import { useState, type FormEvent } from 'react'
import { HiMiniXMark } from 'react-icons/hi2'

import { formatCurrency } from '../utils/formatCurrency'
import type { CartItem } from '../services/cart.service'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  total: number
  itemCount: number
  onSubmit: (shippingInfo: ShippingInfo) => Promise<void>
  isLoading?: boolean
}

export interface ShippingInfo {
  fullName: string
  phone: string
  email: string
  address: string
  paymentMethod: 'cash' | 'credit_card' | 'bank_transfer'
  note?: string
}

const CheckoutModal = ({
  isOpen,
  onClose,
  items,
  total,
  itemCount,
  onSubmit,
  isLoading = false,
}: CheckoutModalProps) => {
  const [formData, setFormData] = useState<ShippingInfo>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'cash',
    note: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({})

  if (!isOpen) return null

  const handleChange = (field: keyof ShippingInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error khi user nhập
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingInfo, string>> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.trim().replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 chữ số)'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ giao hàng'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      // Error sẽ được xử lý ở component cha
      console.error('Error submitting checkout:', error)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
      onClick={onClose}
    >
      <div
        className="mx-auto my-8 w-full max-w-4xl px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-2xl shadow-black/20 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 id="checkout-title" className="text-2xl font-semibold text-charcoal">
              Thanh toán đơn hàng
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Đóng"
            >
              <HiMiniXMark className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Form thông tin giao hàng */}
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-charcoal">Thông tin giao hàng</h3>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:border-charcoal focus:outline-none ${
                          errors.fullName ? 'border-red-300 bg-red-50' : 'border-neutral-200 bg-white'
                        }`}
                        placeholder="Nguyễn Văn A"
                        disabled={isLoading}
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Số điện thoại <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:border-charcoal focus:outline-none ${
                          errors.phone ? 'border-red-300 bg-red-50' : 'border-neutral-200 bg-white'
                        }`}
                        placeholder="0901234567"
                        disabled={isLoading}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Email <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:border-charcoal focus:outline-none ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-neutral-200 bg-white'
                        }`}
                        placeholder="example@email.com"
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Địa chỉ giao hàng <span className="text-red-500">*</span>
                      </span>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        rows={3}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm transition focus:border-charcoal focus:outline-none resize-none ${
                          errors.address ? 'border-red-300 bg-red-50' : 'border-neutral-200 bg-white'
                        }`}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                        disabled={isLoading}
                      />
                      {errors.address && (
                        <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Phương thức thanh toán <span className="text-red-500">*</span>
                      </span>
                      <div className="space-y-2">
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-charcoal hover:bg-neutral-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={formData.paymentMethod === 'cash'}
                            onChange={(e) => handleChange('paymentMethod', e.target.value as 'cash' | 'credit_card' | 'bank_transfer')}
                            className="h-4 w-4 text-charcoal focus:ring-charcoal"
                            disabled={isLoading}
                          />
                          <span className="text-sm font-medium text-neutral-700">Thanh toán khi nhận hàng (COD)</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-charcoal hover:bg-neutral-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="bank_transfer"
                            checked={formData.paymentMethod === 'bank_transfer'}
                            onChange={(e) => handleChange('paymentMethod', e.target.value as 'cash' | 'credit_card' | 'bank_transfer')}
                            className="h-4 w-4 text-charcoal focus:ring-charcoal"
                            disabled={isLoading}
                          />
                          <span className="text-sm font-medium text-neutral-700">Chuyển khoản ngân hàng</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-charcoal hover:bg-neutral-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="credit_card"
                            checked={formData.paymentMethod === 'credit_card'}
                            onChange={(e) => handleChange('paymentMethod', e.target.value as 'cash' | 'credit_card' | 'bank_transfer')}
                            className="h-4 w-4 text-charcoal focus:ring-charcoal"
                            disabled={isLoading}
                          />
                          <span className="text-sm font-medium text-neutral-700">Thẻ tín dụng/Ghi nợ</span>
                        </label>
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Ghi chú (tùy chọn)
                      </span>
                      <textarea
                        value={formData.note || ''}
                        onChange={(e) => handleChange('note', e.target.value)}
                        rows={2}
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm transition focus:border-charcoal focus:outline-none resize-none"
                        placeholder="Ghi chú thêm cho đơn hàng..."
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Tóm tắt đơn hàng */}
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-charcoal">Tóm tắt đơn hàng</h3>
                  <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white/80 p-4">
                    {/* Danh sách sản phẩm */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3 border-b border-neutral-200/60 pb-3 last:border-0">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-alabaster">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-neutral-400">
                                <span className="text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-charcoal line-clamp-2">
                              {item.productName}
                            </p>
                            <p className="mt-1 text-xs text-neutral-600">
                              {formatCurrency(item.unitPrice)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-sm font-semibold text-charcoal">
                            {formatCurrency(item.subtotal)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tổng cộng */}
                    <div className="space-y-2 border-t border-neutral-200 pt-4">
                      <div className="flex justify-between text-sm text-neutral-600">
                        <span>Tạm tính ({itemCount} sản phẩm)</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-neutral-600">
                        <span>Phí vận chuyển</span>
                        <span className="text-green-600">Miễn phí</span>
                      </div>
                      <div className="border-t border-neutral-200 pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold text-charcoal">Tổng cộng</span>
                          <span className="text-xl font-semibold text-charcoal">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-700 transition duration-300 ease-luxury hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading || items.length === 0}
                className="flex-1 rounded-full bg-charcoal px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal

