import { Link } from 'react-router-dom'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import heroOne from '../assets/hero/hero-1.svg'
import heroTwo from '../assets/hero/hero-2.svg'
import heroThree from '../assets/hero/hero-3.svg'

import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'

interface HeroSlide {
  id: string
  image: string
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
}

const slides: HeroSlide[] = [
  {
    id: 'atelier',
    image: heroOne,
    eyebrow: 'BST Signature 2025',
    title: 'Tinh hoa chế tác kính mắt cao cấp',
    description:
      'Khám phá những thiết kế độc quyền được chế tác thủ công với chất liệu titanium và vàng champagne, dành riêng cho phong cách hiện đại.',
    ctaLabel: 'Khám phá BST',
    ctaHref: '/products',
  },
  {
    id: 'heritage',
    image: heroTwo,
    eyebrow: 'SeeU Heritage',
    title: 'Hơi thở cổ điển hòa quyện đương đại',
    description:
      'Các thiết kế browline và aviator kinh điển được tái sinh với đường nét tinh giản cùng chất liệu cao cấp từ Ý và Nhật Bản.',
    ctaLabel: 'Xem bộ sưu tập nam',
    ctaHref: '/kinh-nam',
  },
  {
    id: 'atelier-femme',
    image: heroThree,
    eyebrow: 'SeeU Atelier Femme',
    title: 'Vẻ đẹp mềm mại, chuẩn mực hoàn hảo',
    description:
      'Những đường cong nữ tính kết hợp gam màu tinh tế giúp tôn vinh thần thái quý phái và phong cách riêng của bạn.',
    ctaLabel: 'Chọn kính nữ',
    ctaHref: '/kinh-nu',
  },
]

const HeroSection = () => {
  return (
    <section className="relative bg-white pb-8">
      <div
        className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-0 sm:px-6">
        <div className="relative rounded-[36px]">
          <Swiper
            modules={[Autoplay, EffectFade, Pagination]}
            effect="fade"
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{
              clickable: true,
              el: '.hero-swiper-pagination',
              bulletClass: 'hero-swiper-bullet',
              bulletActiveClass: 'hero-swiper-bullet-active',
            }}
            loop
            speed={900}
            className="hero-swiper"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id} className="!h-auto">
                <article className="grid h-[70vh] min-h-[560px] w-full grid-cols-1 overflow-hidden rounded-[36px] border border-neutral-200/80 bg-white shadow-soft lg:grid-cols-2">
                  {/* LEFT CONTENT */}
                  <div className="relative order-2 flex flex-col justify-center px-8 py-12 sm:px-14 lg:order-1 lg:py-16">
                    <span className="text-sm uppercase tracking-[0.4em] text-gold-500">
                      {slide.eyebrow}
                    </span>

                    <h1 className="mt-6 text-4xl font-semibold leading-tight text-charcoal sm:text-5xl">
                      {slide.title}
                    </h1>

                    <p className="mt-6 text-lg leading-8 text-neutral-600">
                      {slide.description}
                    </p>

                    <div className="mt-10 flex flex-wrap items-center gap-4">
                      <Link
                        to={slide.ctaHref}
                        className="inline-flex items-center gap-3 rounded-full bg-charcoal px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500"
                      >
                        {slide.ctaLabel}
                        <span aria-hidden>→</span>
                      </Link>

                      <Link
                        to="/thuong-hieu"
                        className="inline-flex items-center gap-3 rounded-full border border-neutral-900 px-7 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-900 transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white"
                      >
                        Tư vấn cá nhân
                      </Link>
                    </div>
                  </div>

                  {/* RIGHT IMAGE */}
                  <div className="relative order-1 overflow-hidden bg-alabaster lg:order-2">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="h-full w-full object-cover transition duration-[2000ms] ease-luxury hover:scale-105"
                    />

                    <div
                      className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-transparent"
                      aria-hidden="true"
                    />
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="hero-swiper-pagination" />
        </div>
      </div>
    </section>
  )
}

export default HeroSection
