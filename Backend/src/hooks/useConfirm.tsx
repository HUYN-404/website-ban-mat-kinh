import { useState, useCallback } from 'react'
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
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null)

  const confirm = useCallback(
    (opts: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setOptions(opts)
        setOnConfirmCallback(() => () => {
          setIsOpen(false)
          resolve(true)
        })
        setIsOpen(true)
      })
    },
    [],
  )

  const handleCancel = useCallback(() => {
    setIsOpen(false)
    setOnConfirmCallback(null)
  }, [])

  const ConfirmDialog = () => (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={handleCancel}
      onConfirm={() => {
        if (onConfirmCallback) {
          onConfirmCallback()
        }
      }}
      title={options.title}
      message={options.message}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      variant={options.variant}
    />
  )

  return { confirm, ConfirmDialog }
}


