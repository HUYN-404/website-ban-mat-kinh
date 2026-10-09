# AGENTS.md — Quy tắc làm việc cho AI trong dự án này

> File này được **MỌI AI/agent** (Copilot, Claude, các mô hình chat khác) tự động đọc khi thao tác trong repo.
> Hãy **tuân thủ tuyệt đối**. Nếu người dùng yêu cầu đi ngược lại quy trình dưới đây, hãy nhắc lại quy trình trước khi làm.

## 1. Quy trình làm việc BẮT BUỘC (theo đúng thứ tự)
1. **PLAN** — lên kế hoạch, chỉ rõ file sẽ tạo/sửa và nội dung.
2. **GIẢI THÍCH** — giải thích vì sao làm, khái niệm liên quan (bằng tiếng Việt, dễ hiểu, kèm ví dụ/bảng nếu cần).
3. **XIN ĐỒNG Ý** — chờ người dùng duyệt **TRƯỚC** khi sửa/tạo bất kỳ file nào.
4. **CODE** — chỉ thực hiện sau khi được duyệt; làm từng bước nhỏ, đúng style hiện có.
5. **KIỂM TRA** — chạy `manage.py check` / test / kiểm tra lỗi; báo kết quả rõ ràng.

**KHÔNG được** tự ý code/sửa file khi chưa giải thích và được đồng ý.
Người dùng đang **học Django/React** → luôn **vừa làm vừa giải thích** (vì sao, ở đâu, liên hệ thế nào).

## 2. Ngôn ngữ
- Giao tiếp bằng **TIẾNG VIỆT**.
- Comment/chuỗi hiển thị trong code: ưu tiên tiếng Việt (theo style project).

## 3. Cấu trúc project (tổng quan)
- `src/backend/` — **Backend Django 5 + DRF** (chính thức; Node đã bị loại bỏ hoàn toàn).
- `src/storefront/` — **Storefront** React 19 + Vite 7 + Tailwind 3 + TanStack Query + Axios.
- `src/admin/` — **Admin** React 18 + Vite 5 + React Router 6.
- `docs/database/` — script MySQL. `docs/LO-TRINH-TOI-UU-8-TUAN.md` — lộ trình 8 tuần đang làm theo.
- API mount: `/api` (`config/urls.py` → `apps/api/urls.py`).

## 4. Quy ước Backend (Django)
- Model đọc bảng cũ: `managed = False`. Model tạo mới: `managed = True` (migration).
- Thêm cột cho bảng `managed = False` → **KHÔNG tự ALTER**; đưa SQL cho người dùng tự chạy.
- Response: `envelope(data)` → `{"data": ...}`; `error(message)` → `{"message": ...}` (`apps/common/responses.py`).
- Auth: JWT HS256 (PyJWT), payload `{userId, username, roleId, exp}`; FE lưu `auth_token`, gửi `Authorization: Bearer <token>`.
- Logic dùng chung → đặt trong `services.py` của app (đừng lặp trong views).
- Trong `transaction.atomic()`: **KHÔNG dùng `return error()` giữa chừng** (không rollback) → dùng exception để rollback sạch.
- `select_for_update()` chỉ dùng **trong transaction** và khi **sắp ghi** (không dùng cho validate chỉ-đọc).
- DRF trả `Decimal` dạng **chuỗi** → FE phải `Number(...)` khi dùng.

## 5. Quy ước Frontend
- **Không tin FE về giá/tiền giảm** — backend tự tra DB.
- Tiền thanh toán lấy từ backend (`Number(order.totalAmount)`).

## 6. Coding Standards — Quy ước code CHUNG (BẮT BUỘC)

### Nguyên tắc chung
- **Bám sát code hiện có**: khi sửa/thêm, mô phỏng đúng phong cách của file đang đụng (cấu trúc, tên, comment). Không tự "đổi gu" hay viết kiểu khác với project.
- **DRY**: logic dùng chung → đặt 1 chỗ duy nhất (backend: `services.py` của app; FE: service layer). Không copy-paste.
- **KHÔNG thêm thư viện mới khi chưa hỏi** — chỉ dùng thư viện trong danh sách chính thức bên dưới. Nếu thật sự cần, giải thích lý do và xin đồng ý trước.
- File mới tạo phải đúng thư mục pattern của app và phải được khai báo đúng chỗ (backend: `apps/api/urls.py`; admin: `router.tsx` + `permissions.ts` + `DashboardLayout.tsx` + `types/entities.ts`).
- Viết **đủ dùng, dễ đọc** — không over-engineering, không thêm field/API không được yêu cầu.

### Naming
- Backend Python: biến/hàm `snake_case`, class `CamelCase`. **Field API trả về dùng `camelCase`** qua serializer (`totalAmount = DecimalField(source="total_amount")`).
- Frontend TS: biến/hàm `camelCase`; interface/type `PascalCase`; file component `PascalCase.tsx`; file service dùng lowercase (`orders.service.ts`).
- Route endpoint: lowercase + số nhiều (`/orders`, `/coupons`, `/products`).

### Comment & chuỗi hiển thị
- Tiếng Việt, ngắn gọn, nêu **"vì sao"** khi cần — không lặp lại code.
- Không để code chết / comment khối vô nghĩa.

### Backend (Django/DRF) cụ thể
- 1 resource = 1 app: `models.py`, `serializers.py`, `views.py`, (`services.py` nếu logic dài), route trong `apps/api/urls.py`.
- Response luôn qua `envelope(data)` / `error(message)`. Trong `transaction.atomic()` dùng **exception để rollback**, không `return error()` giữa block.
- Auth: `Authorization: Bearer <token>`; view admin-only chặn bằng `_is_admin`/`IsAuthenticated`.
- Bảng cũ `managed = False` → không migration, **không tự ALTER** (đưa SQL cho user).
- Không tin số tiền/giá/giảm giá từ FE — tự tra DB.

### Frontend cụ thể
- **Storefront**: React 19 + TS + Tailwind 3 + @tanstack/react-query + axios + react-router + react-icons. API qua `services/*.service.ts` → `getApiClient` (`api/client.ts`); dữ liệu bằng `useQuery`/`useMutation`.
- **Admin**: React 18 + @tanstack/react-query + axios + lucide-react + clsx. Dùng component có sẵn: `DataTable`, `Modal`, `StatCard`, `PageHeader`, `useConfirm`, `useToast`.
- Icons: storefront dùng `react-icons` (Fi/Hi), admin dùng `lucide-react` — **không trộn 2 bộ**.
- Tiền từ API là **chuỗi** (DRF Decimal) → `Number(...)`; hiển thị bằng `formatCurrency` (storefront) / `toLocaleString('vi-VN')`.

### Thư viện CHÍNH THỨC (đừng thêm linh tinh)
- **Backend** (`requirements.txt`): Django 5, DRF, django-cors-headers, drf-spectacular, PyJWT (thực tế đang dùng; simplejwt đã cài), bcrypt, mysqlclient, Pillow, **reportlab** (hoá đơn PDF), python-dotenv, django-redis, scikit-learn, pandas.
- **Storefront**: @tanstack/react-query, axios, react, react-dom, react-icons, react-router-dom, swiper; dev: tailwindcss 3, typescript, vite.
- **Admin**: @tanstack/react-query, axios, clsx, lucide-react, react, react-dom, react-router-dom 6.

## 7. Lệnh thường dùng
- Django: `cd src/backend; .\.venv\Scripts\python.exe manage.py runserver` (cổng 8000)
- Check: `cd src/backend; .\.venv\Scripts\python.exe manage.py check`
- Test E2E coupon: `cd src/backend; .\.venv\Scripts\python.exe _e2e_coupon_test.py`
- Backfill search_text: `cd src/backend; .\.venv\Scripts\python.exe manage.py backfill_search_text`
- Redis (portable): `& "$env:USERPROFILE\tools\redis\redis-server.exe" --port 6379`
- Pytest: `cd src/backend; .\.venv\Scripts\python.exe -m pytest -q` (23 tests: 15 integration + 8 unit)
- Admin: `cd src/admin; npm run dev` — Storefront: `cd src/storefront; npm run dev`

## 8. Trạng thái hiện tại
- ✅ Tuần 1–3 hoàn tất (Cutover/Auth + Forgot Password; Review & Rating; Wishlist + Coupon hoàn chỉnh: admin UI `/coupons`, áp vào đơn, vòng đời huỷ/hoàn tất, chống lạm dụng).
- ✅ **Tuần 4 hoàn tất** (Tìm kiếm nâng cao: cột `search_text` tự sinh + FULLTEXT index, tìm bỏ dấu 2 chiều, xếp theo độ liên quan, FE bỏ lọc bù — đã test UI OK).
- ✅ **Tuần 5.1 hoàn tất** (Redis cache: django-redis, `apps/catalog/cache_utils.py` version-generation + `invalidate_catalog()`; cache categories/brands/products/product_detail; invalidate ở các endpoint ghi. Lưu ý: `redis` phải `<5` vì Redis portable 5 không hỗ trợ RESP3/HELLO).
- ⏸️ **Guest Cart (Tuần 5.2): HOÃN** — người dùng không cần thiết.
- ✅ **Tuần 6 hoàn tất** (Recommendation: `apps/recommendations/` — Level 1 rule-based + Level 2 content-based scikit-learn TF-IDF/cosine; endpoints `/api/recommendations/user|popular|product/<id>` trả `{productIds, reason}`; FE HomePage "Gợi ý" + ProductDetailPage "Sản phẩm tương tự". Đã thêm `scikit-learn`, `pandas`; ma trận similarity cache Redis qua `cache_utils`.)
- ✅ **Tuần 7 hoàn tất** (pytest + pytest-django: `pytest.ini`, `tests/conftest.py` (chạy DB THẬT + rollback vì bảng legacy managed=False — không tạo test DB riêng); 23 test gồm 15 integration (auth / catalog-search / order-coupon / recommendations / api-contract) + 8 unit (normalize_search_text / compute_discount). `python -m pytest -q` = 23 passed.)
- 📁 **Lưu ý:** đã rename `apps/api_v2` → `apps/api` (bỏ hậu tố v2 vì Node đã bị xoá).
- 🗑️ **Xoá Try-On (2026-09-29):** đã gỡ `apps/tryon/`, `models/face_landmarker.task`, `product_img/glasses/`, `PRJ/uploads/tryon/`, `TryOnPage.tsx`, `tryon.service.ts`, route `/thu-kinh`, mục navbar "Thử kính", settings `TRYON_*`, `.env`. ⚠️ **Đưa user SQL chạy tay:** `DELETE FROM django_migrations WHERE app='tryon';` + `DROP TABLE IF EXISTS tryon_sessions;` → ERD.clean.mwb cần xoá hộp `tryon_sessions` (còn **20 bảng**).
- ⏳ **Tuần 8 (đang làm):** ✅ dọn Docs (bỏ `api_v2`/`/api/v2`/Node trong CONG-NGHE, SO-SANH, PROJECT_*, README, LO-TRINH — còn lại chỉ là ghi chú lịch sử có chủ đích) → ✅ **ERD HOÀN TẤT**: (a) tài liệu: thêm mục 17–21 vào `docs/database/Chi tiết Biểu đồ lớp...md` (coupons, coupon_usage, reviews, wishlist, password_reset_tokens + cột `products.search_text`) và quy tắc API 17–21 vào `docs/database/db-table-rules.md`; (b) bản vẽ `docs/database/ERD.clean.mwb` = **21 bảng nghiệp vụ** (đã xoá 10 bảng hệ thống `auth_*`/`django_*`) + **view `reports`** + **11 đường quan hệ nét đứt** cho 6 bảng mới. Lưu ý: bảng mới **không có FK cứng** (tham chiếu mềm) → đường nét đứt là đúng. ⚠️ `docs/database/ERD.mwb` gốc giữ nguyên; **KHÔNG chạy Synchronize/Execute** trên file clean (sẽ sinh `DROP TABLE` bảng thật).
- 🔜 **Lộ trình user chốt (2026-09-29)** — theo thứ tự:
  1. **Phần 3 — Frontend polish** (storefront). *(BỎ Phần 4 — kịch bản video demo.)*
  2. **Admin (`src/admin`)**: đổi tone màu sang **luxury giống storefront** + chỉnh UI/UX cho đẹp.
  3. ~~**Try-On**~~ → ❌ **ĐÃ XOÁ HOÀN TOÀN (2026-09-29)** theo yêu cầu user (app `apps/tryon`, route `/thu-kinh`, navbar, model mediapipe, PNG kính, ERD mục 22). Thay bằng: **Swagger/OpenAPI** ✅ + **Hoá đơn PDF** ✅ + **Báo cáo/biểu đồ admin** (đã có sẵn: 3 StatCard + biểu đồ doanh thu, đã đổi tone gold).
  4. **Chatbot**: cải thiện nhẹ (không cần sâu).
  5. **Thanh toán**: thêm **VNPay** cho hoàn thiện.
  6. **Hoàn thiện tổng + tổng kết đồ án** + vẽ/xuất biểu đồ chèn vào đồ án.
  - ⏰ Deadline nộp đồ án: **2026-09-30** (rất gấp) → ưu tiên polish + biểu đồ trước.

