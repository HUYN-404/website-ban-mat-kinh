# 🎯 Gợi ý Popup/Modal cho Frontend SeeU Eyewear

Dựa trên codebase hiện tại, đây là danh sách các popup nên bổ sung để cải thiện UX:

---

## 🔥 **Ưu tiên CAO** (Nên làm ngay)

### 1. **Toast Notification System** ⭐⭐⭐
**Mục đích:** Thay thế `alert()` và `window.alert()` hiện tại, tạo trải nghiệm mượt mà hơn

**Sử dụng ở đâu:**
- ✅ Thêm sản phẩm vào giỏ hàng thành công (hiện đang dùng `alert()` trong CartContext)
- ✅ Cập nhật số lượng sản phẩm trong giỏ
- ✅ Xóa sản phẩm khỏi giỏ hàng
- ✅ Đăng nhập/Đăng xuất thành công
- ✅ Lỗi khi thao tác (thay cho `alert()`)

**Thiết kế:**
- Hiển thị ở góc trên phải/bên phải màn hình
- Tự động ẩn sau 3-5 giây
- Có icon: ✅ success, ❌ error, ⚠️ warning, ℹ️ info
- Animation slide-in/slide-out mượt mà
- Có thể dismiss bằng cách click vào X

**Tech stack gợi ý:**
- Tự build với React + Context API (khuyến nghị)
- Hoặc dùng: `react-hot-toast`, `sonner`, `react-toastify`

---

### 2. **Confirmation Dialog (Xác nhận hành động)** ⭐⭐⭐
**Mục đích:** Xác nhận trước khi thực hiện các hành động quan trọng

**Sử dụng ở đâu:**
- ✅ Xóa sản phẩm khỏi giỏ hàng (hiện đang xóa trực tiếp)
- ✅ Đăng xuất (hiện đang logout luôn)
- ✅ Xóa địa chỉ giao hàng (nếu có)
- ✅ Hủy đơn hàng

**Thiết kế:**
- Modal centered, có backdrop blur
- Title: "Xác nhận", "Bạn có chắc chắn?"
- Message: Mô tả rõ hành động sẽ thực hiện
- 2 buttons: "Hủy" (secondary) + "Xác nhận" (danger/primary)

**Ví dụ:**
```
"Bạn có chắc muốn xóa sản phẩm [Tên sản phẩm] khỏi giỏ hàng?"
[ Hủy ] [ Xóa ]
```

---

### 3. **Image Viewer Modal (Lightbox)** ⭐⭐
**Mục đích:** Xem ảnh sản phẩm full-size, có thể zoom và chuyển ảnh

**Sử dụng ở đâu:**
- ✅ Click vào ảnh sản phẩm trong `ProductDetailPage`
- ✅ Click vào thumbnail trong gallery
- ✅ Xem ảnh trong giỏ hàng

**Tính năng:**
- Hiển thị ảnh full-size, centered
- Có nút Previous/Next để chuyển ảnh
- Có thể zoom bằng pinch hoặc scroll
- Nút đóng (X) hoặc click outside để đóng
- Hiển thị số ảnh (ví dụ: "2 / 5")
- Keyboard support: ← → để chuyển ảnh, ESC để đóng

**Tech stack gợi ý:**
- `react-image-gallery`
- `yet-another-react-lightbox`
- Hoặc tự build với Swiper

---

### 4. **Checkout/Payment Modal** ⭐⭐
**Mục đích:** Form thanh toán, nhập thông tin giao hàng

**Sử dụng ở đâu:**
- ✅ Click nút "Thanh toán" trong CartPage

**Tính năng:**
- Form nhập thông tin: Họ tên, SĐT, Email, Địa chỉ
- Chọn phương thức thanh toán (COD, VNPay, etc.)
- Tóm tắt đơn hàng (products, total)
- Validation form
- Xác nhận đặt hàng → Hiển thị modal "Đặt hàng thành công"

**Flow:**
1. Click "Thanh toán" → Mở modal checkout
2. Điền form → Submit
3. API tạo Order → Success
4. Đóng checkout modal → Mở "Success Modal" với mã đơn hàng
5. Redirect về trang "Đơn hàng của tôi" hoặc HomePage

---

## 🟡 **Ưu tiên TRUNG BÌNH** (Nên làm trong giai đoạn 2)

### 5. **Success Modal (Đặt hàng thành công)**
**Mục đích:** Hiển thị thông tin đơn hàng sau khi đặt thành công

**Nội dung:**
- ✅ Icon checkmark lớn
- "Đặt hàng thành công!"
- Mã đơn hàng: `#12345`
- Tổng tiền: `8.800.000 ₫`
- Thời gian giao hàng dự kiến
- 2 buttons: "Xem đơn hàng" + "Tiếp tục mua sắm"

---

### 6. **Quick View Modal**
**Mục đích:** Xem nhanh thông tin sản phẩm không cần vào trang detail

**Sử dụng ở đâu:**
- ✅ Hover/Click vào product card trong ProductListPage
- ✅ Trong search results

**Nội dung:**
- Ảnh sản phẩm (có thể carousel)
- Tên, giá, brand
- Mô tả ngắn (truncated)
- Button "Xem chi tiết" + "Thêm vào giỏ"

---

### 7. **Size Guide Modal**
**Mục đích:** Hướng dẫn chọn size kính phù hợp

**Nội dung:**
- Bảng size với hình minh họa
- Hướng dẫn đo khuôn mặt
- Gợi ý size theo khuôn mặt
- Link đến "Đặt lịch đo kính tại cửa hàng"

**Trigger:**
- Link "Hướng dẫn chọn size" trong ProductDetailPage
- Trong footer hoặc help section

---

### 8. **Filter/Sort Sidebar (Mobile)**
**Mục đích:** Bộ lọc sản phẩm cho mobile

**Sử dụng ở đâu:**
- ✅ Trang ProductListPage trên mobile
- ✅ Hiện tại chỉ có dropdown, cần expand thành sidebar

**Tính năng:**
- Lọc theo: Giá, Thương hiệu, Màu sắc, Kích thước
- Sắp xếp: Mới nhất, Giá thấp → cao, Giá cao → thấp, Bán chạy
- Apply/Clear filters

---

## 🔵 **Ưu tiên THẤP** (Nice to have)

### 9. **Wishlist/Favorites Modal**
**Mục đích:** Quản lý danh sách yêu thích

**Nội dung:**
- Danh sách sản phẩm đã thích
- Có thể xóa khỏi wishlist
- Button "Thêm tất cả vào giỏ"

---

### 10. **Product Comparison Modal**
**Mục đích:** So sánh 2-3 sản phẩm

**Nội dung:**
- Bảng so sánh: Giá, Chất liệu, Thương hiệu, Điểm nổi bật
- Side-by-side images

---

### 11. **Newsletter Subscribe Modal**
**Mục đích:** Thu thập email để gửi khuyến mãi

**Trigger:**
- Exit intent (khi user sắp rời trang)
- Sau khi mua hàng
- Popup tự động sau 30s trên trang (có thể disable)

**Nội dung:**
- "Nhận ưu đãi 10% khi đăng ký!"
- Form nhập email
- Checkbox "Đồng ý nhận email marketing"

---

### 12. **Share Product Modal**
**Mục đích:** Chia sẻ sản phẩm lên mạng xã hội

**Nội dung:**
- Buttons: Facebook, Zalo, Copy link, WhatsApp
- Preview của link chia sẻ

---

## 📋 **Tổng kết Implementation Order**

### Phase 1 (Ngay lập tức):
1. ✅ Toast Notification System
2. ✅ Confirmation Dialog
3. ✅ Image Viewer Modal

### Phase 2 (Tuần sau):
4. ✅ Checkout/Payment Modal
5. ✅ Success Modal
6. ✅ Quick View Modal

### Phase 3 (Tùy chọn):
7. ✅ Size Guide Modal
8. ✅ Filter Sidebar (Mobile)
9. ✅ Wishlist Modal
10. ✅ Newsletter Modal

---

## 🛠️ **Tech Stack Gợi ý**

### Tự build (Recommended):
- **Toast:** Context API + Portal
- **Modal:** Custom component với `usePortal`
- **Lightbox:** Swiper.js (đã dùng trong HeroSection)

### Library (Nếu muốn nhanh):
- **Toast:** `react-hot-toast` hoặc `sonner`
- **Modal:** `@headlessui/react` hoặc `@radix-ui/react-dialog`
- **Lightbox:** `yet-another-react-lightbox`

---

## 💡 **Lưu ý Design**

- Giữ consistency với design system hiện tại
- Sử dụng màu: `charcoal`, `gold-500`, `neutral-200/80`
- Border radius: `rounded-3xl`, `rounded-2xl`
- Shadow: `shadow-2xl shadow-black/20`
- Animation: `transition duration-300 ease-luxury`
- Backdrop: `bg-neutral-900/40 backdrop-blur-sm`

---

**Bạn muốn tôi implement popup nào trước? Tôi khuyến nghị bắt đầu với Toast Notification System + Confirmation Dialog! 🚀**


