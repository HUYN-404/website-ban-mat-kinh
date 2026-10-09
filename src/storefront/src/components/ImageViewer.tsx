import { useEffect, useState } from 'react'
import { HiMiniXMark, HiMiniChevronLeft, HiMiniChevronRight } from 'react-icons/hi2'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Zoom, Keyboard, FreeMode, Thumbs } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/zoom'
import 'swiper/css/free-mode'
import 'swiper/css/thumbs'

interface ImageViewerProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  initialIndex?: number
  productName?: string
}

const ImageViewer = ({ isOpen, onClose, images, initialIndex = 0, productName = 'Sản phẩm' }: ImageViewerProps) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, initialIndex])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else if (event.key === 'ArrowRight' && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, images.length, onClose])

  if (!isOpen || images.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh sản phẩm"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-7xl max-h-[90vh] p-4 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-50 flex items-center justify-center rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 md:right-8 md:top-8"
          aria-label="Đóng"
        >
          <HiMiniXMark className="text-2xl" />
        </button>

        {/* Image counter */}
        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm md:top-8">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Main Swiper */}
        <div className="h-full w-full">
          <Swiper
            onSwiper={setMainSwiper}
            modules={[Navigation, Zoom, Keyboard, FreeMode, Thumbs]}
            spaceBetween={20}
            slidesPerView={1}
            zoom={{
              maxRatio: 3,
              minRatio: 1,
            }}
            keyboard={{
              enabled: true,
            }}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
            initialSlide={initialIndex}
            className="h-full w-full"
          >
            {images.map((image, index) => (
              <SwiperSlide key={index} className="flex items-center justify-center">
                <div className="swiper-zoom-container flex h-full w-full items-center justify-center">
                  <img
                    src={image}
                    alt={`${productName} - Ảnh ${index + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="swiper-button-prev-custom absolute left-4 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed md:left-8"
              aria-label="Ảnh trước"
              disabled={currentIndex === 0}
            >
              <HiMiniChevronLeft className="text-2xl" />
            </button>
            <button
              type="button"
              className="swiper-button-next-custom absolute right-4 top-1/2 z-50 -translate-y-1/2 flex items-center justify-center rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed md:right-8"
              aria-label="Ảnh sau"
              disabled={currentIndex === images.length - 1}
            >
              <HiMiniChevronRight className="text-2xl" />
            </button>
          </>
        )}

        {/* Thumbnail navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4 md:bottom-8">
            <Swiper
              onSwiper={setThumbsSwiper}
              modules={[FreeMode, Thumbs]}
              spaceBetween={12}
              slidesPerView="auto"
              freeMode
              watchSlidesProgress
              className="image-viewer-thumbs"
            >
              {images.map((image, index) => (
                <SwiperSlide
                  key={index}
                  className="!w-auto cursor-pointer rounded-lg border-2 border-transparent opacity-50 transition hover:opacity-100 data-[active=true]:border-white data-[active=true]:opacity-100"
                  data-active={currentIndex === index}
                  onClick={() => {
                    if (mainSwiper) {
                      mainSwiper.slideTo(index)
                      setCurrentIndex(index)
                    }
                  }}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-20 w-20 rounded-md object-cover md:h-24 md:w-24"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageViewer

