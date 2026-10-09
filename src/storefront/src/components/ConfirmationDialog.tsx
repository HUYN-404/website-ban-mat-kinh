import { HiMiniExclamationTriangle, HiMiniXMark } from 'react-icons/hi2'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  isLoading = false,
}: ConfirmationDialogProps) => {
  if (!isOpen) return null

  const variants = {
    danger: {
      icon: 'text-red-600',
      iconBg: 'bg-red-50',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-50',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'text-blue-600',
      iconBg: 'bg-blue-50',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const currentVariant = variants[variant]

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-md px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-2xl shadow-black/20 animate-scale-in">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className={`flex-shrink-0 rounded-full p-3 ${currentVariant.iconBg}`}>
                <HiMiniExclamationTriangle className={`text-2xl ${currentVariant.icon}`} />
              </div>
              <div className="flex-1">
                <h3
                  id="dialog-title"
                  className="text-lg font-semibold text-charcoal"
                >
                  {title}
                </h3>
                <p
                  id="dialog-message"
                  className="mt-2 text-sm leading-7 text-neutral-600"
                >
                  {message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Đóng"
              disabled={isLoading}
            >
              <HiMiniXMark className="text-xl" />
            </button>
          </div>

          <div className="mt-8 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-700 transition duration-300 ease-luxury hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury disabled:opacity-50 disabled:cursor-not-allowed ${currentVariant.button}`}
            >
              {isLoading ? 'Đang xử lý...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog


