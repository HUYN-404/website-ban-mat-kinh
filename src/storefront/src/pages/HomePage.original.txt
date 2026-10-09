import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import HeroSection from '../components/HeroSection'
import ProductCard from '../components/ProductCard'
import SectionHeading from '../components/SectionHeading'
import { useProducts } from '../services/products.service'

const highlightCollections = [
  {
    eyebrow: 'Maison SeeU',
    title: 'Chế tác thủ công',
    description:
      'Từng chi tiết được hoàn thiện bằng tay bởi các nghệ nhân Nhật Bản với tiêu chuẩn khắt khe và độ chính xác tuyệt đối.',
    ctaLabel: 'Quy trình thủ công',
    ctaHref: '/thuong-hieu',
  },
  {
    eyebrow: 'Bảo hành 24 tháng',
    title: 'Dịch vụ hậu mãi',
    description:
      'Đội ngũ tư vấn viên riêng luôn sẵn sàng hỗ trợ, chỉnh sửa form kính và bảo dưỡng định kỳ theo lịch nhắc tự động.',
    ctaLabel: 'Tìm hiểu dịch vụ',
    ctaHref: '/lien-he',
  },
  {
    eyebrow: 'SeeU Privé',
    title: 'Đặc quyền hội viên',
    description:
      'Trải nghiệm đo mắt chuyên sâu, dịch vụ fitting riêng và ưu đãi giới hạn cho từng bộ sưu tập mới nhất.',
    ctaLabel: 'Đăng ký hội viên',
    ctaHref: '/lien-he',
  },
]

// Hàm shuffle mảng (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const HomePage = () => {
  // Fetch products từ API thật
  const { data: allProducts = [], isLoading } = useProducts({
    status: 'available',
  })

  // Random và lấy sản phẩm không trùng nhau
  const { signatureProducts, curatedEdit } = useMemo(() => {
    // Shuffle mảng để random
    const shuffledProducts = shuffleArray(allProducts)
    
    // Lấy 6 sản phẩm đầu tiên (đã random) cho "Gợi ý dành riêng cho bạn"
    const signature = shuffledProducts.slice(0, 6)
    
    // Lấy 4 sản phẩm tiếp theo (không trùng với signature) cho "Cảm hứng chế tác"
    const curated = shuffledProducts.slice(6, 10)
    
    return {
      signatureProducts: signature,
      curatedEdit: curated,
    }
  }, [allProducts])

  return (
    <div className="space-y-24 pb-24">
      <HeroSection />

      <section className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="SeeU Signature"
          title="Gợi ý dành riêng cho bạn"
          description="Khám phá những thiết kế bán chạy nhất được khách hàng yêu thích vì độ hoàn thiện tinh xảo và cảm giác đeo êm nhẹ."
        />

        {isLoading ? (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-neutral-300 bg-white/60 p-16 text-center">
            <h4 className="text-xl font-semibold text-charcoal">Đang tải sản phẩm...</h4>
            <p className="max-w-md text-sm leading-7 text-neutral-600">
              Vui lòng đợi trong giây lát.
            </p>
          </div>
        ) : signatureProducts.length > 0 ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {signatureProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}

        <div className="mt-12 flex items-center justify-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-3 rounded-full border border-neutral-900 px-10 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-900 transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white"
          >
            Xem tất cả sản phẩm
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section className="bg-gradient-to-br from-white via-alabaster to-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {highlightCollections.map((collection) => (
              <article
                key={collection.title}
                className="group rounded-3xl border border-neutral-200/80 bg-white/70 p-8 shadow-sm shadow-black/5 transition duration-500 ease-luxury hover:-translate-y-2 hover:shadow-soft"
              >
                <span className="text-xs uppercase tracking-[0.4em] text-gold-500">{collection.eyebrow}</span>
                <h3 className="mt-4 text-2xl font-semibold text-charcoal">{collection.title}</h3>
                <p className="mt-4 text-sm leading-7 text-neutral-600">{collection.description}</p>
                <Link
                  to={collection.ctaHref}
                  className="mt-8 inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.3em] text-neutral-900 transition group-hover:text-gold-500"
                >
                  {collection.ctaLabel}
                  <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr,1.1fr]">
          <div className="space-y-8">
            <SectionHeading
              eyebrow="SeeU Atelier"
              title="Cảm hứng chế tác"
              description="Chúng tôi đón đầu xu hướng với kỹ thuật chế tác thủ công kết hợp công nghệ đo mắt 3D, đảm bảo mọi chi tiết đều phù hợp với khuôn mặt người châu Á."
            />

            <ul className="space-y-6 text-sm text-neutral-600">
              <li className="flex items-start gap-4">
                <span className="mt-[6px] inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-600">
                  01
                </span>
                <div>
                  <h4 className="text-base font-semibold text-charcoal">Tư vấn hình dáng mặt</h4>
                  <p className="mt-2 leading-7">
                    Các chuyên gia của SeeU sẽ phân tích tỉ lệ gương mặt và phong cách cá nhân để đề xuất dáng kính hoàn hảo.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="mt-[6px] inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-600">
                  02
                </span>
                <div>
                  <h4 className="text-base font-semibold text-charcoal">Đo mắt chuẩn xác</h4>
                  <p className="mt-2 leading-7">
                    Công nghệ đo khúc xạ tân tiến từ Đức cùng dữ liệu đo đa điểm đảm bảo độ chính xác tối ưu cho tròng kính.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="mt-[6px] inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-600">
                  03
                </span>
                <div>
                  <h4 className="text-base font-semibold text-charcoal">Fitting & chăm sóc</h4>
                  <p className="mt-2 leading-7">
                    Dịch vụ fitting cá nhân hóa và bảo dưỡng định kỳ giúp kính luôn ôm sát khuôn mặt và giữ sáng bóng như mới.
                  </p>
                </div>
              </li>
            </ul>

            <Link
              to="/thuong-hieu"
              className="inline-flex items-center gap-3 rounded-full bg-charcoal px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500"
            >
              Hành trình thương hiệu
              <span aria-hidden>→</span>
            </Link>
          </div>

          {curatedEdit.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {curatedEdit.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-charcoal py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <span className="text-xs uppercase tracking-[0.4em] text-gold-400">SeeU Privé Appointment</span>
            <h3 className="text-3xl font-semibold text-white">
              Đặt lịch trải nghiệm phòng fitting riêng cùng chuyên gia kính mắt của chúng tôi.
            </h3>
            <p className="text-sm leading-7 text-neutral-300">
              Buổi tư vấn kéo dài 45 phút bao gồm đo mắt, đánh giá dáng mặt và thử các mẫu kính giới hạn mới nhất.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/lien-he"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-charcoal transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-400 hover:text-white"
            >
              Đặt lịch ngay
              <span aria-hidden>→</span>
            </Link>
            <a
              href="tel:+84901234567"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:border-gold-400 hover:text-gold-200"
            >
              Gọi trực tiếp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
