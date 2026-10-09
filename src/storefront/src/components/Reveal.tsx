import type { CSSProperties, ReactNode } from 'react'

import useInView from '../utils/useInView'

interface RevealProps {
  children: ReactNode
  /** Class phụ — vd className="mx-auto max-w-6xl px-6" để canh layout cho nội dung bên trong */
  className?: string
  /** Trễ (ms) trước khi hiện — dùng để stagger: phần tử thứ i có delay = i * 80 */
  delay?: number
  /** Khoảng dịch lên (px) khi hiện — mặc định 24px, đừng để quá xa (kém sang) */
  y?: number
  /** Phần diện tích phần tử phải lộ ra trước khi kích hoạt (0–1) */
  threshold?: number
}

// Component bọc dùng chung: làm nội dung "hiện dần khi cuộn tới" (reveal-on-scroll).
// - Dùng chung hook useInView (IntersectionObserver) → tiết kiệm, không copy-paste.
// - CHỈ animate transform + opacity → chạy trên GPU, mượt, không tốn RAM.
// - Luôn render 1 thẻ <div> bọc nội dung (giữ cho code đơn giản, dễ hiểu).
// Cách dùng:
//   <Reveal><SectionHeading title="..." /></Reveal>
//   {items.map((it, i) => (
//     <Reveal key={it.id} delay={i * 80}><ProductCard product={it} /></Reveal>
//   ))}
const Reveal = ({
  children,
  className = '',
  delay = 0,
  y = 24,
  threshold = 0.15,
}: RevealProps) => {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold })

  // Chỉ trễ lúc HIỆN (inView = true) để không bị trễ vô nghĩa khi chưa cuộn tới
  const style: CSSProperties = {
    transitionDelay: inView ? `${delay}ms` : '0ms',
    transform: inView ? 'none' : `translateY(${y}px)`,
  }

  return (
    <div
      ref={ref}
      style={style}
      className={`transition duration-700 ease-luxury ${className} ${
        inView ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  )
}

export default Reveal
