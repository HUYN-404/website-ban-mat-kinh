import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        top: 24,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  }
  onRemove: () => void
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '#22c55e' },
    error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '#ef4444' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '#f59e0b' },
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: '#3b82f6' },
  }

  const Icon = icons[toast.type]
  const color = colors[toast.type]

  return (
    <div
      className="glass-card"
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '16px 20px',
        minWidth: 320,
        maxWidth: 480,
        border: `1px solid ${color.border}`,
        backgroundColor: color.bg,
        color: color.text,
        animation: 'slideInRight 0.3s ease-out',
      }}
      role="alert"
      aria-live="polite"
    >
      <Icon size={20} style={{ flexShrink: 0, marginTop: 2, color: color.icon }} />
      <p style={{ flex: 1, margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onRemove}
        className="button secondary"
        style={{
          minWidth: 24,
          padding: 4,
          flexShrink: 0,
          opacity: 0.7,
        }}
        aria-label="Đóng thông báo"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default ToastContainer

