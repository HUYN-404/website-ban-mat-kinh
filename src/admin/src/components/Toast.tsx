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
    success: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', text: '#065f46', icon: 'var(--success)' },
    error: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', text: '#991b1b', icon: 'var(--danger)' },
    warning: { bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.32)', text: '#92400e', icon: 'var(--warning)' },
    info: { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', text: '#4338ca', icon: 'var(--primary)' },
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
        className="icon-button"
        style={{ width: 28, height: 28, borderRadius: 8 }}
        aria-label="Đóng thông báo"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default ToastContainer

