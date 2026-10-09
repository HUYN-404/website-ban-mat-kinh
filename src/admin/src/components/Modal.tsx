import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Lưu scroll position hiện tại
      const scrollY = window.scrollY
      // Khóa scroll của body
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
      
      // Lưu scroll position vào data attribute để khôi phục sau
      document.body.setAttribute('data-scroll-y', scrollY.toString())
    } else {
      // Khôi phục scroll position
      const savedScrollY = document.body.getAttribute('data-scroll-y')
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.removeAttribute('data-scroll-y')
      
      if (savedScrollY) {
        window.scrollTo(0, parseInt(savedScrollY, 10))
      }
    }
    
    return () => {
      // Cleanup khi component unmount
      if (isOpen) {
        const savedScrollY = document.body.getAttribute('data-scroll-y')
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.width = ''
        document.body.removeAttribute('data-scroll-y')
        
        if (savedScrollY) {
          window.scrollTo(0, parseInt(savedScrollY, 10))
        }
      }
    }
  }, [isOpen])

  // Bảng kích thước thật (px) — admin dùng CSS thuần, không có class max-w-* của Tailwind
  const sizeWidths: Record<NonNullable<ModalProps['size']>, string> = {
    sm: '26rem',
    md: '40rem',
    lg: '54rem',
    xl: '70rem',
  }

  // Đóng bằng phím Escape (UX chuẩn)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Render modal ra ngoài layout (vào document.body) bằng Portal
  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        overflow: 'hidden',
        // Đảm bảo overlay không bị ảnh hưởng bởi scroll của page
        overscrollBehavior: 'contain',
      }}
    >
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: sizeWidths[size],
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 1001,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body, // Render trực tiếp vào body, không nằm trong layout có sidebar
  )
}


