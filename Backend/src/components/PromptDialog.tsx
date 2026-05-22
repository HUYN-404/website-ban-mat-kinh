import { useState, useEffect } from 'react'
import { Edit } from 'lucide-react'
import { Modal } from './Modal'

interface PromptDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string) => void
  title?: string
  message: string
  label?: string
  placeholder?: string
  defaultValue?: string
  type?: 'text' | 'number' | 'email' | 'password'
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  validation?: (value: string) => string | null // Return error message or null if valid
}

export function PromptDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Nhập thông tin',
  message,
  label,
  placeholder,
  defaultValue = '',
  type = 'text',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isLoading = false,
  validation,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setError(null)
    }
  }, [isOpen, defaultValue])

  const handleConfirm = () => {
    if (validation) {
      const validationError = validation(value)
      if (validationError) {
        setError(validationError)
        return
      }
    } else if (!value.trim()) {
      setError('Vui lòng nhập giá trị')
      return
    }

    onConfirm(value)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleConfirm()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div style={{ padding: '8px 0' }}>
        {message && (
          <p style={{ margin: '0 0 20px 0', fontSize: 15, lineHeight: 1.6, color: 'var(--text)' }}>
            {message}
          </p>
        )}
        <div style={{ marginBottom: 20 }}>
          {label && (
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              {label}
            </label>
          )}
          <input
            type={type}
            className="input"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(null)
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            autoFocus
            style={{
              width: '100%',
              ...(error ? { borderColor: '#dc3545' } : {}),
            }}
          />
          {error && (
            <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#dc3545' }}>{error}</p>
          )}
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
            disabled={isLoading || !value.trim()}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}


