import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  BoxesIcon,
  ChartSpline,
  ClipboardList,
  CreditCard,
  Cuboid,
  Factory,
  Grid,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackageSearch,
  ShoppingCart,
  ShoppingBasket,
  Users,
  Tags,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext'
import { getNavigationItemsForRole } from '../utils/permissions'

// Mapping icon cho từng route
const iconMap: Record<string, any> = {
  '/': LayoutDashboard,
  '/users': Users,
  '/roles': Grid,
  '/categories': Layers3,
  '/brands': BriefcaseBusiness,
  '/suppliers': Factory,
  '/products': Package,
  '/product-images': PackageSearch,
  '/inventory': Boxes,
  '/inventory-transactions': BoxesIcon,
  '/orders': ShoppingBasket,
  '/order-items': ClipboardList,
  '/payments': CreditCard,
  '/carts': ShoppingCart,
  '/cart-items': Cuboid,
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const sidebarRef = useRef<HTMLElement>(null)

  // Lọc navigation items dựa trên role
  const navigation = getNavigationItemsForRole(user?.roleName).map((item) => ({
    ...item,
    icon: iconMap[item.path] || LayoutDashboard,
  }))

  // Đóng sidebar khi click outside (chỉ trên mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Kiểm tra nếu không phải là button Menu
        const target = event.target as HTMLElement
        if (!target.closest('.menu-toggle-button')) {
          setSidebarOpen(false)
        }
      }
    }

    // Chỉ thêm listener trên mobile (< 960px)
    const mediaQuery = window.matchMedia('(max-width: 960px)')
    if (mediaQuery.matches && sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen])

  // Khóa scroll body khi sidebar mở trên mobile
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 960px)')
    if (mediaQuery.matches) {
      if (sidebarOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.username?.slice(0, 2).toUpperCase() || 'A'
  }

  return (
    <div className="app-shell">
      {/* Overlay cho mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={() => setSidebarOpen(false)}
        />
      )}
      
      <aside ref={sidebarRef} className={clsx('sidebar', sidebarOpen && 'open')}>
        <div className="brand">
          <ChartSpline size={20} />
          SeeU Studio
          <button
            className="sidebar-close-button"
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav>
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="button secondary menu-toggle-button"
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            style={{ display: 'inline-flex' }}
            aria-label="Mở menu"
          >
            <Menu size={18} />
            Menu
          </button>

          <div className="topbar-search">
            <Tags size={18} />
            <input placeholder="Tìm kiếm nhanh (Ctrl + K)" />
          </div>

          <div className="topbar-actions">
            <div className="avatar-chip">
              <span>{getUserInitials()}</span>
              <div>
                <strong>{user?.fullName || user?.username || 'User'}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {user?.roleName || 'Admin'} • {location.pathname}
                </div>
              </div>
            </div>
            <button className="button secondary" type="button" onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
