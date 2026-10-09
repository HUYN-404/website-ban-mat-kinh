import { useEffect, useRef } from 'react'

/**
 * Thanh tiến trình cuộn trang (mảnh, màu gold) ở sát mép trên.
 * - Chỉ animate `transform: scaleX` → không gây reflow (nhẹ RAM).
 * - Ghi trực tiếp vào DOM qua ref → KHÔNG re-render React mỗi lần cuộn.
 * - Chiều cao tài liệu được cache, chỉ đo lại khi resize / sau khi nội dung load.
 */
const ScrollProgress = () => {
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let maxScroll = 0

    const measure = () => {
      maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)
    }

    const handleScroll = () => {
      const bar = barRef.current
      if (!bar) {
        return
      }
      const progress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0
      bar.style.transform = `scaleX(${progress})`
    }

    measure()
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    // Ảnh/dữ liệu load xong có thể làm trang cao thêm → đo lại 1 lần
    const timeoutId = window.setTimeout(measure, 600)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', measure)
      window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[2px]" aria-hidden="true">
      <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-gold-500" />
    </div>
  )
}

export default ScrollProgress
