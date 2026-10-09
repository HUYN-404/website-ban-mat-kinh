import { HiMiniCheckCircle, HiMiniXCircle, HiMiniExclamationTriangle, HiMiniInformationCircle, HiMiniXMark } from 'react-icons/hi2'
import { useToast } from '../contexts/ToastContext'

const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="fixed right-6 top-6 z-[100] flex flex-col gap-3 pointer-events-none">
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
    success: HiMiniCheckCircle,
    error: HiMiniXCircle,
    warning: HiMiniExclamationTriangle,
    info: HiMiniInformationCircle,
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  }

  const Icon = icons[toast.type]

  return (
    <div
      className={`
        pointer-events-auto
        flex items-start gap-3
        rounded-2xl border
        px-5 py-4
        shadow-2xl shadow-black/20
        backdrop-blur-sm
        max-w-md
        animate-slide-in-right
        ${colors[toast.type]}
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`mt-0.5 flex-shrink-0 text-xl ${iconColors[toast.type]}`} />
      <p className="flex-1 text-sm font-medium leading-6">{toast.message}</p>
      <button
        type="button"
        onClick={onRemove}
        className="mt-0.5 flex-shrink-0 rounded-full p-1 transition hover:bg-black/10"
        aria-label="Đóng thông báo"
      >
        <HiMiniXMark className="text-lg" />
      </button>
    </div>
  )
}

export default ToastContainer


