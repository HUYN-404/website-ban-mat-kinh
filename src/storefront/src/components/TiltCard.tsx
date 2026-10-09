import type { MouseEvent, ReactNode } from 'react'
import { useRef } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'

interface TiltCardProps {
  children: ReactNode
  /** Class phụ (vd canh layout) */
  className?: string
  /** Góc nghiêng tối đa (độ). Mặc định 7 — nhẹ nhàng, không "lắc lư" */
  maxTilt?: number
  /** Phóng to nhẹ khi hover để nổi khỏi nền. Mặc định 1.02 */
  scale?: number
  /** Bật lớp sáng (glare) bám theo hướng chuột — như ánh sáng chiếu lên bề mặt kính */
  glare?: boolean
}

// Card nghiêng 3D theo chuột, mượt như lò xo (dùng spring của framer-motion).
// - CHỈ animate transform (rotateX/rotateY/scale) → chạy trên GPU, không reflow, không tốn RAM.
// - Tôn trọng prefers-reduced-motion: bỏ nghiêng để tránh chóng mặt.
// Cách dùng:
//   <TiltCard glare><img src={...} alt="" /></TiltCard>
const TiltCard = ({
  children,
  className = '',
  maxTilt = 7,
  scale = 1.02,
  glare = false,
}: TiltCardProps) => {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  // Vị trí chuột tính theo tỉ lệ (0..1) so với card
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)

  // Lò xo làm mượt góc nghiêng (không "giật" theo từng pixel chuột)
  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), {
    stiffness: 200,
    damping: 20,
  })
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), {
    stiffness: 200,
    damping: 20,
  })

  // Glare: vệt sáng hình tròn bám theo hướng chuột
  const glareX = useTransform(px, [0, 1], [0, 100])
  const glareY = useTransform(py, [0, 1], [0, 100])
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.28), rgba(255,255,255,0) 55%)`

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }

  const reset = () => {
    px.set(0.5)
    py.set(0.5)
  }

  // Người dùng đã tắt hiệu ứng chuyển động → trả về div thường, không nghiêng
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={{ perspective: 1000 }}
      className={className}
    >
      <motion.div
        style={{ rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}
        className="relative h-full w-full"
      >
        {children}
        {glare ? (
          <motion.span
            aria-hidden="true"
            style={{ backgroundImage: glareBackground }}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
          />
        ) : null}
      </motion.div>
    </div>
  )
}

export default TiltCard
