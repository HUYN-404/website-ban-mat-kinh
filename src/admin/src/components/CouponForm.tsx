import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { Coupon } from '../types/entities'

interface CouponFormProps {
  coupon?: Coupon
  onClose: () => void
  onSuccess?: () => void
}

// datetime-local input <-> ISO string (backend)
const toLocalInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toIso = (local: string) => (local ? new Date(local).toISOString() : null)

interface CouponFormState {
  code: string
  discountType: 'percent' | 'fixed'
  discountValue: string
  validFrom: string
  validTo: string
  usageLimit: string
  isActive: boolean
}

const toPayload = (data: CouponFormState) => ({
  code: data.code.trim().toUpperCase(),
  discountType: data.discountType,
  discountValue: Number(data.discountValue),
  validFrom: toIso(data.validFrom),
  validTo: toIso(data.validTo),
  usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
  isActive: data.isActive,
})

export function CouponForm({ coupon, onClose, onSuccess }: CouponFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<CouponFormState>({
    code: coupon?.code ?? '',
    discountType: coupon?.discountType ?? 'percent',
    discountValue: coupon ? String(coupon.discountValue) : '',
    validFrom: toLocalInput(coupon?.validFrom),
    validTo: toLocalInput(coupon?.validTo),
    usageLimit: coupon?.usageLimit != null ? String(coupon.usageLimit) : '',
    isActive: coupon?.isActive ?? true,
  })

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/coupons', toPayload(formData)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      onSuccess?.()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => apiClient.put(`/coupons/${coupon!.id}`, toPayload(formData)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      onSuccess?.()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (coupon) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mã giảm giá *</span>
          <input
            type="text"
            className="input"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: GIAM10"
            required
            disabled={isLoading}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Kiểu giảm *</span>
          <select
            className="select"
            value={formData.discountType}
            onChange={(e) =>
              setFormData({ ...formData, discountType: e.target.value as 'percent' | 'fixed' })
            }
            disabled={isLoading}
          >
            <option value="percent">% (phần trăm)</option>
            <option value="fixed">₫ (số tiền cố định)</option>
          </select>
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          Giá trị giảm * {formData.discountType === 'percent' ? '(0–100)' : '(VNĐ)'}
        </span>
        <input
          type="number"
          className="input"
          min={formData.discountType === 'percent' ? 0.1 : 1}
          max={formData.discountType === 'percent' ? 100 : undefined}
          step="any"
          value={formData.discountValue}
          onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
          placeholder={formData.discountType === 'percent' ? 'VD: 10' : 'VD: 50000'}
          required
          disabled={isLoading}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Bắt đầu (bỏ trống = vô thời hạn)</span>
          <input
            type="datetime-local"
            className="input"
            value={formData.validFrom}
            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            disabled={isLoading}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Kết thúc (bỏ trống = vô thời hạn)</span>
          <input
            type="datetime-local"
            className="input"
            value={formData.validTo}
            onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
            disabled={isLoading}
          />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Giới hạn lượt dùng (bỏ trống = không giới hạn)</span>
        <input
          type="number"
          className="input"
          min={1}
          step={1}
          value={formData.usageLimit}
          onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
          placeholder="VD: 100"
          disabled={isLoading}
        />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          disabled={isLoading}
        />
        Kích hoạt (khách áp dụng được ngay)
      </label>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="button secondary" onClick={onClose} disabled={isLoading}>
          Hủy
        </button>
        <button type="submit" className="button primary" disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : coupon ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  )
}
