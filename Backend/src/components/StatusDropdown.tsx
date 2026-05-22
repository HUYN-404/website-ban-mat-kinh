import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import type { Order } from '../types/entities'

interface StatusDropdownProps {
  order: Order
  onStatusChange: (order: Order, newStatus: Order['status']) => void
  isUpdating?: boolean
}

const statusConfig: Record<Order['status'], { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Chờ xử lý', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
  paid: { label: 'Đã thanh toán', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  shipped: { label: 'Đang giao', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
  completed: { label: 'Hoàn tất', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  cancelled: { label: 'Đã hủy', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
}

export function StatusDropdown({ order, onStatusChange, isUpdating = false }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentStatus = statusConfig[order.status]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (newStatus: Order['status']) => {
    if (newStatus !== order.status) {
      onStatusChange(order, newStatus)
    }
    setIsOpen(false)
  }

  // Tính toán vị trí dropdown dựa trên button position
  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      menuRef.current.style.top = `${buttonRect.bottom + window.scrollY + 4}px`
      menuRef.current.style.left = `${buttonRect.left + window.scrollX}px`
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
        disabled={isUpdating}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: '8px',
          border: `1px solid ${currentStatus.color}`,
          background: currentStatus.bgColor,
          color: currentStatus.color,
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: isUpdating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: isUpdating ? 0.6 : 1,
          minWidth: 140,
          justifyContent: 'space-between',
        }}
        onMouseEnter={(e) => {
          if (!isUpdating) {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = `0 4px 12px ${currentStatus.color}40`
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <span>{currentStatus.label}</span>
        <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
              zIndex: 9999,
              minWidth: 160,
              overflow: 'hidden',
            }}
          >
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(status as Order['status'])
                }}
                disabled={status === order.status || isUpdating}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  textAlign: 'left',
                  border: 'none',
                  background: status === order.status ? config.bgColor : 'transparent',
                  color: status === order.status ? config.color : 'var(--text)',
                  fontSize: '0.875rem',
                  fontWeight: status === order.status ? 600 : 500,
                  cursor: status === order.status || isUpdating ? 'default' : 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (status !== order.status && !isUpdating) {
                    e.currentTarget.style.background = config.bgColor
                  }
                }}
                onMouseLeave={(e) => {
                  if (status !== order.status) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: config.color,
                    opacity: status === order.status ? 1 : 0.5,
                  }}
                />
                {config.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}

