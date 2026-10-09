import { Navigate, useLocation } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
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
          <Loader2
            size={40}
            className="spinner"
            style={{ margin: '0 auto 12px', color: 'var(--primary)' }}
          />
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
          <div
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={32} style={{ color: 'var(--primary)' }} />
          </div>
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














