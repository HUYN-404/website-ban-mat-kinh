// Utility functions để quản lý phân quyền dựa trên role

export type RoleName = 'admin' | 'staff'

export interface NavigationItem {
  label: string
  path: string
  icon: any
  end?: boolean
  roles?: RoleName[] // Roles được phép truy cập (undefined = tất cả roles)
}

// Định nghĩa các navigation items với phân quyền
export const getAllNavigationItems = (): NavigationItem[] => [
  { label: 'Báo cáo & thống kê', path: '/', icon: null, end: true }, // Reports/Dashboard - tất cả roles
  { label: 'Người dùng', path: '/users', icon: null, roles: ['admin'] },
  { label: 'Vai trò', path: '/roles', icon: null, roles: ['admin'] },
  { label: 'Danh mục', path: '/categories', icon: null, roles: ['admin'] },
  { label: 'Thương hiệu', path: '/brands', icon: null, roles: ['admin'] },
  { label: 'Nhà cung cấp', path: '/suppliers', icon: null, roles: ['admin'] },
  { label: 'Sản phẩm', path: '/products', icon: null }, // Tất cả roles (admin + staff)
  { label: 'Ảnh sản phẩm', path: '/product-images', icon: null }, // Tất cả roles (admin + staff)
  { label: 'Kho hàng', path: '/inventory', icon: null }, // Tất cả roles (admin + staff)
  { label: 'Giao dịch kho', path: '/inventory-transactions', icon: null, roles: ['admin'] },
  { label: 'Đơn hàng', path: '/orders', icon: null }, // Tất cả roles (admin + staff)
  { label: 'Chi tiết đơn', path: '/order-items', icon: null, roles: ['admin'] },
  { label: 'Thanh toán', path: '/payments', icon: null, roles: ['admin'] },
  { label: 'Giỏ hàng', path: '/carts', icon: null, roles: ['admin'] },
  { label: 'Sản phẩm giỏ', path: '/cart-items', icon: null, roles: ['admin'] },
]

// Lọc navigation items dựa trên role
export const getNavigationItemsForRole = (roleName: string | null | undefined): NavigationItem[] => {
  const role = roleName?.toLowerCase() as RoleName | undefined
  const allItems = getAllNavigationItems()

  // Nếu không có role hoặc role không hợp lệ, trả về empty array
  if (!role) {
    return []
  }

  // Lọc items: nếu item không có roles hoặc role nằm trong danh sách roles được phép
  return allItems.filter((item) => {
    // Nếu item không có roles, tất cả roles đều được phép
    if (!item.roles) {
      return true
    }
    // Nếu item có roles, chỉ role nằm trong danh sách mới được phép
    return item.roles.includes(role)
  })
}

// Kiểm tra xem role có được phép truy cập route không
export const canAccessRoute = (routePath: string, roleName: string | null | undefined): boolean => {
  const role = roleName?.toLowerCase() as RoleName | undefined
  if (!role) {
    return false
  }

  const allItems = getAllNavigationItems()
  const item = allItems.find((item) => item.path === routePath || routePath.startsWith(item.path + '/'))

  if (!item) {
    // Route không có trong danh sách, mặc định chỉ admin được phép
    return role === 'admin'
  }

  // Nếu item không có roles, tất cả roles đều được phép
  if (!item.roles) {
    return true
  }

  // Nếu item có roles, chỉ role nằm trong danh sách mới được phép
  return item.roles.includes(role)
}

