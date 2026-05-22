# Project handoff - Website ban kinh mat (PRJ)

Cap nhat ngay 2026-05-22. File nay ghi lai tinh hinh hien tai cua web, cac thay doi dang co trong code, diem can canh giac, va lenh chay dev.

## 1. Tinh hinh hien tai

Du an hien co 4 phan chinh:

| Thu muc | Trang thai / vai tro |
| --- | --- |
| `Server/` | API v1 bang Node.js + Express + TypeScript, dung MySQL, route goc `http://localhost:3000/api`. Day van la backend legacy day du nhat cho admin/core. |
| `PythonServer/` | API v2 bang Django + DRF, route goc `http://localhost:8000/api/v2`. Dang dung theo huong strangler de thay dan Node, da co catalog, commerce, auth, try-on, chatbot. |
| `Frontend/eyewear-store/` | Storefront React/Vite cho khach hang. Da co trang san pham, gio hang, don hang, payment result, thu kinh ao va chatbot noi tren layout. |
| `Backend/` | Admin dashboard React/Vite. Chu yeu goi Node v1, co cau hinh de doc catalog tu Django v2 khi bat env. |

Thu muc phu:

| Thu muc / file | Ghi chu |
| --- | --- |
| `uploads/` | Anh san pham, anh upload, anh try-on local. Node va Django deu co the serve duong dan `/uploads`. |
| `migration/` | Contract API v1, cau hinh gateway nginx mau, script validation, checklist cat Node. |
| `runserver.bat` | Script tien ich local. |

Repo goc `PRJ/` hien khong phai git repository theo lenh `git status` tai root.

## 2. Thay doi / tinh nang dang co

- Storefront co cac route chinh: `/`, `/products`, `/products/:productId`, `/thuong-hieu`, `/phu-kien`, `/thu-kinh`, `/gio-hang`, `/don-hang`, `/don-hang/:orderId`, `/lien-he`, `/profile`, `/payment/process`, `/payment/result`.
- Chatbot da duoc gan vao `Layout` qua `ChatbotWidget`, goi `POST /chatbot` tren core client. Neu `VITE_USE_API_V2_CORE=1` thi endpoint nay nam o Django: `POST /api/v2/chatbot`.
- Chatbot Django la rule-based, doc san pham tu catalog DB de goi y theo khuon mat, nhu cau, tam gia, thuong hieu, phu kien, bao hanh, doi tra, giao hang, thanh toan.
- Try-on MVP da co route storefront `/thu-kinh` va API Django: tao session, upload anh mat, render session.
- Payment online hien la mock flow. Storefront tao order, tao payment, gan payment vao order, va neu can thi goi `POST /payments/create-url`.
- `POST /payments/create-url` hien chi thay trong Django v2. Node v1 `payments.routes.ts` chua co route tuong ung, nen neu core van tro Node thi flow online co the lech.
- Admin dashboard van la React rieng, co cac trang quan tri users, roles, products, product images, categories, brands, suppliers, inventory, orders, payments, reports, carts.

## 3. Database va trang thai quan trong

- Ca Node va Django doc MySQL qua bien `DB_*`.
- May dev tung co 2 engine:
  - MariaDB 10.4 cua XAMPP: noi co data legacy ban dau.
  - MySQL 8.0 service `MySQL80`: huong chay lau dai cho Django 5.
- Django 5 khong nen tro vao MariaDB 10.4. Dung MySQL 8 cho `migrate`.
- Neu schema MySQL 8 chi moi chay Django migrate thi thuong chi co bang `auth_*`, `django_*`, `tryon_sessions`, va chua co bang legacy nhu `products`, `users`, `orders`.
- Neu chua import dump legacy vao dung schema MySQL 8, cac API catalog/commerce/chatbot co doc san pham se loi 500 hoac tra rong.

Viec can lam neu catalog v2 loi:

1. Dump schema/data legacy tu MariaDB XAMPP.
2. Import vao MySQL 8 dung `DB_NAME` trong `.env`.
3. Kiem tra bang `products`, `users`, `orders`, `categories`, `brands`, `suppliers`, `product_images` da ton tai.
4. Restart Django va storefront.

## 4. API va migration

- API v1 Node: `/api`.
- API v2 Django: `/api/v2`.
- Storefront chon backend qua env:
  - `VITE_USE_API_V2_CATALOG=1` de catalog goi Django.
  - `VITE_USE_API_V2_CORE=1` de core/cart/order/payment/chatbot goi Django.
- Response thanh cong nen boc `{ "data": ... }`.
- Auth dung Bearer JWT HS256 payload legacy gom `userId`, `username`, `roleId`, `exp`.
- De token dung cheo Node/Django, `JWT_SECRET` cua Node phai khop `DJANGO_SECRET_KEY` cua Django.
- OpenAPI Django: `http://localhost:8000/api/docs/`.
- Health:
  - Node: `GET http://localhost:3000/health`.
  - Django: `GET http://localhost:8000/health`.

## 5. Bien moi truong hay dung

`Server/.env`:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `PORT`

`PythonServer/.env`:

- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `CORS_ALLOWED_ORIGINS`
- `TRYON_RESULT_TTL_DAYS`

`Frontend/eyewear-store/.env`:

- `VITE_API_BASE_URL` thuong la `http://localhost:3000/api`
- `VITE_API_V2_BASE_URL` thuong la `http://localhost:8000/api/v2`
- `VITE_USE_API_V2_CATALOG`
- `VITE_USE_API_V2_CORE`
- `VITE_FILE_BASE_URL`

`Backend/.env`:

- `VITE_API_BASE_URL`
- `VITE_API_V2_BASE_URL`
- `VITE_USE_API_V2_CATALOG`
- `VITE_FILE_BASE_URL`

## 6. Lenh chay nhanh

```powershell
# MySQL 8
Start-Service MySQL80

# Django API v2
PythonServer\.venv\Scripts\python PythonServer\manage.py migrate
PythonServer\.venv\Scripts\python PythonServer\manage.py runserver 0.0.0.0:8000

# Node API v1
Set-Location Server
npm run dev

# Storefront
Set-Location ..\Frontend\eyewear-store
npm run dev

# Admin
Set-Location ..\..\Backend
npm run dev
```

## 7. File quan trong

| Noi dung | Duong dan |
| --- | --- |
| Node app / mount `/api` | `Server/src/app.ts`, `Server/src/routes/index.ts` |
| Node auth | `Server/src/services/auth.service.ts`, `Server/src/middleware/auth.middleware.ts` |
| Django settings | `PythonServer/config/settings.py` |
| Django v2 routes | `PythonServer/apps/api_v2/urls.py` |
| Django chatbot | `PythonServer/apps/chatbot/service.py`, `PythonServer/apps/chatbot/views.py` |
| Storefront API client | `Frontend/eyewear-store/src/api/client.ts` |
| Storefront chatbot | `Frontend/eyewear-store/src/components/ChatbotWidget.tsx`, `Frontend/eyewear-store/src/services/chatbot.service.ts` |
| Storefront order flow | `Frontend/eyewear-store/src/services/orders.service.ts` |
| Try-on frontend | `Frontend/eyewear-store/src/pages/TryOnPage.tsx`, `Frontend/eyewear-store/src/services/tryon.service.ts` |

## 8. Viec nen xu ly tiep

- Dong bo DB legacy sang MySQL 8 neu chua lam xong.
- Chon ro core API cho storefront: neu can chatbot va payment create-url thi bat Django core v2 hoac bo sung route tuong ung tren Node.
- Test lai end-to-end: login, danh sach san pham, chi tiet san pham, gio hang, tao don, payment result, chatbot, try-on.
- Neu tiep tuc strangler, doi chieu parity Django commerce voi Node orders/payments/inventory de tranh lech tien va ton kho.
