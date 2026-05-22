import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { getResource, getCollection } from '../api/resources'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import { usePrompt } from '../hooks/usePrompt'
import type { Order, OrderItem } from '../types/entities'
import type { Product } from '../types/entities'

const formatCurrency = (value: number) =>
  `${value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: showError, warning } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const { prompt, PromptDialog } = usePrompt()
  const [showAddItem, setShowAddItem] = useState(false)
  const [newProductId, setNewProductId] = useState('')
  const [newQuantity, setNewQuantity] = useState(1)

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getResource<Order & { items: OrderItem[] }>('orders', Number(orderId!)),
    enabled: !!orderId,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getCollection<Product>('products'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: Order['status']) =>
      apiClient.patch(`/orders/${orderId}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      success('Cập nhật trạng thái thành công!')
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Có lỗi xảy ra.')
    },
  })

  const addItemMutation = useMutation({
    mutationFn: (payload: { productId: number; quantity: number }) =>
      apiClient.post(`/orders/${orderId}/items`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      setShowAddItem(false)
      setNewProductId('')
      setNewQuantity(1)
      success('Đã thêm sản phẩm vào đơn hàng!')
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Có lỗi xảy ra khi thêm sản phẩm.')
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => apiClient.delete(`/orders/${orderId}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      success('Đã xóa sản phẩm khỏi đơn hàng!')
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm.')
    },
  })

  const updateItemQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      apiClient.put(`/orders/${orderId}/items/${itemId}`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      success('Đã cập nhật số lượng!')
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật số lượng.')
    },
  })

  const handleAddItem = () => {
    if (!newProductId) {
      warning('Vui lòng chọn sản phẩm')
      return
    }
    if (newQuantity < 1) {
      warning('Số lượng phải lớn hơn 0')
      return
    }
    addItemMutation.mutate({ productId: Number(newProductId), quantity: newQuantity })
  }

  const handleDeleteItem = async (itemId: number) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa sản phẩm này khỏi đơn hàng?',
      variant: 'danger',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
    })
    if (confirmed) {
      deleteItemMutation.mutate(itemId)
    }
  }

  const handleUpdateQuantity = async (itemId: number, currentQuantity: number) => {
    const newQty = await prompt({
      title: 'Cập nhật số lượng',
      message: 'Nhập số lượng mới:',
      label: 'Số lượng',
      type: 'number',
      defaultValue: currentQuantity.toString(),
      validation: (val) => {
        const num = Number(val)
        if (isNaN(num) || num <= 0) {
          return 'Số lượng phải lớn hơn 0'
        }
        if (num === currentQuantity) {
          return 'Số lượng mới phải khác số lượng hiện tại'
        }
        return null
      },
    })
    if (newQty && Number(newQty) > 0 && Number(newQty) !== currentQuantity) {
      updateItemQuantityMutation.mutate({ itemId, quantity: Number(newQty) })
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card">
        <PageHeader title="Đang tải..." description="Đang tải thông tin đơn hàng..." />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="glass-card">
        <PageHeader title="Lỗi" description="Không tìm thấy đơn hàng." />
        <button className="button" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    )
  }

  const canEdit = order.status === 'pending'

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="button" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <PageHeader
          title={`Đơn hàng #${order.id}`}
          description={`Khách hàng: ${order.userName || 'N/A'} | Trạng thái: ${order.status}`}
        />
      </div>

      <div className="toolbar" style={{ marginBottom: 24 }}>
        <label>Trạng thái:</label>
        <select
          className="select"
          value={order.status}
          onChange={async (e) => {
            const newStatus = e.target.value as Order['status']
            const statusLabels: Record<Order['status'], string> = {
              pending: 'Chờ xử lý',
              paid: 'Đã thanh toán',
              shipped: 'Đang giao',
              completed: 'Hoàn tất',
              cancelled: 'Đã hủy',
            }
            const confirmed = await confirm({
              title: 'Xác nhận đổi trạng thái',
              message: `Bạn có chắc muốn đổi trạng thái sang "${statusLabels[newStatus]}"?`,
              variant: newStatus === 'cancelled' ? 'danger' : 'warning',
              confirmText: 'Xác nhận',
              cancelText: 'Hủy',
            })
            if (confirmed) {
              updateStatusMutation.mutate(newStatus)
            }
          }}
        >
          <option value="pending">Chờ xử lý</option>
          <option value="paid">Đã thanh toán</option>
          <option value="shipped">Đang giao</option>
          <option value="completed">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Sản phẩm trong đơn hàng</h3>
        {canEdit && (
          <button
            className="button"
            onClick={() => setShowAddItem(!showAddItem)}
            style={{ marginBottom: 16 }}
          >
            <Plus size={16} />
            {showAddItem ? 'Hủy' : 'Thêm sản phẩm'}
          </button>
        )}

        {showAddItem && (
          <div className="toolbar" style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <select
              className="select"
              value={newProductId}
              onChange={(e) => setNewProductId(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Chọn sản phẩm</option>
              {products
                .filter((p) => p.status === 'available')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatCurrency(p.price)}
                  </option>
                ))}
            </select>
            <input
              type="number"
              className="input"
              value={newQuantity}
              onChange={(e) => setNewQuantity(Number(e.target.value))}
              min="1"
              style={{ width: 100 }}
              placeholder="Số lượng"
            />
            <button className="button" onClick={handleAddItem} disabled={addItemMutation.isPending}>
              Thêm
            </button>
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Tên sản phẩm</th>
              <th style={{ textAlign: 'right' }}>Đơn giá</th>
              <th style={{ textAlign: 'right' }}>Số lượng</th>
              <th style={{ textAlign: 'right' }}>Thành tiền</th>
              {canEdit && <th style={{ textAlign: 'center' }}>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td>{item.productId}</td>
                <td>{item.productName || `Sản phẩm #${item.productId}`}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ textAlign: 'right' }}>
                  {canEdit ? (
                    <button
                      className="button"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity)}
                      style={{ padding: '4px 8px', fontSize: 14 }}
                    >
                      {item.quantity} (sửa)
                    </button>
                  ) : (
                    item.quantity
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.subtotal)}</td>
                {canEdit && (
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="button"
                      onClick={() => handleDeleteItem(item.id)}
                      style={{ padding: '4px 8px', background: '#dc3545', color: 'white' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={canEdit ? 4 : 3} style={{ textAlign: 'right', fontWeight: 600 }}>
                Tổng cộng:
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 18 }}>
                {formatCurrency(order.totalAmount)}
              </td>
              {canEdit && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
      <ConfirmDialog />
      <PromptDialog />
    </div>
  )
}

