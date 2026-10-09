# Design Language & Hệ đo đạc — SeeU Luxury UI

> File này là "cuốn từ điển" style. Mọi số liệu lấy từ code thật của project (đã kiểm chứng 2026-09-06).
> Khi thiết kế: **đo đạc rõ ràng** (nêu số px/class) trước khi code, đừng đoán mò.

## 1. Storefront (`src/storefront`) — token chuẩn

Lấy từ `tailwind.config.js` (chỉ được dùng đúng các giá trị này, hoặc mở rộng có chủ đích):

| Token | Giá trị | Cách dùng |
|---|---|---|
| `text-charcoal` | `#1f1f1f` | Màu chữ chính, nút đặc, chân trang |
| `text-neutral-600/500` | Tailwind | Văn bản phụ / label brand |
| `bg-white` / `text-white` | | Nền chính, chữ trên nền tối |
| `bg-alabaster` | `#f7f7f7` | Nền ảnh sản phẩm, vùng nhạt |
| `champagne` | `#f4f0e6` | Wash nền section (`from-champagne`) |
| `gold-500` `#b98b3b` | | **Nhấn**: eyebrow, số badge, hover link, bullet active |
| `gold-100…700` | | Dùng tăng dần cho vùng gold nhạt/đậm |
| Font | `Inter` (sans) + `Playfair Display` (serif) | Body dùng Inter; serif chỉ **nhấn editorial** (chưa dùng nhiều → cơ hội làm sang) |
| `ease-luxury` | `cubic-bezier(0.4,0,0.2,1)` | Easing mặc định mọi transition |
| `shadow-soft` | `0 25px 45px rgba(17,24,28,0.08)` | Hover nâng card |
| `rounded-2xl/3xl/[36px]` | | Card 16–24px; vùng hero/banner lớn 36px |

### Nhịp typography & các pattern lặp lại (copy đúng "điệu" này)

```tsx
// Eyebrow — nhãn trên tiêu đề
<span className="text-sm uppercase tracking-[0.3em] text-gold-500">SeeU Signature</span>

// Tiêu đề section
<h2 className="text-3xl font-semibold leading-tight text-charcoal sm:text-4xl">…</h2>

// Mô tả phụ
<p className="max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">…</p>

// Nút chính (pill + tracking rộng + mũi tên)
<Link className="inline-flex items-center gap-3 rounded-full bg-charcoal px-8 py-3 text-sm font-semibold uppercase
  tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500">
  Khám phá <span aria-hidden>→</span>
</Link>

// Nút phụ (viền)
<Link className="inline-flex items-center gap-3 rounded-full border border-neutral-900 px-7 py-3 text-sm font-semibold
  uppercase tracking-[0.35em] text-neutral-900 transition duration-300 ease-luxury hover:-translate-y-0.5
  hover:bg-neutral-900 hover:text-white">…</Link>

// Link "micro" chữ nhỏ có mũi tên
<Link className="inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.3em] text-neutral-900
  transition group-hover:text-gold-500">Xem thêm <span aria-hidden>→</span></Link>
```

### Nền & "wash" section (tạo chiều sâu bằng gradient nhẹ, không dùng ảnh nền nặng)

```tsx
<section className="bg-gradient-to-br from-white via-alabaster to-white py-20">
<section className="bg-gradient-to-br from-white via-champagne to-white py-20">  {/* vùng ấm */}
<section className="border-b border-neutral-200/70 py-20 bg-gradient-to-br from-white via-champagne to-white">
```

## 2. Hệ đo đạc (Measurement System) — phần làm UI "sắc sảo"

UI đẹp = UI **đo được**. Luôn tính trước các con số:

| Đại lượng | Quy tắc | Giải thích |
|---|---|---|
| Đơn vị gốc | bội số của **4px / 8px** | Căn lưới, dễ canh, mắt thấy "có trật tự" |
| Container | `max-w-6xl px-6` (1140px) | Toàn storefront đồng nhất |
| Nhịp giữa các section | `space-y-24` (96px) trên page; `py-20` (80px) cho section nền riêng | Tạo "hơi thở" giữa các khối |
| Gap grid | `gap-8` (32px) → `md:grid-cols-2 xl:grid-cols-3` | Sản phẩm / thẻ |
| Khoảng cách chữ | `mt-4` giữa eyebrow→title, `mt-6` title→mô tả, `mt-8/10` trước CTA | Nhịp dọc tăng dần theo tầm quan trọng |
| Chiều dài dòng chữ | `max-w-2xl` (~60–75 ký tự) | Dễ đọc, không "bè" |
| Chiều cao hero | `h-[70vh] min-h-[560px]` | Áp đảo nhưng không tràn |
| Tỉ lệ ảnh | `aspect-[4/5]` (sản phẩm), `object-cover` (hero) | Nhất quán, không méo |
| Bố cục 2 cột | `lg:grid-cols-[1fr,1.1fr]` / `lg:grid-cols-2` | Cột ảnh hơi to hơn chữ = cân bằng "sang" |
| Bo góc | nhỏ 8–12 (chip), card 16–24, banner 36 | Bo góc càng lớn càng "thư giãn"; dùng có tầng bậc |

### Luật khoảng trắng âm dương (negative space)
- Giữa "khối chính" và "khối phụ" luôn có vùng trống có chủ đích (ít nhất 1 cột/1 dòng gap lớn).
- Không đặt 2 thứ quan trọng sát nhau — cho chúng "thở".
- Nếu 1 vùng bị chật (nhiều element chen nhau) → cắt bớt nội dung, không thu nhỏ padding.

## 3. Bảng màu nhấn (chỉ dùng có chủ đích)

| Mục đích | Gợi ý |
|---|---|
| Nhãn, đường kẻ vàng | `text-gold-500`, `border-gold-500/60`, `bg-gold-500/15` |
| Badge số (01, 02...) | `inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-600` |
| Gradient lên ảnh | `bg-gradient-to-t from-black/35 via-black/5 to-transparent` |
| Hover ảnh | `scale-105 duration-700 ease-luxury` + overlay fade `opacity-0 group-hover:opacity-100` |
| Chữ trên nền vàng/nhạt | `text-charcoal`, tránh vàng đè vàng |

## 4. Admin (`src/admin`) — token chuẩn (KHÔNG dùng Tailwind)

Lấy từ `src/styles.css`. Dùng **CSS variables** + class có sẵn:

| Biến | Giá trị | Dùng cho |
|---|---|---|
| `--primary` | `#6366f1` (indigo) | Accent chính, nút chính, focus |
| `--secondary` `--tertiary` `--quaternary` | `#a78bfa` / `#f472b6` / `#34d399` | Gradient nền, nhấn phụ |
| `--bg` | `#f8fafc` | Nền trang |
| `--surface` / `--surface-strong` | trắng 85% / 95% | Card, modal (glass) |
| `--surface-border` | `rgba(99,102,241,.2)` | Viền card |
| `--text` / `--text-light` / `--muted` | `#1e293b` / `#475569` / mờ | Chữ chính / phụ / mờ |
| `--success/--warning/--danger` | `#10b981/#f59e0b/#ef4444` | Trạng thái (status badge, toast) |
| Nền body | radial-gradient 4 màu phai | Đừng xoá — đây là "chữ ký" admin |
| `font-family` | Inter | Đã set sẵn |

**Nguyên tắc admin**: giao diện dashboard = **rõ ràng > lộng lẫy**. "Luxury" của admin nằm ở: card glass mượt, viền mềm, bảng có hàng hover nhẹ, modal ra vào êm, spacing đều, màu accent dùng ít nhưng nhất quán. Tái dùng `DataTable`, `Modal`, `StatCard`, `PageHeader`, `Toast` — đừng dựng lại.

## 5. Anti-patterns (dấu hiệu UI "chung chung" — PHẢI tránh)

- Grid card đều nhau, không chỗ nghỉ, không chỗ nhấn.
- Thiếu `eyebrow`/tracking rộng → mất chất editorial.
- Màu gold dùng tràn lan (nền vàng, chữ vàng, viền vàng cùng lúc).
- Button không có hover state / hover chỉ đổi màu nhạt nhẽo.
- Ảnh nhỏ, không có hover động, không gradient overlay.
- Bố cục nào cũng "trái chữ phải ảnh" hoặc toàn căn giữa.
- Animation rời rạc, vô nghĩa, chậm `duration-[2000ms]` cho thứ không cần.
- Admin dùng nhầm màu storefront (gold) hoặc ngược lại.
