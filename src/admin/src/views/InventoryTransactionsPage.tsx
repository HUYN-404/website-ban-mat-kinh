import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpToLine } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { DataTable } from '../components/DataTable'
import { getCollection } from '../api/resources'
import type { InventoryTransaction } from '../types/entities'

export function InventoryTransactionsPage() {
  const navigate = useNavigate()
  const [productId, setProductId] = useState('')
  const [transactionType, setTransactionType] = useState<'all' | 'import' | 'export'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['inventory-transactions', { productId, transactionType, from, to }],
    queryFn: () =>
      getCollection<InventoryTransaction>('inventory-transactions', {
        productId: productId || undefined,
        transactionType: transactionType === 'all' ? undefined : transactionType,
        from: from || undefined,
        to: to || undefined,
      }),
  })

  return (
    <div className="glass-card">
      <PageHeader
        title="Lịch sử kho hàng"
        description="Ghi nhận chi tiết mọi lần nhập/xuất để đảm bảo tồn kho chính xác."
      />

      <div className="toolbar" style={{ margin: '20px 0' }}>
        <input
          className="input"
          placeholder="Mã sản phẩm"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          style={{ maxWidth: 180 }}
        />
        <select
          className="select"
          value={transactionType}
          onChange={(event) => setTransactionType(event.target.value as typeof transactionType)}
        >
          <option value="all">Tất cả loại giao dịch</option>
          <option value="import">Nhập kho</option>
          <option value="export">Xuất kho</option>
        </select>
        <input
          type="date"
          className="input"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <input
          type="date"
          className="input"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </div>

      <DataTable<InventoryTransaction>
        data={data}
        onRowClick={(row) => navigate(`/inventory-transactions/${row.id}`)}
        columns={[
          { key: 'id', header: 'ID', align: 'right' },
          { key: 'productId', header: 'Sản phẩm', align: 'right' },
          { key: 'productName', header: 'Tên sản phẩm' },
          {
            key: 'type',
            header: 'Loại giao dịch',
            render: (row) => (
              <span className={row.type === 'import' ? 'tag success' : 'tag danger'}>
                {row.type === 'import' ? (
                  <>
                    <ArrowDownToLine size={14} /> Nhập kho
                  </>
                ) : (
                  <>
                    <ArrowUpToLine size={14} /> Xuất kho
                  </>
                )}
              </span>
            ),
          },
          { key: 'quantity', header: 'Số lượng', align: 'right' },
          {
            key: 'userName',
            header: 'Người thực hiện',
            render: (row) => {
              if (!row.userName) {
                return <span style={{ color: 'var(--muted)' }}>Hệ thống</span>
              }
              
              // Phân biệt nhân viên và khách hàng dựa trên roleName
              const isStaff = row.roleName && 
                (row.roleName.toLowerCase().includes('staff') || 
                 row.roleName.toLowerCase().includes('admin') ||
                 row.roleName.toLowerCase().includes('quản lý') ||
                 row.roleName.toLowerCase().includes('nhân viên'))
              
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{row.userName}</span>
                  {isStaff ? (
                    <span className="tag success" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                      Nhân viên
                    </span>
                  ) : row.roleName ? (
                    <span className="tag info" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                      Khách hàng
                    </span>
                  ) : null}
                </div>
              )
            },
          },
          { key: 'note', header: 'Ghi chú' },
          {
            key: 'createdAt',
            header: 'Thời gian',
            render: (row) => new Date(row.createdAt).toLocaleString('vi-VN'),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage="Chưa có giao dịch tồn kho nào."
      />
    </div>
  )
}
