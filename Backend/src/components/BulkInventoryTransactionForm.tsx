import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDownToLine, ArrowUpToLine, Plus, Trash2 } from 'lucide-react'
import apiClient from '../api/client'
import { getCollection } from '../api/resources'
import { useToast } from '../contexts/ToastContext'
import type { Product, InventoryTransactionType, BulkInventoryTransactionItem } from '../types/entities'

interface BulkInventoryTransactionFormProps {
  type: InventoryTransactionType
  onClose: () => void
  onSuccess?: () => void
}

export function BulkInventoryTransactionForm({
  type,
  onClose,
  onSuccess,
}: BulkInventoryTransactionFormProps) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const [items, setItems] = useState<BulkInventoryTransactionItem[]>([
    { productId: 0, quantity: 1 },
  ])
  const [note, setNote] = useState('')

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getCollection<Product>('products'),
  })

  const mutation = useMutation({
    mutationFn: (payload: {
      items: BulkInventoryTransactionItem[]
      transactionType: InventoryTransactionType
      note?: string | null
    }) => apiClient.post('/inventory-transactions/bulk', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // Đồng bộ với products
      success(`${type === 'import' ? 'Nhập' : 'Xuất'} kho ${items.length} sản phẩm thành công!`)
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Có lỗi xảy ra.')
    },
  })

  const handleAddItem = () => {
    setItems([...items, { productId: 0, quantity: 1 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    const validItems = items.filter((item) => item.productId > 0 && item.quantity > 0)
    if (validItems.length === 0) {
      showError('Vui lòng thêm ít nhất một sản phẩm hợp lệ')
      return
    }

    // Check duplicate products
    const productIds = validItems.map((item) => item.productId)
    const uniqueProductIds = new Set(productIds)
    if (productIds.length !== uniqueProductIds.size) {
      showError('Không được chọn trùng sản phẩm')
      return
    }

    mutation.mutate({
      items: validItems,
      transactionType: type,
      note: note || null,
    })
  }

  const isLoading = mutation.isPending

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        {type === 'import' ? (
          <ArrowDownToLine size={20} style={{ color: '#10b981' }} />
        ) : (
          <ArrowUpToLine size={20} style={{ color: '#ef4444' }} />
        )}
        <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
          {type === 'import' ? 'Nhập nhiều sản phẩm vào kho' : 'Xuất nhiều sản phẩm khỏi kho'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Danh sách sản phẩm *</span>
          <button
            type="button"
            className="button secondary"
            onClick={handleAddItem}
            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
          >
            <Plus size={14} />
            Thêm sản phẩm
          </button>
        </div>

        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px auto',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Sản phẩm</span>
              <select
                className="select"
                value={item.productId}
                onChange={(e) =>
                  handleItemChange(index, 'productId', Number(e.target.value))
                }
                required
                disabled={isLoading}
              >
                <option value="0">Chọn sản phẩm</option>
                {products
                  .filter((p) => p.status === 'available')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ID: {p.id})
                    </option>
                  ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Số lượng</span>
              <input
                type="number"
                className="input"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, 'quantity', Number(e.target.value))
                }
                min="1"
                required
                disabled={isLoading}
              />
            </label>

            <button
              type="button"
              className="button secondary"
              onClick={() => handleRemoveItem(index)}
              disabled={isLoading || items.length === 1}
              style={{ minWidth: 40, padding: 8 }}
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Ghi chú chung</span>
        <textarea
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Nhập ghi chú chung cho tất cả giao dịch (tùy chọn)"
          disabled={isLoading}
        />
      </label>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="button secondary" onClick={onClose} disabled={isLoading}>
          Hủy
        </button>
        <button
          type="submit"
          className="button"
          disabled={isLoading}
          style={{
            background: type === 'import' ? '#10b981' : '#ef4444',
            color: 'white',
          }}
        >
          {isLoading ? 'Đang xử lý...' : type === 'import' ? 'Nhập kho' : 'Xuất kho'}
        </button>
      </div>
    </form>
  )
}

