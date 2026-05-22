import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'warning',
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  const variantStyles = {
    danger: {
      button: {
        background: '#dc3545',
        color: 'white',
      },
      icon: '#dc3545',
    },
    warning: {
      button: {
        background: '#f59e0b',
        color: 'white',
      },
      icon: '#f59e0b',
    },
    info: {
      button: {
        background: '#3b82f6',
        color: 'white',
      },
      icon: '#3b82f6',
    },
  }

  const style = variantStyles[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
          <AlertTriangle size={24} style={{ color: style.icon, flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--text)' }}>
            {message}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="button"
            onClick={handleConfirm}
            disabled={isLoading}
            style={style.button}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}


