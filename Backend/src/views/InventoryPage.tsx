import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, ArrowDownToLine, ArrowUpToLine, Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { BulkInventoryTransactionForm } from '../components/BulkInventoryTransactionForm'
import { getCollection } from '../api/resources'
import type { InventoryItem } from '../types/entities'

export function InventoryPage() {
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [keyword, setKeyword] = useState('')

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getCollection<InventoryItem>('inventory'),
  })

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (!keyword) return true
      const keywordLower = keyword.toLowerCase().trim()
      // Tìm theo ID (nếu keyword là số)
      const keywordAsNumber = Number(keyword)
      if (!isNaN(keywordAsNumber) && item.productId === keywordAsNumber) {
        return true
      }
      // Tìm theo tên sản phẩm
      if (item.productName) {
        return item.productName.toLowerCase().includes(keywordLower)
      }
      return false
    })
  }, [data, keyword])

  const totalStock = filtered.reduce((sum, item) => sum + item.totalQuantity, 0)
  const lowStock = filtered.filter((item) => item.totalQuantity < 20).length

  return (
    <div className="glass-card">
      <PageHeader
        title="Tồn kho"
        description="Theo dõi số lượng hàng còn lại để chủ động nhập bổ sung."
      />

      <div className="stat-grid" style={{ margin: '24px 0' }}>
        <StatCard
          label="Tổng tồn kho"
          value={totalStock}
          helper={`${lowStock} sản phẩm dưới 20 đơn vị`}
          icon={<Boxes size={22} />}
        />
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Tìm kiếm theo ID hoặc tên sản phẩm..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <button
          className="button"
          onClick={() => setShowImportModal(true)}
          style={{ background: '#10b981', color: 'white' }}
        >
          <ArrowDownToLine size={16} />
          Nhập kho
        </button>
        <button
          className="button"
          onClick={() => setShowExportModal(true)}
          style={{ background: '#ef4444', color: 'white' }}
        >
          <ArrowUpToLine size={16} />
          Xuất kho
        </button>
      </div>

      <DataTable<InventoryItem>
        data={filtered}
        columns={[
          { key: 'productId', header: 'Mã sản phẩm', align: 'right' },
          { key: 'productName', header: 'Tên sản phẩm' },
          {
            key: 'totalQuantity',
            header: 'Tồn kho',
            align: 'right',
            render: (row) => (
              <span className={row.totalQuantity < 20 ? 'tag warning' : 'tag info'}>
                {row.totalQuantity}
              </span>
            ),
          },
          {
            key: 'lastUpdated',
            header: 'Cập nhật cuối',
            render: (row) => new Date(row.lastUpdated).toLocaleString('vi-VN'),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={keyword ? "Không tìm thấy sản phẩm phù hợp." : "Danh sách tồn kho trống."}
      />

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Nhập kho"
        size="lg"
      >
        <BulkInventoryTransactionForm
          type="import"
          onClose={() => setShowImportModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Xuất kho"
        size="lg"
      >
        <BulkInventoryTransactionForm
          type="export"
          onClose={() => setShowExportModal(false)}
        />
      </Modal>
    </div>
  )
}
