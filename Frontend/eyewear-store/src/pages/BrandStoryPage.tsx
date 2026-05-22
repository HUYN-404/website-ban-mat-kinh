import { Link } from 'react-router-dom'

import PageHeader from '../components/PageHeader'

const milestones = [
  {
    year: '2015',
    title: 'Khởi nguồn tại Sài Gòn',
    description:
      'SeeU Eyewear được thành lập với sứ mệnh mang đến kính mắt chuẩn quốc tế nhưng phù hợp tỉ lệ gương mặt châu Á.',
  },
  {
    year: '2018',
    title: 'Hợp tác với nghệ nhân Nhật',
    description:
      'Ký kết hợp tác độc quyền với xưởng chế tác tại Fukui, Nhật Bản để đảm bảo chất lượng hoàn thiện vượt trội.',
  },
  {
    year: '2021',
    title: 'Ra mắt SeeU Atelier',
    description:
      'Không gian trải nghiệm cá nhân hóa đầu tiên với phòng fitting riêng, dịch vụ đo mắt 3D và bộ sưu tập giới hạn.',
  },
  {
    year: '2024',
    title: 'Expérience Privé',
    description:
      'Chương trình hội viên cao cấp mang đến đặc quyền chỉnh sửa định kỳ, bảo hành trọn đời và chế tác theo yêu cầu.',
  },
]

const BrandStoryPage = () => {
  return (
    <div className="pb-20">
      <PageHeader
        eyebrow="SeeU Eyewear"
        title="Hành trình thương hiệu"
        description="Từ một studio nhỏ tại Sài Gòn đến thương hiệu kính mắt cao cấp được yêu thích bởi giới mộ điệu, SeeU luôn giữ vững triết lý: tinh xảo, chuẩn xác và mang đậm dấu ấn cá nhân."
        background="gold"
      />

      <section className="mx-auto mt-16 max-w-5xl space-y-16 px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr,1fr]">
          <div className="space-y-6 text-neutral-600">
            <h2 className="text-3xl font-semibold text-charcoal">Tinh thần thẩm mỹ đậm chất SeeU</h2>
            <p className="leading-7">
              Mỗi chiếc kính là kết tinh của hơn 120 công đoạn thủ công, từ lựa chọn vật liệu cao cấp đến thử nghiệm nhiều lần để đảm bảo sự cân bằng hoàn hảo. Đội ngũ thiết kế của chúng tôi không ngừng tìm kiếm cảm hứng từ kiến trúc, nghệ thuật và phong cách sống đương đại.
            </p>
            <p className="leading-7">
              Từng nét cong, từng điểm chạm đều hướng đến việc tôn vinh đường nét khuôn mặt Á Đông, mang lại sự tự tin và cảm giác đeo nhẹ như không.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200/80 bg-white/70 p-8 shadow-sm shadow-black/5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-gold-500">Giá trị cốt lõi</h3>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-neutral-600">
              <li>
                <span className="font-semibold text-charcoal">Chất liệu cao cấp:</span> titanium, vàng champagne 18K, acetate sinh học từ Ý.
              </li>
              <li>
                <span className="font-semibold text-charcoal">Chuẩn xác tuyệt đối:</span> đo mắt đa điểm và fitting theo yêu cầu.
              </li>
              <li>
                <span className="font-semibold text-charcoal">Tinh giản hiện đại:</span> thiết kế tối giản nhưng đầy tính biểu cảm.
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200/80 bg-white/80 p-10 shadow-sm shadow-black/5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-neutral-500">Cột mốc đáng nhớ</h3>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            {milestones.map((milestone) => (
              <div key={milestone.year} className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-gold-500">
                  {milestone.year}
                </span>
                <h4 className="text-xl font-semibold text-charcoal">{milestone.title}</h4>
                <p className="text-sm leading-7 text-neutral-600">{milestone.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr,1.1fr]">
          <div className="rounded-3xl bg-charcoal p-10 text-white">
            <span className="text-xs uppercase tracking-[0.4em] text-gold-300">SeeU Privé Studio</span>
            <h3 className="mt-4 text-3xl font-semibold">
              Không gian trải nghiệm dành riêng cho hội viên với lộ trình chăm sóc toàn diện.
            </h3>
            <p className="mt-4 text-sm leading-7 text-neutral-200">
              Đặt lịch hẹn để khám phá những thiết kế giới hạn, thử kính với tư vấn viên riêng và cá nhân hóa kính theo phong cách.
            </p>
            <Link
              to="/lien-he"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-charcoal transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-400 hover:text-white"
            >
              Đặt lịch thăm atelier
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="space-y-6 text-neutral-600">
            <h3 className="text-2xl font-semibold text-charcoal">Đối tác chiến lược toàn cầu</h3>
            <p className="leading-7">
              SeeU Eyewear hợp tác cùng các hãng tròng kính hàng đầu như ZEISS, HOYA và Essilor để mang đến giải pháp bảo vệ thị lực tối ưu. Chuỗi cung ứng minh bạch giúp chúng tôi kiểm soát chặt chẽ chất lượng và tính bền vững.
            </p>
            <p className="leading-7">
              Chúng tôi cam kết sử dụng vật liệu thân thiện với môi trường, đồng thời tái chế acetate thừa nhằm giảm thiểu tác động đến hệ sinh thái.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default BrandStoryPage

