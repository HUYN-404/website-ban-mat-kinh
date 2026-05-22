import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import type { ReactNode } from 'react'

interface ScrollToTopProps {
  children?: ReactNode
}

const ScrollToTop = ({ children }: ScrollToTopProps) => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return children ?? null
}

export default ScrollToTop

