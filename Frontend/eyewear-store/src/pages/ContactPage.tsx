import { FiPhone, FiMail, FiMapPin, FiClock } from 'react-icons/fi'
import PageHeader from '../components/PageHeader'

const ContactPage = () => {
  return (
    <div className="pb-20">
      <PageHeader
        eyebrow="Kết nối"
        title="Liên hệ với SeeU Studio"
        description="Đặt lịch tư vấn trực tiếp, nhận báo giá hoặc tìm hiểu thêm về các dịch vụ chăm sóc kính tại SeeU Eyewear."
      />

      <section className="mx-auto mt-16 max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,1fr]">
          {/* Thông tin liên hệ */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-white via-alabaster to-white p-8 shadow-sm shadow-black/5">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-charcoal">Showroom SeeU Atelier</h2>
                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  Không gian trải nghiệm cao cấp với đội ngũ chuyên gia tư vấn tận tâm
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-600">
                    <FiMapPin className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Địa chỉ</p>
                    <p className="mt-1 text-sm leading-7 text-neutral-700">
                      Kim Chung, Hoài Đức, Hà Nội
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-600">
                    <FiPhone className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Hotline</p>
                    <a
                      href="tel:+84901234567"
                      className="mt-1 block text-sm font-medium text-neutral-700 transition hover:text-gold-500"
                    >
                      (+84) 90 123 4567
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-600">
                    <FiMail className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Email</p>
                    <a
                      href="mailto:studio@seeueyewear.vn"
                      className="mt-1 block text-sm font-medium text-neutral-700 transition hover:text-gold-500"
                    >
                      studio@seeueyewear.vn
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-600">
                    <FiClock className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Giờ hoạt động</p>
                    <p className="mt-1 text-sm leading-7 text-neutral-700">
                      Thứ 2 – Chủ nhật, 9:00 – 20:30
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-white to-alabaster p-8 shadow-sm shadow-black/5">
              <h3 className="mb-4 text-lg font-semibold text-charcoal">Dịch vụ nổi bật</h3>
              <ul className="space-y-3 text-sm leading-7 text-neutral-600">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-500" />
                  <span>Đo mắt 3D chuẩn quốc tế với công nghệ hiện đại</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-500" />
                  <span>Fitting cá nhân hoá theo dáng mặt và phong cách</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-500" />
                  <span>Thay tròng chuyên sâu và bảo dưỡng định kỳ miễn phí</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form liên hệ */}
          <form className="space-y-6 rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-white via-white to-alabaster p-8 shadow-soft">
            <div className="space-y-2">
              <label htmlFor="fullname" className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Họ và tên
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                placeholder="Nguyễn Thị An"
                className="h-12 w-full rounded-full border border-neutral-300 bg-white px-5 text-sm text-neutral-800 transition focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(+84) 90 123 4567"
                  className="h-12 w-full rounded-full border border-neutral-300 bg-white px-5 text-sm text-neutral-800 transition focus:border-gold-400 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ban@seeueyewear.vn"
                  className="h-12 w-full rounded-full border border-neutral-300 bg-white px-5 text-sm text-neutral-800 transition focus:border-gold-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="service" className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Nhu cầu
              </label>
              <select
                id="service"
                name="service"
                className="h-12 w-full rounded-full border border-neutral-300 bg-white px-5 text-sm text-neutral-800 transition focus:border-gold-400 focus:outline-none"
              >
                <option>Đặt lịch đo mắt</option>
                <option>Tư vấn chọn kính</option>
                <option>Hỗ trợ bảo hành</option>
                <option>Yêu cầu báo giá</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Ghi chú thêm
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Chia sẻ nhu cầu và thời gian phù hợp để SeeU sắp xếp lịch hẹn."
                className="w-full rounded-3xl border border-neutral-300 bg-white px-5 py-4 text-sm text-neutral-800 transition focus:border-gold-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-charcoal py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500"
            >
              Gửi yêu cầu
            </button>

            <p className="text-xs text-neutral-500">
              Bằng việc gửi thông tin, bạn đồng ý để SeeU Eyewear liên hệ tư vấn qua điện thoại hoặc email.
            </p>
          </form>
        </div>

        {/* Google Map - Tích hợp liền mạch */}
        <div className="mt-20">
          <div className="mb-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-gold-500">Vị trí</span>
            <h2 className="mt-3 text-3xl font-semibold text-charcoal">Tìm đường đến SeeU Studio</h2>
            <p className="mt-3 text-sm text-neutral-600">
              Ghé thăm showroom của chúng tôi tại Kim Chung, Hoài Đức, Hà Nội
            </p>
          </div>
          
          <div className="group relative overflow-hidden rounded-3xl border border-neutral-200/80 shadow-lg shadow-black/10 transition duration-500 ease-luxury hover:shadow-xl hover:shadow-black/15">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <iframe
              src={`https://www.google.com/maps?q=Kim+Chung,+Hoài+Đức,+Hà+Nội&output=embed`}
              width="100%"
              height="500"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="SeeU Studio - Kim Chung, Hoài Đức, Hà Nội"
              className="relative w-full transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </div>
          
          <div className="mt-6 flex items-center justify-center">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Kim+Chung,+Hoài+Đức,+Hà+Nội"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition duration-300 ease-luxury hover:-translate-y-0.5 hover:border-gold-400 hover:bg-gold-50 hover:text-gold-600"
            >
              <FiMapPin className="text-base" />
              Mở trên Google Maps
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage

