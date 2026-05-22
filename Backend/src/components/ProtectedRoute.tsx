import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { canAccessRoute } from '../utils/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--bg)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>⏳</div>
          <p style={{ color: 'var(--muted)' }}>Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Kiểm tra quyền truy cập route dựa trên role
  if (!canAccessRoute(location.pathname, user?.roleName)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--bg)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
          <h2 style={{ margin: '0 0 8px', color: 'var(--text)' }}>Không có quyền truy cập</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            Bạn không có quyền truy cập trang này.
          </p>
          <button
            className="button"
            type="button"
            onClick={() => window.history.back()}
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}














