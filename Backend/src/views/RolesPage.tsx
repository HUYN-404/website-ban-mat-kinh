import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { RoleForm } from '../components/RoleForm'
import { getCollection, getResource } from '../api/resources'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import type { Role } from '../types/entities'

export function RolesPage() {
  const queryClient = useQueryClient()
  const { success } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [keyword, setKeyword] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getCollection<Role>('roles'),
  })

  const { data: roleDetail } = useQuery({
    queryKey: ['roles', selectedRole?.id],
    queryFn: () => getResource<Role>('roles', selectedRole!.id),
    enabled: !!selectedRole && isDetailOpen,
  })

  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => apiClient.delete(`/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      success('Xóa vai trò thành công')
    },
  })

  const filtered = useMemo(() => {
    if (!keyword) return data
    const lower = keyword.toLowerCase().trim()
    const keywordAsNumber = Number(keyword)
    return data.filter(
      (role) =>
        (!isNaN(keywordAsNumber) && role.id === keywordAsNumber) ||
        role.roleName.toLowerCase().includes(lower) ||
        role.description?.toLowerCase().includes(lower),
    )
  }, [data, keyword])

  return (
    <div className="glass-card">
      <PageHeader
        title="Vai trò & phân quyền"
        description="Các nhóm quyền xác định khả năng truy cập hệ thống."
      />

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Tìm kiếm theo ID, tên vai trò hoặc mô tả..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <button
          className="button primary"
          onClick={() => {
            setSelectedRole(null)
            setIsFormOpen(true)
          }}
        >
          <Plus size={16} />
          Tạo vai trò
        </button>
      </div>

      <DataTable<Role>
        data={filtered}
        columns={[
          { key: 'id', header: 'ID', align: 'right' },
          { key: 'roleName', header: 'Tên vai trò' },
          { key: 'description', header: 'Mô tả' },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage={keyword ? 'Không tìm thấy vai trò phù hợp.' : 'Chưa có vai trò nào.'}
        onRowClick={(row) => {
          setSelectedRole(row)
          setIsDetailOpen(true)
        }}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className="button secondary"
              style={{ minWidth: 36, padding: 8 }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedRole(row)
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
                  message: `Bạn có chắc muốn xóa vai trò "${row.roleName}"?`,
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
        title={selectedRole ? 'Sửa vai trò' : 'Tạo vai trò mới'}
      >
        <RoleForm
          role={selectedRole ?? undefined}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false)
            setSelectedRole(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedRole(null)
        }}
        title="Chi tiết vai trò"
        size="md"
      >
        {roleDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>ID</span>
              <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>{roleDetail.id}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Tên vai trò</span>
              <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                {roleDetail.roleName}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Mô tả</span>
              <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                {roleDetail.description || '-'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                className="button secondary"
                onClick={() => {
                  setIsDetailOpen(false)
                  setSelectedRole(roleDetail)
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
