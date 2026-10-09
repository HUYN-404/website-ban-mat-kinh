import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type FilterOption<T extends string> = { value: T; label: string }

type FilterSelectProps<T extends string> = {
  value: T
  options: FilterOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  minWidth?: number
}

/**
 * Dropdown lọc tự vẽ — thay `<select>` gốc của trình duyệt.
 *
 * Vì sao không dùng `<select>`: menu của nó do hệ điều hành vẽ (nền xanh, font hệ thống)
 * nên không style được theo tông gold của admin, và không hiện được dấu ✓ ở mục đang chọn.
 */
export function FilterSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  minWidth = 210,
}: FilterSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const current = options.find((option) => option.value === value) ?? options[0]

  // Đóng menu khi bấm ra ngoài hoặc bấm Esc (thói quen của người dùng)
  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="filter-select" ref={boxRef} style={{ minWidth }}>
      <button
        type="button"
        className={open ? 'filter-select-button open' : 'filter-select-button'}
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span>{current?.label}</span>
        <ChevronDown size={16} className="filter-select-chevron" />
      </button>

      {open && (
        <ul className="filter-select-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={
                  option.value === value ? 'filter-select-option active' : 'filter-select-option'
                }
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span>{option.label}</span>
                {option.value === value && <Check size={15} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
