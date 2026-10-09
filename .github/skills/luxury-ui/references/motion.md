# Motion & Hiệu năng — SeeU Luxury UI

> **Triết lý: LÀM ĐẸP TRƯỚC — TỐI ƯU SAU.**
> Khi `design-language.md` / `recipes.md` (ý tưởng làm đẹp) cần một hiệu ứng → **ưu tiên làm cho đẹp và đúng ý đồ trước**, rồi mới tính đến cách tối ưu hiệu năng.
> Đừng để nỗi lo "tốn RAM" chặn một hiệu ứng đẹp. Các luật bên dưới là **công cụ để hiệu ứng đẹp chạy mượt** — không phải lý do từ chối làm đẹp.

## 0. Thứ tự làm việc (bắt buộc)

1. **LÀM ĐẸP (theo ý đồ thiết kế)**: đọc `design-language.md` + `recipes.md`, chọn hiệu ứng đúng "chữ ký SeeU" — đủ chiều sâu, biết kể chuyện (hover, reveal, parallax...). Giai đoạn này **KHÔNG tự giới hạn** vì sợ hiệu năng.
2. **TỐI ƯU (pass kiểm tra)**: sau khi hiệu ứng đã đẹp & hoạt động đúng, mới rà các kỹ thuật ở mục 5 để giữ mượt. Nếu hiệu ứng đẹp mà chạy rung → **tối ưu đúng cách để GIỮ được hiệu ứng** (chỉ `transform/opacity`, gom `IntersectionObserver`, lazy ảnh...), KHÔNG cắt bỏ hiệu ứng vì lười tối ưu.
3. Chỉ khi thật sự quá nặng trên máy thường (giật khi cuộn/ẩn) mới giảm bớt phần tử animate — và nói rõ với người dùng đã giảm gì.

> Luật vàng kỹ thuật: **CHỈ animate `transform` và `opacity`** (chạy trên GPU, không gây reflow) — đây là *cách* để hiệu ứng đẹp chạy mượt, KHÔNG phải giới hạn sáng tạo. Nếu cần animate một thuộc tính khác, hãy dùng phần tử trung gian (vd: đổi `scaleX` thay vì `width`).

## 1. Bộ "gia vị" chuyển động chuẩn (dùng nhất quán)

| Hoàn cảnh | Easing | Duration | Ghi chú |
|---|---|---|---|
| Hover (nút, card) | `ease-luxury` | 300–500ms | Dùng Tailwind `transition duration-300/500 ease-luxury` |
| Hover ảnh zoom | `ease-luxury` | 700ms | `scale-105`, chậm rãi = sang |
| Modal / overlay vào | `ease-out` / `ease-luxury` | 200–300ms | Có sẵn `animate-scale-in`, `animate-slide-in-right` trong `index.css` |
| Hiện khi cuộn (reveal) | `ease-luxury` | 600–800ms | kèm stagger 60–100ms giữa các phần tử |
| Đổi trạng thái navbar | `transition` | 200–300ms | Navbar đã dùng `window.scrollY > 20` |

**Nguyên tắc thời gian**: vào nhanh (150–250ms), ra/ẩn chậm hơn một chút (300–500ms) → cảm giác "đắt tiền".
Không kéo dài animation quá 1s trừ hero image (2000ms như code cũ là vì slide hero).

## 2. Micro-interaction (hover/focus) — bộ sưu tập pattern có sẵn trong project

| Pattern | Cách làm (đã có trong code) |
|---|---|
| Nút nhấc + đổ bóng | `hover:-translate-y-0.5 hover:shadow-soft` + đổi màu nền |
| Card nhấc | `hover:-translate-y-1.5 hover:shadow-soft duration-500` (ProductCard) |
| Ảnh zoom | bọc `<div className="overflow-hidden">`, img `group-hover:scale-105 duration-700` |
| Overlay mờ dần trên ảnh | `opacity-0 group-hover:opacity-100 duration-500` + `bg-gradient-to-t from-black/35` |
| Link đổi màu gold + mũi tên | `group-hover:text-gold-500` trên link trong `group` |
| Focus bàn phím | KHÔNG xoá outline; dùng `focus-visible:ring-2 ring-gold-500/60` (storefront) / `--primary` (admin) |
| Nút loading | disable + đổi chữ ("Đang thêm...") — đã có mẫu ở `ProductCard` |

**Rule**: mỗi phần tử nhấn được (button/link/card) PHẢI có hover state khác biệt rõ. Nếu chưa có → thiếu.

## 3. Scroll effects — reveal-on-scroll / parallax / navbar

### 3.1. Reveal-on-scroll (storefront)
Dùng **một `IntersectionObserver` dùng chung** (tốt hơn nhiều listener scroll).
> Tiện ích đã tạo sẵn trong project — dùng lại, không copy vào từng component (DRY):
> - Hook: `src/storefront/src/utils/useInView.ts`
> - Component bọc: `src/storefront/src/components/Reveal.tsx` (prop `delay` để stagger)

Kiểu hiện lên chuẩn (chỉ transform + opacity):

```tsx
// Phần tử sẽ được gắn state "visible"
<div
  className={`transition duration-700 ease-luxury ${
    inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
  }`}
>…</div>
```

- `translate-y-6` (24px) là đủ — đừng bay xa.
- **Stagger**: phần tử sau delay thêm 60–100ms: style `transitionDelay` khi `inView`, hoặc class `[transition-delay:120ms]`.
- Chỉ reveal 1 lần khi vào viewport (không lặp lại khi cuộn lên/xuống) để giữ RAM.

### 3.2. Parallax nhẹ
- Dịch ảnh nền chậm hơn tốc độ cuộn một chút: `transform: translateY(calc(var(--scrollY) * 0.15))`.
- Cách nhẹ: gắn 1 scroll listener **passive** (như Navbar đã làm), cập nhật qua `requestAnimationFrame`, CHỈ set `transform` bằng `style.transform`.
- KHÔNG đọc `offsetTop/getBoundingClientRect` trong từng frame nếu không cần (gây layout thrash). Cache giá trị lúc mount.

### 3.3. Navbar theo cuộn
- Mẫu có sẵn trong `Navbar.tsx`: `window.scrollY > 20` → đổi nền từ trong suốt sang `bg-white/80 backdrop-blur` + bóng nhẹ. Tái dùng pattern này khi cần header "bám" theo cuộn.
- Sticky section với hiệu ứng đổi nội dung khi chạm (scroll-triggered swap) — dùng IntersectionObserver để bật/tắt, không phải scroll handler.

### 3.4. Đồng hồ cuộn trang / thanh tiến trình (nếu cần)
- Dùng `scroll` + `rAF` để đổi `transform: scaleX(...)` của thanh trên cùng (chỉ 1 element). Không cần thư viện.

## 4. framer-motion — đã được duyệt (2026-09-06), dùng ĐÚNG CHỖ

**Chỉ dùng khi**: kéo/gesture, layout animation dùng chung phần tử (`layoutId`), xuất hiện theo cuộn nâng cao (scroll-linked `useScroll`), hoặc cần `AnimatePresence` cho thoát modal phức tạp.

**Khi đã quyết dùng**:
- Cài 1 lần duy nhất; import gọn `import { motion } from 'motion/react'` (framer-motion v11+ là `motion/react`).
- `whileHover={{ y: -4 }}` / `initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}` — vẫn **chỉ animate transform/opacity**.
- Đặt `transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}` khớp `ease-luxury`.
- Đừng dùng framer-motion cho: hover đổi màu, fade-in đơn giản, open modal (CSS đủ, nhẹ hơn ~40kb).

> Lưu ý: thêm framer-motion làm tăng bundle. Nếu chỉ cần 1–2 hiệu ứng nhỏ → CSS. Chỉ "mở hầu bao" khi hiệu ứng thật sự cần gesture/layout/scroll-linked.

> Component 3D đã có sẵn trong storefront — dùng lại, đừng tạo mới:
> - `TiltCard` (`src/components/TiltCard.tsx`): nghiêng 3D theo chuột; prop `glare` = vệt sáng bám chuột.
> - `ProductCard` có prop `tilt` để bật 3D (mặc định tắt).
> - Parallax hero khi cuộn: mẫu trong `HeroSection.tsx` (`useScroll` + `useTransform` + `useReducedMotion`).

## 5. Luật "không tốn RAM" (performance checklist)

- [ ] Chỉ animate `transform`/`opacity`.
- [ ] Scroll listener dùng `{ passive: true }`; gom việc nặng vào `requestAnimationFrame`.
- [ ] Reveal dùng IntersectionObserver (1 instance), không phải listener scroll trên từng phần tử.
- [ ] Ảnh dưới màn hình: `loading="lazy"` (project đã dùng); section nặng có thể `content-visibility: auto`.
- [ ] Không dùng `will-change` tràn lan (tốn RAM) — chỉ đặt khi đang animate và bỏ sau đó.
- [ ] Không chạy animation vô hạn ngoài vùng nhìn (dừng autoplay khi tab ẩn — trình duyệt tự lo phần lớn).
- [ ] Không import cả thư viện animation cho 1 hiệu ứng CSS làm được.
- [ ] Kiểm tra trên máy thường (không chỉ máy mạnh); nếu giật → giảm số phần tử animate cùng lúc.

## 6. Accessibility & prefers-reduced-motion

- Luôn thêm CSS toàn cục (đã chuẩn ở storefront `index.css` hoặc mở rộng):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
- Mọi nội dung quan trọng phải đọc được khi KHÔNG có animation (không ẩn mặc định rồi chỉ hiện khi JS chạy sai).
