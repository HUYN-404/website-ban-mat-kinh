import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowDownToLine, ArrowUpToLine } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { getResource } from '../api/resources'
import type { InventoryTransaction } from '../types/entities'

export function InventoryTransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>()
  const navigate = useNavigate()

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['inventory-transaction', transactionId],
    queryFn: () => getResource<InventoryTransaction>('inventory-transactions', Number(transactionId!)),
    enabled: !!transactionId,
  })

  if (isLoading) {
    return (
      <div className="glass-card">
        <PageHeader title="Đang tải..." description="Đang tải thông tin giao dịch..." />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="glass-card">
        <PageHeader title="Lỗi" description="Không tìm thấy giao dịch." />
        <button className="button" onClick={() => navigate('/inventory-transactions')}>
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    )
  }

  const isStaff =
    transaction.roleName &&
    (transaction.roleName.toLowerCase().includes('staff') ||
      transaction.roleName.toLowerCase().includes('admin') ||
      transaction.roleName.toLowerCase().includes('quản lý') ||
      transaction.roleName.toLowerCase().includes('nhân viên'))

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="button" onClick={() => navigate('/inventory-transactions')}>
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <PageHeader
          title={`Giao dịch kho #${transaction.id}`}
          description={`Chi tiết giao dịch ${transaction.type === 'import' ? 'nhập' : 'xuất'} kho`}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>Thông tin cơ bản</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', display: 'block' }}>
                Loại giao dịch
              </span>
              <div style={{ marginTop: 4 }}>
                <span
                  className={transaction.type === 'import' ? 'tag success' : 'tag danger'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {transaction.type === 'import' ? (
                    <>
                      <ArrowDownToLine size={14} /> Nhập kho
                    </>
                  ) : (
                    <>
                      <ArrowUpToLine size={14} /> Xuất kho
                    </>
                  )}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', display: 'block' }}>
                Sản phẩm
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 500, marginTop: 4, display: 'block' }}>
                {transaction.productName || `Sản phẩm #${transaction.productId}`}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 2 }}>
                ID: {transaction.productId}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', display: 'block' }}>
                Số lượng
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: 4, display: 'block' }}>
                {transaction.quantity}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>Thông tin người thực hiện</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', display: 'block' }}>
                Người thực hiện
              </span>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem', fontWeight: 500 }}>
                  {transaction.userName || 'Hệ thống'}
                </span>
                {transaction.userName && (
                  <>
                    {isStaff ? (
                      <span className="tag success" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                        Nhân viên
                      </span>
                    ) : transaction.roleName ? (
                      <span className="tag info" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                        Khách hàng
                      </span>
                    ) : null}
                  </>
                )}
              </div>
              {transaction.userId && (
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 2 }}>
                  ID: {transaction.userId}
                </span>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', display: 'block' }}>
                Thời gian
              </span>
              <span style={{ fontSize: '1rem', marginTop: 4, display: 'block' }}>
                {new Date(transaction.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {transaction.note && (
        <div style={{ marginTop: 24, padding: 16, background: 'var(--card-bg)', borderRadius: 8 }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
            Ghi chú
          </span>
          <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6 }}>{transaction.note}</p>
        </div>
      )}
    </div>
  )
}

