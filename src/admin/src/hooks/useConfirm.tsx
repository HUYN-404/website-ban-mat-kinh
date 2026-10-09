import { useState, useCallback, useRef } from 'react'
import { ConfirmationDialog } from '../components/ConfirmationDialog'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' })
  // Giữ resolver để bấm Hủy cũng trả về false (tránh promise treo vĩnh viễn)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const close = useCallback((value: boolean) => {
    resolveRef.current?.(value)
    resolveRef.current = null
    setIsOpen(false)
  }, [])

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setOptions(opts)
      setIsOpen(true)
    })
  }, [])

  const ConfirmDialog = () => (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={() => close(false)}
      onConfirm={() => close(true)}
      title={options.title}
      message={options.message}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      variant={options.variant}
    />
  )

  return { confirm, ConfirmDialog }
}


