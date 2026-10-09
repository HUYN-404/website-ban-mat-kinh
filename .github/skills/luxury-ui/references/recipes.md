# Recipes UI — "Công thức" dựng giao diện SeeU Luxury

> Mỗi recipe = 1 món hoàn chỉnh (kèm code), dùng đúng token & pattern trong project.
> Copy **đúng tinh thần** rồi chỉnh nội dung — không phải là template cứng nhắc.
> Storefront: `src/storefront`. Admin: `src/admin`.

---

## R1. Editorial Split — "Chữ kể chuyện + Ảnh dẫn dắt" (section 2 cột lệch)

**Khi nào**: mỗi khối giới thiệu thương hiệu/sưu tầm/câu chuyện trên trang chủ.

```tsx
<section className="mx-auto max-w-6xl px-6">
  <div className="grid items-center gap-14 lg:grid-cols-[1fr,1.1fr]">
    {/* TRÁI — nội dung editorial */}
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <span className="text-sm uppercase tracking-[0.3em] text-gold-500">SeeU Atelier</span>
        <h2 className="text-3xl font-semibold leading-tight text-charcoal sm:text-4xl">
          Chế tác thủ công, chuẩn mực từng milimet
        </h2>
        <p className="max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
          Đoạn mô tả ngắn gọn, đủ thở, không dài dòng.
        </p>
      </div>
      {/* 3 bước có số vàng — tạo nhịp & độ tin cậy */}
      <ul className="space-y-6 text-sm text-neutral-600">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-start gap-4">
            <span className="mt-[6px] inline-flex h-6 w-6 flex-none items-center justify-center
              rounded-full bg-gold-500/15 text-xs font-semibold text-gold-600">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h4 className="text-base font-semibold text-charcoal">{s.title}</h4>
              <p className="mt-2 leading-7">{s.desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link to="/thuong-hieu" className="inline-flex items-center gap-3 rounded-full border border-neutral-900
        px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-900 transition duration-300
        ease-luxury hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white">
        Khám phá <span aria-hidden>→</span>
      </Link>
    </div>

    {/* PHẢI — ảnh có "kể chuyện": bo 36px + gradient + hover zoom */}
    <div className="group relative overflow-hidden rounded-[36px] bg-alabaster shadow-soft">
      <img src={img} alt={alt} loading="lazy"
        className="aspect-[4/3] w-full object-cover transition duration-700 ease-luxury group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent" aria-hidden="true" />
    </div>
  </div>
</section>
```

**Vì sao đẹp**: ảnh to hơn chữ một chút (1.1fr) + khoảng trống `gap-14` + số vàng tạo "thương hiệu thủ công".

---

## R2. Premium Product Card — bản nâng cấp của `ProductCard`

**Khi nào**: cần card sản phẩm có chiều sâu hơn (hover đổi ảnh, nút thêm nhanh).

```tsx
<article className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80
  bg-white transition duration-500 ease-luxury hover:-translate-y-1.5 hover:shadow-soft">
  <Link to={`/products/${p.id}`} className="relative block overflow-hidden bg-alabaster p-3">
    {/* Ảnh chính zoom chậm */}
    <img src={p.images[0]} alt={p.name} loading="lazy"
      className="aspect-[4/5] w-full object-contain transition duration-700 ease-luxury
        group-hover:scale-105 group-hover:opacity-0" />
    {/* Ảnh thứ 2 (nếu có) hiện ra thay thế — hiệu ứng "xoay sản phẩm" */}
    {p.images[1] && (
      <img src={p.images[1]} alt="" loading="lazy"
        className="absolute inset-0 aspect-[4/5] w-full object-contain p-3 opacity-0 transition
          duration-700 ease-luxury group-hover:opacity-100" />
    )}
    {/* Overlay tối nhẹ dưới đáy để tên nổi bật */}
    <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/25
      via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
  </Link>
  {/* Nút "Thêm nhanh" trượt lên khi hover */}
  <div className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition duration-300 ease-luxury
    group-hover:translate-y-0 group-hover:opacity-100">
    <button className="w-full rounded-full bg-charcoal py-2.5 text-sm font-semibold uppercase tracking-[0.25em]
      text-white transition hover:bg-gold-500">Thêm vào giỏ</button>
  </div>
  {/* Nội dung + giá như ProductCard hiện tại */}
</article>
```

**Lưu ý hiệu năng**: 2 ảnh cùng tải → dùng `loading="lazy"` cho ảnh thứ 2, và chỉ render ảnh 2 nếu có. Đổi ảnh bằng `opacity` (không đổi `src` đột ngột).

---

## R3. Reveal-on-scroll bọc section (có stagger)

**Khi nào**: làm trang "sống" khi cuộn. Xem `motion.md` mục 3.1.
Tiện ích đã có sẵn trong project (dùng lại, KHÔNG copy):
- Hook: `src/utils/useInView.ts`
- Component bọc: `src/components/Reveal.tsx` (luôn render 1 `div`, có prop `delay` cho stagger)

```tsx
// Cách dùng (Reveal bọc nội dung cần hiện dần khi cuộn tới):
<Reveal className="mx-auto max-w-6xl px-6">
  <SectionHeading eyebrow="BST mới" title="…" description="…" />
</Reveal>

// Hoặc stagger cho grid:
<div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
  {items.map((item, i) => (
    <Reveal key={item.id} delay={i * 80}>
      <ProductCard product={item} />
    </Reveal>
  ))}
</div>
```

**Khi CHƯA có Reveal** — viết trực tiếp bằng IntersectionObserver trong component, KHÔNG thêm thư viện:
```tsx
const ref = useRef<HTMLDivElement>(null)
const [shown, setShown] = useState(false)
useEffect(() => {
  const el = ref.current
  if (!el) return
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { setShown(true); io.disconnect() } // once
  }, { threshold: 0.15 })
  io.observe(el)
  return () => io.disconnect()
}, [])
// <div ref={ref} className={shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} + transition>
```
**Rule**: `threshold: 0.15`, reveal **1 lần** (`io.disconnect()`), dịch `translate-y-6` là đủ.

---

## R4. Hero có Parallax nhẹ (không thư viện)

**Khi nào**: hero muốn "ảnh chìm dần / chữ nổi dần" khi cuộn xuống — rất luxury.

```tsx
const heroRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  const onScroll = () => {
    const y = window.scrollY
    if (heroRef.current) {
      // CHỈ set transform; y giới hạn 0–400 để không bay quá xa
      heroRef.current.style.transform = `translateY(${Math.min(y * 0.25, 120)}px)`
    }
    requestAnimationFrame(onScroll) // gom frame — không chạy quá 60fps
  }
  let raf = 0
  const handler = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(onScroll) }
  window.addEventListener('scroll', handler, { passive: true })
  return () => { window.removeEventListener('scroll', handler); cancelAnimationFrame(raf) }
}, [])
```

**Lưu ý**: chữ phía trên dịch `0.25`, ảnh nền dịch `0.1` (chậm hơn = parallax). Đừng parallax nhiều phần tử cùng lúc.

---

## R5. Nút "Gold Reveal" — biến thể sang nhất

**Khi nào**: CTA quan trọng nhất trên trang (hero, banner ưu đãi).

```tsx
<Link to={cta} className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-9 py-3.5
  text-sm font-semibold uppercase tracking-[0.35em] text-white">
  {/* Lớp nền trượt vàng từ trái — thay vì chỉ đổi màu */}
  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-gold-400 to-gold-600
    transition-transform duration-500 ease-luxury group-hover:translate-x-0" aria-hidden="true" />
  <span className="relative z-10">{label}</span>
  <span className="relative z-10" aria-hidden>→</span>
</Link>
```
**Vì sao đẹp**: "lớp vàng trượt qua" = khoảnh khắc, đắt hơn hover đổi màu phẳng. Chỉ dùng cho 1–2 CTA/trang.

---

## R6. Section nền xen kẽ — nhịp điệu trang

**Khi nào**: trang dài nhiều section → tạo nhịp "trắng → wash → trắng".

```tsx
// Section A — nền trắng, thở rộng
<section className="mx-auto max-w-6xl px-6 py-24">…</section>
// Section B — vùng "alabaster" nhấn (ảnh sản phẩm nổi trên nền nhạt)
<section className="bg-gradient-to-br from-white via-alabaster to-white py-24">…</section>
// Section C — vùng "champagne" ấm cho nội dung thương hiệu/hội viên
<section className="bg-gradient-to-br from-white via-champagne to-white py-24">…</section>
// Section D — nền tối full-bleed (charcoal) cho "banner đẳng cấp" (footer/quote lớn)
<section className="bg-charcoal py-24 text-white">…</section>
```

**Rule**: tránh 2 section nền đặc sát nhau; nền tối chỉ 1 lần/trang để giữ sự "hiếm có".

---

## R7. Trang danh mục / bộ sưu tập — "Editorial Listing"

**Khi nào**: trang list sản phẩm, thay cho grid đều nhàm chán.

```tsx
<div className="mx-auto max-w-6xl px-6">
  <PageHeader title="Kính mắt nam" eyebrow="SeeU Heritage"
    description="…" />
  {/* Dải tiêu đề to, serif nhấn chữ khoá */}
  <p className="mt-8 text-2xl font-medium leading-snug text-charcoal sm:text-3xl">
    Được thiết kế cho <em className="font-serif italic text-gold-600">khuôn mặt châu Á</em> — ôm nhẹ, không hằn.
  </p>
  {/* Bộ lọc dạng chip */}
  <div className="mt-8 flex flex-wrap gap-3">
    {filters.map(f => (
      <button className="rounded-full border border-neutral-300 px-5 py-2 text-sm uppercase tracking-[0.15em]
        transition duration-300 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white
        data-[active=true]:border-charcoal data-[active=true]:bg-charcoal data-[active=true]:text-white">
        {f.label}
      </button>
    ))}
  </div>
  <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {products.map(p => <ProductCard key={p.id} product={p} />)}
  </div>
</div>
```

**Vì sao đẹp**: 1 câu "khoá" kiểu editorial (serif nghiêng vàng) ngay dưới header biến trang list thành trang "tạp chí mua sắm".

---

## R8. Admin — nâng cấp nhẹ theo token (KHÔNG Tailwind)

**Khi nào**: cần làm mới một view admin (dashboard, form, bảng) mà vẫn đúng hệ thống.

```tsx
// Header trang kiểu admin (dùng PageHeader có sẵn nếu có)
<div style={{
  background: 'linear-gradient(135deg, rgba(99,102,241,.08), rgba(167,139,250,.06))',
  border: '1px solid var(--surface-border)',
  borderRadius: 16,
  padding: '20px 24px',
}}>
  <h1 style={{ margin: 0, color: 'var(--text)', fontSize: 20, fontWeight: 700, letterSpacing: '.01em' }}>Quản lý sản phẩm</h1>
  <p style={{ margin: '6px 0 0', color: 'var(--text-light)', fontSize: 14 }}>Mô tả ngắn</p>
</div>

// Card "glass" chuẩn
<div style={{
  background: 'var(--surface)',
  border: '1px solid var(--surface-border)',
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(99,102,241,.06)',
  backdropFilter: 'blur(8px)',
}}>…</div>

// Badge trạng thái
<span style={{ background: 'var(--accent-soft)', color: 'var(--primary)', padding: '2px 10px',
  borderRadius: 999, fontSize: 12, fontWeight: 600 }}>Đang hoạt động</span>
```

**Rule admin**: màu chỉ dùng: `--primary` (hành động), `--success/--warning/--danger` (trạng thái). Mọi thứ khác neutral. Tránh gradient 4 màu bên trong card (chỉ dùng ở body).

---

## R9. Empty & Loading state "có gu"

**Khi nào**: mọi trang list/giỏ/đơn — đừng để trống trơn.

```tsx
// Empty state — trung tâm, có icon, có CTA
<div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed
  border-neutral-300 bg-white/60 p-16 text-center">
  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/10 text-gold-600">
    <HiOutlineShoppingBag size={28} />
  </span>
  <h4 className="text-xl font-semibold text-charcoal">Giỏ hàng đang trống</h4>
  <p className="max-w-sm text-sm leading-7 text-neutral-600">…lời mời gọi…</p>
  <Link to="/products" className="mt-4 …nút pill chuẩn…">Khám phá sản phẩm</Link>
</div>
```
Loading: giữ layout (không nhảy) — dùng skeleton hoặc khối "Đang tải…" như `HomePage` đã làm (khung `border-dashed p-16`).

---

## R10. 3D Tilt + Glare (framer-motion) — card "cầm trên tay"

**Khi nào**: ảnh sản phẩm / ảnh bìa cần chiều sâu premium khi rê chuột. Tiện ích đã có: `src/components/TiltCard.tsx` (nghiêng theo chuột, spring mượt, tự tôn trọng `prefers-reduced-motion`).

```tsx
// Cách 1 — bật sẵn trên ProductCard (prop tilt):
<ProductCard product={product} tilt />

// Cách 2 — tự bọc bất kỳ ảnh/khối nào:
<TiltCard glare maxTilt={6}>
  <img src={product.images[0]} alt={product.name} className="aspect-[4/5] w-full object-contain" />
</TiltCard>
```

- `glare`: vệt sáng tròn bám theo chuột (chỉ dùng khi có ảnh nền để không bị lóa).
- `maxTilt` (mặc định 7°), `scale` (mặc định 1.02) — giữ nhỏ để "sang", không lắc lư.
- Parallax hero khi cuộn: tham khảo `HeroSection.tsx` (`useScroll` + `useTransform`).
- Chỉ animate transform/opacity.

---

## Checklist trước khi "giao" 1 recipe

- [ ] Class/token đúng app (storefront Tailwind / admin CSS var) — không lẫn.
- [ ] Có hover/state cho nút & card.
- [ ] Animation chỉ `transform/opacity`, có `ease-luxury`, duration hợp lý.
- [ ] Mobile nhìn ổn (grid co 1 cột, chữ không tràn).
- [ ] Nội dung tiếng Việt có dấu, comment ngắn gọn.
