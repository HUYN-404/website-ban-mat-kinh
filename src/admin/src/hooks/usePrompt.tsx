import { useState, useCallback, useRef } from 'react'
import { PromptDialog } from '../components/PromptDialog'

interface PromptOptions {
  title?: string
  message?: string
  label?: string
  placeholder?: string
  defaultValue?: string
  type?: 'text' | 'number' | 'email' | 'password'
  confirmText?: string
  cancelText?: string
  validation?: (value: string) => string | null
}

export function usePrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<PromptOptions>({})
  // Giữ resolver để bấm Hủy cũng trả về null (tránh promise treo vĩnh viễn)
  const resolveRef = useRef<((value: string | null) => void) | null>(null)

  const close = useCallback((value: string | null) => {
    resolveRef.current?.(value)
    resolveRef.current = null
    setIsOpen(false)
  }, [])

  const prompt = useCallback((opts: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setOptions(opts)
      setIsOpen(true)
    })
  }, [])

  const PromptDialogComponent = () => (
    <PromptDialog
      isOpen={isOpen}
      onClose={() => close(null)}
      onConfirm={(value) => close(value)}
      title={options.title}
      message={options.message ?? ''}
      label={options.label}
      placeholder={options.placeholder}
      defaultValue={options.defaultValue}
      type={options.type}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      validation={options.validation}
    />
  )

  return { prompt, PromptDialog: PromptDialogComponent }
}


