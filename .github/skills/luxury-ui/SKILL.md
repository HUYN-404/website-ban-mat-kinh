---
name: luxury-ui
description: 'Thiết kế UI luxury đặc trưng riêng của dự án SeeU Eyewear (storefront React 19 + Tailwind, admin React 18 + CSS variables). Dùng khi dựng layout/trang/component mới, làm hover effect, scroll effect, reveal-on-scroll, micro-interaction, animation, hoặc khi UI đang trông "chung chung" cần làm sắc sảo, cá tính, sáng tạo. Use when building or polishing e-commerce UI, luxury product pages, scroll reveals, hover micro-interactions, hero and section layouts, React + Tailwind interfaces.'
argument-hint: 'Mô tả giao diện/trang muốn dựng mới hoặc cải thiện (vd: hero, product card, section, modal...)'
user-invocable: true
---

# Luxury UI — Skill thiết kế giao diện đặc trưng SeeU

> Skill này định nghĩa **"gu thiết kế riêng"** của dự án — KHÔNG được trả về UI chung chung kiểu template.
> Mọi giao diện tạo ra phải **đo đạc được**, **có trạng thái tương tác rõ ràng**, **chuyển động mượt nhưng nhẹ RAM**.

## 1. Khi nào dùng skill này

- Dựng trang/section/component mới (hero, product card, form, modal, bảng...).
- Làm hover effect, scroll effect, reveal-on-scroll, parallax, micro-interaction.
- UI hiện có trông "bình thường, dễ đoán, chung chung" → cần nâng cấp sắc sảo.
- Muốn animation/transition đúng chất `luxury` (chậm rãi, có chiều sâu, không rẻ tiền).

## 2. Chữ ký thiết kế SeeU (Design Signature) — BẮT BUỘC bám theo

| # | Nguyên tắc chữ ký | Làm sao |
|---|---|---|
| 1 | **Editorial Eyebrow** | Nhãn nhỏ `uppercase tracking-[0.3em→0.4em] text-gold-500` phía trên tiêu đề (storefront). Luôn có — tạo nhịp "tạp chí". |
| 2 | **Màu vàng = gia vị, không phải món chính** | Nền/text chủ đạo dùng `charcoal` + `white` + `neutral`; `gold` chỉ điểm: eyebrow, gạch chân, badge số, hover. |
| 3 | **Khoảng trắng là tài sản** | Section cách nhau rộng rãi (`space-y-24`), padding thoáng (`py-20`), không nhồi nhét. Hít thở = sang. |
| 4 | **Typography có nhịp** | Serif (`Playfair Display`) dành cho nhấn nhá editorial; `Inter` cho thân bài. Luôn có 1 dòng tiêu đề to, khỏe. |
| 5 | **Mọi nút bấm là "trải nghiệm"** | Nút dạng pill, `uppercase tracking-[0.35em]`, mũi tên `→`, hover: đổi màu + nhấc `-translate-y-0.5`. |
| 6 | **Ảnh kể chuyện** | Ảnh lớn, `object-cover/contain`, hover `scale-105` chậm 700ms, kèm gradient overlay mờ dần. |
| 7 | **Bố cục bất đối xứng có chủ đích** | Không "grid card đều tăm tắp". Xen kẽ cột lệch `lg:grid-cols-[1fr,1.1fr]`, full-bleed xen container, hình ảnh dẫn dắt. |
| 8 | **Mọi state đều được thiết kế** | Mỗi phần tử tương tác phải có: hover, focus-visible, active, loading, empty. Không bỏ sót. |
| 9 | **Chuyển động = transform + opacity** | Chỉ animate `transform`/`opacity` (GPU). Không animate `width/top/left/height/margin` (gây reflow, tốn RAM). |
| 10 | **Hiệu ứng phải có lý do** | Mỗi animation trả lời: "giúp user hiểu điều gì?" (feedback, định hướng, kể chuyện). Không animate để cho vui. |

## 3. Quy trình 6 bước — LÀM THEO ĐÚNG THỨ TỰ (bắt buộc)

1. **ĐO — xác định không gian**: đọc layout muốn dựng, chọn lưới (`max-w-6xl px-6`), chia cột, canh lề theo lưới 8px; ước lượng chiều cao/tỉ lệ (hero ~`70vh`/`aspect-[4/5]`...). Nêu rõ số liệu trước khi code.
2. **NHỊP — typography & màu**: chọn cấp chữ (tiêu đề/body/eyebrow), màu theo bảng token của đúng app (storefront ≠ admin). Tra `design-language.md`.
3. **STATE — định trạng thái**: liệt kê hover/focus/active/loading/empty cho từng phần tử sẽ có.
4. **CHUYỂN ĐỘNG**: thêm micro-interaction & scroll-effect bằng `transform/opacity`. Chọn lớp theo sơ đồ bên dưới. Tra `motion.md`.
5. **KIỂM TRA HIỆU NĂNG**: xoá animation thừa, không đọc layout trong scroll handler, tôn trọng `prefers-reduced-motion`, không import thư viện nặng cho hiệu ứng nhỏ.
6. **SO QUALITY BAR**: chạy checklist mục 6; thiếu gì sửa gì.

> Nếu người dùng chỉ nhờ "dựng trang X" mà KHÔNG nhắc skill, vẫn làm theo skill này khi thuộc phạm vi UI.

## 4. Cây quyết định kỹ thuật

```
Hiệu ứng cần làm?
├── Đơn giản (hover, focus, fade-in nhẹ, open modal)
│     → CSS thuần + Tailwind (group-hover, transition, keyframes) — KHÔNG cần thư viện
├── Xuất hiện khi cuộn (reveal-on-scroll, stagger)
│     → IntersectionObserver (1 instance dùng chung) + class transform/opacity
│       (storefront: dùng hook useInView/Reveal khi đã có — xem motion.md)
├── Phức tạp: kéo/gesture, layout animation chung phần tử, scroll-linked nâng cao
│     → framer-motion (ĐÃ ĐƯỢC USER DUYỆT 2026-09-06, 2 app)
│       NHƯNG: import `motion/react` gọn, chỉ dùng component cần thiết,
│       không dùng cho hiệu ứng mà CSS làm được trong 3 dòng.
└── Không chắc → hỏi/đề xuất 2 phương án kèm chi phí, đừng tự quyết thư viện.
```

## 5. Nguồn style theo từng app — PHẢI đọc đúng file

| App | Đường dẫn chính | Ghi chú |
|---|---|---|
| Storefront | `src/storefront/` — `tailwind.config.js`, `src/index.css`, `src/components/*` | Tailwind; token luxury (charcoal/gold/champagne); icons `react-icons`; dùng `SectionHeading`, `PageHeader`, `ProductCard`, `HeroSection` làm chuẩn. |
| Admin | `src/admin/src/` — `styles.css`, `ui/DashboardLayout.tsx`, `components/*` | KHÔNG Tailwind — dùng CSS variables + class trong `styles.css`; icons `lucide-react`; tái dùng `DataTable`, `Modal`, `StatCard`, `PageHeader`, `useConfirm`, `useToast`. |

KHÔNG trộn icon 2 bộ. KHÔNG dùng Tailwind class trong admin (dùng class có sẵn/var CSS).

### 5.1 Tiện ích & component UI ĐÃ CÓ (dùng lại — DRY, đừng tạo mới)

| Tiện ích | Vị trí (storefront) | Cách dùng |
|---|---|---|
| `Reveal` (hiện dần khi cuộn) | `src/components/Reveal.tsx` | `<Reveal delay={i * 80}>…</Reveal>` |
| `useInView` (hook) | `src/utils/useInView.ts` | scroll-effect tuỳ biến (IntersectionObserver) |
| `TiltCard` (3D nghiêng theo chuột) | `src/components/TiltCard.tsx` | `<TiltCard glare>…</TiltCard>` |
| framer-motion | đã cài trong storefront (v13) | `import { motion } from 'framer-motion'` |

- `ProductCard` có prop `tilt` (bật 3D + glare) — mặc định tắt, bật theo từng trang.
- Mẫu parallax hero theo cuộn: `src/components/HeroSection.tsx` (`useScroll` + `useTransform` + `useReducedMotion`).
- Thứ tự ưu tiên hiệu ứng: CSS → `Reveal`/`useInView` → `TiltCard`/framer-motion. Xem `recipes.md` R3 & R10.

## 6. Quality Bar — checklist bắt buộc trước khi bàn giao UI

- [ ] Bám đúng token & pattern của app (tra `design-language.md`), không tự bịa màu/font.
- [ ] Có ít nhất 1 "điểm nhấn cá tính" (eyebrow editorial, serif nhấn, số thứ tự gold, ảnh dẫn dắt, bố cục lệch...).
- [ ] Không còn UI "chung chung": không grid đều vô hồn, không thiếu khoảng trắng, không thiếu state.
- [ ] Mọi phần tử tương tác có hover/focus/active; có loading & empty state nơi cần.
- [ ] Animation chỉ dùng `transform/opacity`; không gây reflow; chạy mượt trên máy thường.
- [ ] Có tôn trọng `prefers-reduced-motion`.
- [ ] Đúng quy ước project: comment tiếng Việt, DRY (logic chung đặt 1 chỗ), không thêm thư viện chưa được duyệt.
- [ ] Chạy build/dev không lỗi; UI nhìn cân đối ở mobile (kiểm tra responsive).

## 7. Tài nguyên

- [Design language & hệ đo đạc](./references/design-language.md) — token, lưới, spacing, typography.
- [Motion & hiệu năng](./references/motion.md) — quy tắc chuyển động, scroll effect, framer-motion, luật "nhẹ RAM".
- [Recipes UI](./references/recipes.md) — các "công thức" hoàn chỉnh (kèm code) dựng ngay.
- Đọc thêm quy ước chung: `AGENTS.md` (root) — Coding Standards & danh sách thư viện chính thức.
