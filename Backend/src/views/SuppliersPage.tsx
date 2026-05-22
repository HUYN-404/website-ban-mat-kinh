import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Edit, Trash2, Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { SupplierForm } from '../components/SupplierForm'
import { getCollection, getResource } from '../api/resources'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import type { Supplier } from '../types/entities'

export function SuppliersPage() {
  const queryClient = useQueryClient()
  const { success } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [keyword, setKeyword] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getCollection<Supplier>('suppliers'),
  })

  const { data: supplierDetail } = useQuery({
    queryKey: ['suppliers', selectedSupplier?.id],
    queryFn: () => getResource<Supplier>('suppliers', selectedSupplier!.id),
    enabled: !!selectedSupplier && isDetailOpen,
  })

  const deleteMutation = useMutation({
    mutationFn: (supplierId: number) => apiClient.delete(`/suppliers/${supplierId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      success('Xóa nhà cung cấp thành công')
    },
  })

  const filtered = useMemo(() => {
    if (!keyword) return data
    const lower = keyword.toLowerCase().trim()
    const keywordAsNumber = Number(keyword)
    return data.filter(
      (supplier) =>
        (!isNaN(keywordAsNumber) && supplier.id === keywordAsNumber) ||
        supplier.name.toLowerCase().includes(lower) ||
        supplier.phone?.toLowerCase().includes(lower) ||
        supplier.email?.toLowerCase().includes(lower) ||
        supplier.address?.toLowerCase().includes(lower),
    )
  }, [data, keyword])

  return (
    <div className="glass-card">
      <PageHeader
        title="Đối tác cung ứng"
        description="Quản lý thông tin các nhà cung cấp vật liệu và phụ kiện của SeeU."
      />

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Tìm kiếm theo ID, tên, SĐT, email hoặc địa chỉ..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <button
          className="button primary"
          onClick={() => {
            setSelectedSupplier(null)
            setIsFormOpen(true)
          }}
        >
          <Plus size={16} />
          Tạo nhà cung cấp
        </button>
      </div>

      <DataTable<Supplier>
        data={filtered}
        columns={[
          { key: 'id', header: 'ID', align: 'right' },
          {
            key: 'name',
            header: 'Nhà cung cấp',
            render: (row) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={16} />
                <span>{row.name}</span>
              </div>
            ),
          },
          { key: 'phone', header: 'Điện thoại' },
          { key: 'email', header: 'Email' },
          { key: 'address', header: 'Địa chỉ' },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={keyword ? 'Không tìm thấy nhà cung cấp phù hợp.' : 'Chưa có nhà cung cấp nào.'}
        onRowClick={(row) => {
          setSelectedSupplier(row)
          setIsDetailOpen(true)
        }}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className="button secondary"
              style={{ minWidth: 36, padding: 8 }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedSupplier(row)
                setIsFormOpen(true)
              }}
              title="Sửa"
            >
              <Edit size={16} />
            </button>
            <button
              className="button secondary"
              style={{ minWidth: 36, padding: 8 }}
              onClick={async (e) => {
                e.stopPropagation()
                const confirmed = await confirm({
                  title: 'Xác nhận xóa',
                  message: `Bạn có chắc muốn xóa nhà cung cấp "${row.name}"?`,
                  variant: 'danger',
                  confirmText: 'Xóa',
                  cancelText: 'Hủy',
                })
                if (confirmed) {
                  deleteMutation.mutate(row.id)
                }
              }}
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedSupplier ? 'Sửa nhà cung cấp' : 'Tạo nhà cung cấp mới'}
      >
        <SupplierForm
          supplier={selectedSupplier ?? undefined}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false)
            setSelectedSupplier(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedSupplier(null)
        }}
        title="Chi tiết nhà cung cấp"
        size="md"
      >
        {supplierDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>ID</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {supplierDetail.id}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Tên nhà cung cấp</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {supplierDetail.name}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Số điện thoại</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {supplierDetail.phone || '-'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Email</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {supplierDetail.email || '-'}
                </p>
              </div>
            </div>
            {supplierDetail.address && (
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Địa chỉ</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {supplierDetail.address}
                </p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                className="button secondary"
                onClick={() => {
                  setIsDetailOpen(false)
                  setSelectedSupplier(supplierDetail)
                  setIsFormOpen(true)
                }}
              >
                <Edit size={16} />
                Sửa
              </button>
              <button className="button primary" onClick={() => setIsDetailOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <div>Đang tải...</div>
        )}
      </Modal>
      <ConfirmDialog />
    </div>
  )
}
