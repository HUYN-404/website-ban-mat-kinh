import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { Role } from '../types/entities'

interface RoleFormProps {
  role?: Role
  onClose: () => void
  onSuccess?: () => void
}

export function RoleForm({ role, onClose, onSuccess }: RoleFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    roleName: role?.roleName ?? '',
    description: role?.description ?? '',
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.post('/roles', {
        roleName: data.roleName,
        description: data.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      onSuccess?.()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.put(`/roles/${role!.id}`, {
        roleName: data.roleName,
        description: data.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      onSuccess?.()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (role) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên vai trò *</span>
        <input
          type="text"
          className="input"
          value={formData.roleName}
          onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
          required
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
          {isLoading ? 'Đang xử lý...' : role ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  )
}


