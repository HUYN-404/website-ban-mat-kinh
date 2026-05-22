import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { Brand } from '../types/entities'

interface BrandFormProps {
  brand?: Brand
  onClose: () => void
  onSuccess?: () => void
}

export function BrandForm({ brand, onClose, onSuccess }: BrandFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: brand?.name ?? '',
    country: brand?.country ?? '',
    description: brand?.description ?? '',
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.post('/brands', {
        name: data.name,
        country: data.country || null,
        description: data.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      onSuccess?.()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.put(`/brands/${brand!.id}`, {
        name: data.name,
        country: data.country || null,
        description: data.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      onSuccess?.()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (brand) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên thương hiệu *</span>
        <input
          type="text"
          className="input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isLoading}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Quốc gia</span>
        <input
          type="text"
          className="input"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          disabled={isLoading}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mô tả</span>
        <textarea
          className="input"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          disabled={isLoading}
        />
      </label>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="button secondary" onClick={onClose} disabled={isLoading}>
          Hủy
        </button>
        <button type="submit" className="button primary" disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : brand ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  )
}


