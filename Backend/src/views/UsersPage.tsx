import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { UserForm } from '../components/UserForm'
import { getCollection, getResource } from '../api/resources'
import apiClient from '../api/client'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import type { User } from '../types/entities'

export function UsersPage() {
  const queryClient = useQueryClient()
  const { success } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [keyword, setKeyword] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => getCollection<User>('users'),
  })

  const { data: userDetail } = useQuery({
    queryKey: ['users', selectedUser?.id],
    queryFn: () => getResource<User>('users', selectedUser!.id),
    enabled: !!selectedUser && isDetailOpen,
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => apiClient.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      success('Xóa người dùng thành công')
    },
  })

  const filtered = useMemo(() => {
    if (!keyword) return data
    const lower = keyword.toLowerCase()
    return data.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(lower) ||
        user.username.toLowerCase().includes(lower) ||
        user.email?.toLowerCase().includes(lower),
    )
  }, [data, keyword])

  const stats = useMemo(() => {
    const total = data.length
    const active = data.filter((user) => user.status === 'active').length
    const admin = data.filter((user) => user.roleName?.toLowerCase().includes('admin')).length
    return {
      total,
      active,
      admin,
    }
  }, [data])

  return (
    <div className="glass-card">
      <PageHeader
        title="Quản lý người dùng"
        description="Giám sát tài khoản SeeU, quyền hạn và tình trạng hoạt động."
      />

      <div className="stat-grid" style={{ margin: '24px 0' }}>
        <StatCard label="Tổng người dùng" value={stats.total} />
        <StatCard label="Đang hoạt động" value={stats.active} />
        <StatCard label="Quản trị viên" value={stats.admin} />
      </div>

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="topbar-search" style={{ width: '100%', maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Tìm kiếm theo tên, username hoặc email..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <button
          className="button primary"
          onClick={() => {
            setSelectedUser(null)
            setIsFormOpen(true)
          }}
        >
          <Plus size={16} />
          Tạo người dùng
        </button>
      </div>

      <DataTable<User>
        data={filtered}
        columns={[
          { key: 'id', header: 'ID', align: 'right' },
          { key: 'username', header: 'Username' },
          { key: 'fullName', header: 'Họ tên' },
          { key: 'email', header: 'Email' },
          { key: 'roleName', header: 'Vai trò' },
          {
            key: 'status',
            header: 'Trạng thái',
            render: (row) => (
              <span className={row.status === 'active' ? 'tag success' : 'tag danger'}>
                {row.status === 'active' ? 'Hoạt động' : 'Ngưng'}
              </span>
            ),
          },
          {
            key: 'createdAt',
            header: 'Ngày tạo',
            render: (row) => new Date(row.createdAt).toLocaleDateString('vi-VN'),
          },
        ]}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        emptyMessage="Không tìm thấy người dùng phù hợp."
        onRowClick={(row) => {
          setSelectedUser(row)
          setIsDetailOpen(true)
        }}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className="button secondary"
              style={{ minWidth: 36, padding: 8 }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedUser(row)
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
                  message: `Bạn có chắc muốn xóa người dùng "${row.username}"?`,
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
        title={selectedUser ? 'Sửa người dùng' : 'Tạo người dùng mới'}
      >
        <UserForm
          user={selectedUser ?? undefined}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false)
            setSelectedUser(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedUser(null)
        }}
        title="Chi tiết người dùng"
        size="md"
      >
        {userDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>ID</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>{userDetail.id}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Username</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>{userDetail.username}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Họ tên</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {userDetail.fullName || '-'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Email</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {userDetail.email || '-'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Số điện thoại</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {userDetail.phone || '-'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Vai trò</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {userDetail.roleName || '-'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Trạng thái</span>
                <p style={{ margin: '4px 0 0' }}>
                  <span className={userDetail.status === 'active' ? 'tag success' : 'tag danger'}>
                    {userDetail.status === 'active' ? 'Hoạt động' : 'Ngưng'}
                  </span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Ngày tạo</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>
                  {new Date(userDetail.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
            {userDetail.address && (
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Địa chỉ</span>
                <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 500 }}>{userDetail.address}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                className="button secondary"
                onClick={() => {
                  setIsDetailOpen(false)
                  setSelectedUser(userDetail)
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
