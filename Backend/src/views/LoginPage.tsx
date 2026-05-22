import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at top, rgba(79,70,229,0.25), transparent 55%), var(--bg)',
      }}
    >
      <div
        className="glass-card"
        style={{ maxWidth: 420, width: '100%', padding: 32, borderRadius: 24 }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Đăng nhập SeeU Studio</h2>
        <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: 24 }}>
          Sử dụng tài khoản quản trị nội bộ để truy cập dashboard.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'grid', gap: 16 }}
        >
          {error && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Tên đăng nhập</span>
            <input
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="seeu.admin"
              type="text"
              required
              disabled={isLoading}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Mật khẩu</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </label>
          <button
            className="button"
            type="submit"
            style={{ justifyContent: 'center' }}
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Vào dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
