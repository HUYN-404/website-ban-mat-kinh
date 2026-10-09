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
  pending: { label: 'Chờ xử lý', color: 'var(--warning)', bgColor: 'rgba(245, 158, 11, 0.15)' },
  paid: { label: 'Đã thanh toán', color: 'var(--primary)', bgColor: 'rgba(99, 102, 241, 0.14)' },
  refund_requested: { label: 'Chờ hoàn tiền', color: '#d97706', bgColor: 'rgba(217, 119, 6, 0.16)' },
  shipped: { label: 'Đã gửi hàng', color: '#7c3aed', bgColor: 'rgba(124, 58, 237, 0.14)' },
  in_transit: { label: 'Đang vận chuyển', color: '#4f46e5', bgColor: 'rgba(79, 70, 229, 0.14)' },
  completed: { label: 'Hoàn tất', color: 'var(--success)', bgColor: 'rgba(16, 185, 129, 0.15)' },
  cancelled: { label: 'Đã hủy', color: 'var(--danger)', bgColor: 'rgba(239, 68, 68, 0.15)' },
  refunded: { label: 'Đã hoàn tiền', color: '#0d9488', bgColor: 'rgba(13, 148, 136, 0.16)' },
  returned: { label: 'Đã trả hàng', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.16)' },
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

  // Vị trí menu: đang dùng position: fixed → phải tính theo toạ độ VIEWPORT.
  // (Bản cũ cộng window.scrollX/scrollY nên menu bị lệch và “trôi” khi cuộn trang.)
  useEffect(() => {
    if (!isOpen || !buttonRef.current || !menuRef.current) return

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 180
    const menuHeight = menuRef.current.offsetHeight || 320

    const left = Math.min(Math.max(buttonRect.left, 8), window.innerWidth - menuWidth - 8)

    // Thiếu chỗ phía dưới → lật menu lên trên cho khỏi bị cắt
    const spaceBelow = window.innerHeight - buttonRect.bottom
    const top =
      spaceBelow < menuHeight + 12
        ? Math.max(8, buttonRect.top - menuHeight - 4)
        : buttonRect.bottom + 4

    menuRef.current.style.top = `${top}px`
    menuRef.current.style.left = `${left}px`
  }, [isOpen])

  // Cuộn trang (kể cả cuộn trong vùng bảng) / đổi kích thước / nhấn Esc → đóng menu
  useEffect(() => {
    if (!isOpen) return

    const close = () => setIsOpen(false)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    // capture: true để bắt được sự kiện scroll của mọi container bên trong
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', handleKeyDown)
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
              minWidth: 180,
              maxHeight: '60vh',
              overflowY: 'auto',
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

