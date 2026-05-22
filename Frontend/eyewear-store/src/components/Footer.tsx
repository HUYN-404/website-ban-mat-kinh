import { Link } from 'react-router-dom'
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa6'
import { FiMail, FiPhone } from 'react-icons/fi'

const socialLinks = [
  { icon: FaFacebookF, label: 'Facebook', href: 'https://facebook.com' },
  { icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: FaTiktok, label: 'TikTok', href: 'https://tiktok.com' },
]

const quickLinks = [
  { label: 'Về SeeU Eyewear', href: '/thuong-hieu' },
  { label: 'Chính sách bảo hành', href: '/lien-he' },
  { label: 'Hướng dẫn bảo quản', href: '/products' },
  { label: 'Tuyển dụng', href: '/lien-he' },
]

const Footer = () => {
  return (
    <footer className="mt-24 bg-charcoal text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="space-y-5">
            <span className="text-2xl font-semibold uppercase tracking-[0.5em]">SEEU</span>
            <p className="text-sm leading-7 text-neutral-300">
              SeeU Eyewear mang đến trải nghiệm kính mắt cao cấp với những thiết kế độc quyền được chế tác thủ công, dành riêng
              cho phong cách sống hiện đại.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition duration-300 ease-luxury hover:-translate-y-1 hover:border-gold-500 hover:text-gold-300"
                >
                  <Icon className="text-lg" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.4em] text-gold-400">Liên hệ</h4>
            <div className="space-y-3 text-sm text-neutral-300">
              <p>Showroom SeeU Atelier, 26 Lý Tự Trọng, Quận 1, TP. HCM</p>
              <p className="flex items-center gap-3">
                <FiPhone className="text-base" />
                <a href="tel:+84901234567" className="transition hover:text-gold-300">
                  (+84) 90 123 4567
                </a>
              </p>
              <p className="flex items-center gap-3">
                <FiMail className="text-base" />
                <a href="mailto:studio@annaeyewear.vn" className="transition hover:text-gold-300">
                  studio@annaeyewear.vn
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.4em] text-gold-400">Liên kết nhanh</h4>
            <ul className="space-y-3 text-sm text-neutral-300">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="transition hover:text-gold-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.4em] text-gold-400">Đăng ký tư vấn</h4>
            <p className="text-sm text-neutral-300">
              Nhận thông tin bộ sưu tập mới và ưu đãi đặc quyền dành cho hội viên SeeU Privé.
            </p>
            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="h-11 rounded-full border border-white/30 bg-transparent px-5 text-sm text-white placeholder:text-neutral-400 focus:border-gold-400 focus:outline-none"
              />
              <button
                type="submit"
                className="h-11 rounded-full bg-white text-sm font-semibold uppercase tracking-[0.3em] text-charcoal transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-400 hover:text-white"
              >
                Đăng ký
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-6 text-xs uppercase tracking-[0.3em] text-neutral-400 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} SeeU Eyewear. All Rights Reserved.</span>
          <span>Thiết kế & phát triển bởi SeeU Studio</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer

