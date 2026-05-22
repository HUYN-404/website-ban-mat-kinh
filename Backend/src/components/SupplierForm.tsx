import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { Supplier } from '../types/entities'

interface SupplierFormProps {
  supplier?: Supplier
  onClose: () => void
  onSuccess?: () => void
}

export function SupplierForm({ supplier, onClose, onSuccess }: SupplierFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: supplier?.name ?? '',
    phone: supplier?.phone ?? '',
    email: supplier?.email ?? '',
    address: supplier?.address ?? '',
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.post('/suppliers', {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      onSuccess?.()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.put(`/suppliers/${supplier!.id}`, {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      onSuccess?.()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (supplier) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên nhà cung cấp *</span>
        <input
          type="text"
          className="input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isLoading}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Số điện thoại</span>
          <input
            type="tel"
            className="input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={isLoading}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email</span>
          <input
            type="email"
            className="input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={isLoading}
          />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Địa chỉ</span>
        <textarea
          className="input"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
          disabled={isLoading}
        />
      </label>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="button secondary" onClick={onClose} disabled={isLoading}>
          Hủy
        </button>
        <button type="submit" className="button primary" disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : supplier ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  )
}


