import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'
import { getCollection } from '../api/resources'
import type { Category } from '../types/entities'

interface CategoryFormProps {
  category?: Category
  onClose: () => void
  onSuccess?: () => void
}

export function CategoryForm({ category, onClose, onSuccess }: CategoryFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: category?.name ?? '',
    description: category?.description ?? '',
    parentId: category?.parentId ?? null as number | null,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCollection<Category>('categories'),
  })

  // Filter out current category and its children to prevent circular dependency
  const availableParents = categories.filter(
    (cat) => cat.id !== category?.id && cat.parentId !== category?.id,
  )

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.post('/categories', {
        name: data.name,
        description: data.description || null,
        parentId: data.parentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onSuccess?.()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiClient.put(`/categories/${category!.id}`, {
        name: data.name,
        description: data.description || null,
        parentId: data.parentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onSuccess?.()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (category) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tên danh mục *</span>
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
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Danh mục cha</span>
        <select
          className="select"
          value={formData.parentId ?? ''}
          onChange={(e) =>
            setFormData({ ...formData, parentId: e.target.value ? Number(e.target.value) : null })
          }
          disabled={isLoading}
        >
          <option value="">Không có (danh mục gốc)</option>
          {availableParents.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
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
          {isLoading ? 'Đang xử lý...' : category ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  )
}


