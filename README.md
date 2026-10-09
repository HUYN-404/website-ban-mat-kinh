# SeeU Eyewear — Website bán kính mắt

Đồ án tốt nghiệp: **"Xây dựng website bán kính mắt SeeU Eyewear sử dụng Django REST Framework và React"**.

Hệ thống thương mại điện tử bán kính mắt gồm 3 khối chính: **backend API** (Django 5 + DRF), **website khách hàng** (React 19) và **trang quản trị** (React 18). Hỗ trợ đầy đủ nghiệp vụ: sản phẩm, giỏ hàng, đặt hàng, mã giảm giá, thanh toán **VNPay** (sandbox), hoá đơn PDF, đánh giá, yêu thích, gợi ý sản phẩm, chatbot tư vấn và báo cáo thống kê.

## Công nghệ sử dụng

| Tầng | Công nghệ |
|---|---|
| Backend | Python 3.14 · Django 5.2 · Django REST Framework · MySQL 8 · Redis |
| Xác thực | JWT (HS256) · bcrypt |
| Website khách | React 19 · Vite 7 · Tailwind CSS 3 · TanStack Query · Axios |
| Trang quản trị | React 18 · Vite 5 · React Router 6 · TanStack Query |
| Thanh toán | VNPay sandbox (HMAC-SHA512) · COD |
| Tài liệu API | drf-spectacular (Swagger + ReDoc) |
| Kiểm thử | pytest (70 test case) |

## Cấu trúc thư mục

```
.
├── src/                      ← Source code
│   ├── backend/              ← API Django 5 + DRF (mount /api)
│   ├── storefront/           ← Website khách hàng (React 19)
│   ├── admin/                ← Trang quản trị (React 18)
│   ├── uploads/              ← Ảnh/media người dùng tải lên
│   └── product_img/          ← Ảnh sản phẩm theo thương hiệu
├── docs/                     ← Tài liệu
│   ├── database/             ← Script MySQL + tài liệu CSDL
│   ├── diagrams/             ← Biểu đồ UML (PlantUML)
│   ├── thesis/               ← Đồ án + nội dung thay thế
│   └── *.md                  ← AGENTS, kiến trúc, công nghệ, lộ trình…
├── runserver.bat             ← Script chạy nhanh backend
├── .gitignore
└── README.md
```

## Chạy dự án

### 1. Backend (Django — cổng 8000)

```bash
cd src/backend
# (lần đầu) cài thư viện + tạo file .env từ .env.example
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env   # rồi điền thông tin MySQL, VNPay…

.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver
```

Hoặc chạy nhanh bằng `runserver.bat` ở thư mục gốc.

- API: `http://localhost:8000/api/`
- Swagger: `http://localhost:8000/api/docs/` · ReDoc: `http://localhost:8000/api/redoc/`

### 2. Website khách hàng (cổng 5174)

```bash
cd src/storefront
npm install
copy .env.example .env
npm run dev
```

### 3. Trang quản trị (cổng 5173)

```bash
cd src/admin
npm install
copy .env.example .env
npm run dev
```

## Kiểm thử

```bash
cd src/backend
.\.venv\Scripts\python.exe -m pytest -q
```
