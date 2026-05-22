import { useState, useCallback } from 'react'
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
  const [onConfirmCallback, setOnConfirmCallback] = useState<((value: string) => void) | null>(null)

  const prompt = useCallback(
    (opts: PromptOptions): Promise<string | null> => {
      return new Promise((resolve) => {
        setOptions(opts)
        setOnConfirmCallback(() => (value: string) => {
          setIsOpen(false)
          resolve(value)
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

  const PromptDialogComponent = () => (
    <PromptDialog
      isOpen={isOpen}
      onClose={handleCancel}
      onConfirm={(value) => {
        if (onConfirmCallback) {
          onConfirmCallback(value)
        }
      }}
      title={options.title}
      message={options.message}
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


