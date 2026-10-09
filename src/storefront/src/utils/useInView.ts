import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  /** Phần diện tích phần tử phải lộ ra trong viewport thì mới "inView" (mặc định 0.15) */
  threshold?: number
  /** Mở rộng/thu hẹp vùng quan sát quanh viewport, vd '0px 0px -10% 0px' */
  rootMargin?: string
  /** true = chỉ báo 1 lần rồi ngắt quan sát (tiết kiệm tài nguyên) */
  once?: boolean
}

// Hook dùng chung: cho biết phần tử (gắn vào `ref`) đã vào viewport chưa.
// Dùng IntersectionObserver — trình duyệt tự tối ưu, KHÔNG cần listener scroll.
// Mọi scroll-effect (reveal, đổi nội dung khi cuộn...) trong project nên dùng hook
// này thay vì tự viết lại trong từng component (DRY).
const useInView = <T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
) => {
  const { threshold = 0.15, rootMargin = '0px', once = true } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Trình duyệt quá cũ / không hỗ trợ IntersectionObserver
    // → hiển thị luôn để không chặn nội dung
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          // once: hiện xong là ngắt quan sát luôn → không tốn công theo dõi tiếp
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, inView }
}

export default useInView
