import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { getCollection } from '../api/resources'
import type { User, Role } from '../types/entities'

interface UserFormProps {
  user?: User
  onClose: () => void
  onSuccess?: () => void
}

export function UserForm({ user, onClose, onSuccess }: UserFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    username: user?.username ?? '',
    password: '',
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    roleId: user?.roleId ?? null as number | null,
    status: user?.status ?? ('active' as 'active' | 'inactive'),
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getCollection<Role>('roles'),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.post('/users', {
        username: data.username,
        password: data.password,
        fullName: data.fullName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        roleId: data.roleId,
        status: data.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess?.()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.put(`/users/${user!.id}`, {
        username: data.username,
        fullName: data.fullName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        roleId: data.roleId,
        status: data.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess?.()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (user) {
      updateMutation.mutate(formData)
    } else {
      if (!formData.password) {
        // Note: UserForm được dùng trong Modal, nên không thể dùng Toast trực tiếp
        // Có thể truyền callback từ parent hoặc dùng window.alert tạm thời
        window.alert('Vui lòng nhập mật khẩu')
        return
      }
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Username *</span>
          <input
            type="text"
            className="input"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            disabled={isLoading}
          />
        </label>

        {!user && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu *</span>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
              minLength={6}
            />
          </label>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Họ tên</span>
          <input
            type="text"
            className="input"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Vai trò *</span>
          <select
            className="select"
            value={formData.roleId ?? ''}
            onChange={(e) =>
              setFormData({ ...formData, roleId: e.target.value ? Number(e.target.value) : null })
            }
            required
            disabled={isLoading}
          >
            <option value="">Chọn vai trò</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.roleName}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Trạng thái *</span>
          <select
            className="select"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
            required
            disabled={isLoading}
          >
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngưng</option>
          </select>
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
          {isLoading ? 'Đang xử lý...' : user ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  )
}


