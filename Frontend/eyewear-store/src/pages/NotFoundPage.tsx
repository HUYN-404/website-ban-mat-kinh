import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-sm uppercase tracking-[0.4em] text-gold-500">404</span>
      <h1 className="text-3xl font-semibold text-charcoal sm:text-4xl">Không tìm thấy nội dung bạn yêu cầu</h1>
      <p className="max-w-xl text-sm leading-7 text-neutral-600">
        Có thể liên kết đã thay đổi hoặc sản phẩm không còn tồn tại. Vui lòng quay lại trang chủ hoặc khám phá các bộ sưu tập khác.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-3 rounded-full bg-charcoal px-7 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500"
        >
          Về trang chủ
        </Link>
        <Link
          to="/products"
          className="inline-flex items-center gap-3 rounded-full border border-neutral-900 px-7 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-900 transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white"
        >
          Xem bộ sưu tập
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage


