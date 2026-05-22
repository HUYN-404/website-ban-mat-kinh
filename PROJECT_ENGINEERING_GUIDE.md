# Engineering guide - Website ban kinh mat (PRJ)

Cap nhat ngay 2026-05-22. Tai lieu nay mo ta tech stack, cach doc repo, quy uoc code, va nhung dieu can tranh khi sua web.

## 1. Tech stack hien tai

### `Server/` - API v1 Node

| Thanh phan | Ghi chu |
| --- | --- |
| Runtime | Node.js, ES modules (`"type": "module"`) |
| Framework | Express 5.x |
| Ngon ngu | TypeScript 5.9, strict |
| Database | MySQL qua `mysql2` pool |
| Auth | JWT HS256 (`jsonwebtoken`), `bcryptjs` |
| Upload | `multer` |
| Script | `npm run dev`, `npm run build`, `npm start` |

### `PythonServer/` - API v2 Django

| Thanh phan | Ghi chu |
| --- | --- |
| Framework | Django 5.x, Django REST Framework |
| Database | MySQL qua `mysqlclient` |
| Auth | JWT legacy HS256 qua `LegacyJWTAuthentication` |
| Docs | `drf-spectacular`, Swagger `/api/docs/` |
| CORS | `django-cors-headers` |
| Media / CV | `Pillow`, `opencv-python-headless`, `mediapipe` |
| Apps | `common`, `authn`, `catalog`, `commerce`, `tryon`, `chatbot`, `api_v2` |

### `Frontend/eyewear-store/` - storefront

| Thanh phan | Ghi chu |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 7 |
| Routing | React Router 7 |
| HTTP | Axios |
| Server state | TanStack Query v5 o mot so man |
| Style | Tailwind CSS 3 |
| UI libs | `react-icons`, `swiper` |

### `Backend/` - admin dashboard

| Thanh phan | Ghi chu |
| --- | --- |
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Routing | React Router 6 |
| HTTP | Axios, TanStack Query v5 |
| UI helpers | `clsx`, `lucide-react` |

## 2. Kien truc runtime

- Strangler pattern: Node v1 chay `/api`, Django v2 chay `/api/v2`.
- Storefront co the chon backend theo module bang env trong `src/api/client.ts`:
  - catalog qua `getCatalogClient()`
  - core/cart/order/payment/chatbot qua `getCoreClient()`
- Admin mac dinh dung Node v1, co co `VITE_USE_API_V2_CATALOG` cho catalog.
- Ca Node va Django cung doc MySQL. Django co migration rieng, nhung bang legacy nhu `products`, `orders`, `users` phai duoc import san neu dung v2.
- File upload dung chung thu muc root `uploads/`.
- Khong co message queue, Redis, Kafka, Celery hay worker nen cac flow hien tai la HTTP dong bo.

## 3. Cau truc thu muc nen nho

```text
PRJ/
  Server/                     API v1 Express + TypeScript
    src/app.ts                Express app, health, static uploads, mount /api
    src/routes/               Route theo resource
    src/controllers/          HTTP layer
    src/services/             Business logic
    src/repositories/         SQL access
    src/validators/           Validate payload
    src/types/                TypeScript domain types
    src/middleware/           JWT auth
    src/middlewares/          error/notFound/upload
    src/db/pool.ts            MySQL pool

  PythonServer/               API v2 Django + DRF
    config/settings.py        Env, DB, CORS, apps, DRF config
    config/urls.py            Health, docs, /api/v2
    apps/api_v2/urls.py       Tat ca route v2
    apps/authn/               Auth, user, roles, JWT legacy
    apps/catalog/             Categories, brands, suppliers, products, images
    apps/commerce/            Carts, orders, payments, inventory, reports
    apps/tryon/               Thu kinh ao
    apps/chatbot/             Rule-based chatbot goi y san pham
    apps/common/              Envelope, request id, health

  Frontend/eyewear-store/     Storefront React
    src/api/client.ts         Base URL, flags v2, auth headers, file URL
    src/pages/                Route pages
    src/components/           Layout, navbar, product card, chatbot, modal
    src/services/             API services
    src/contexts/             Auth/cart/toast state

  Backend/                    Admin dashboard React
    src/api/client.ts
    src/views/
    src/components/
    src/contexts/

  migration/                  Contract/gateway/validation/checklist
  uploads/                    Media local
```

## 4. API conventions

- Response thanh cong: giu envelope `{ "data": ... }`.
- Loi Node thuong co `{ "message": ... }`; Django dung helper `error()` co the kem `requestId`.
- Endpoint can login dung header `Authorization: Bearer <token>`.
- JWT payload legacy: `userId`, `username`, `roleId`, `exp`.
- Khi token can dung cheo Node va Django, `Server/.env JWT_SECRET` phai trung `PythonServer/.env DJANGO_SECRET_KEY`.
- Khi port endpoint tu Node sang Django, doi chieu `migration/contracts/api-v1-contract-freeze.md` va `PythonServer/apps/api_v2/urls.py`.

## 5. Coding conventions

### Node

- Source TS dung import co hau to `.js` theo pattern ESM/NodeNext.
- Route -> controller -> service -> repository.
- Loi nghiep vu nen nem `HttpError` va de middleware xu ly.
- Validation tach trong `src/validators/*.validator.ts`.
- Message tieng Viet trong code hien co nen giu nhat quan khi sua.

### Django

- View hien chu yeu dung function view voi `@api_view` va `permission_classes`.
- Response nen di qua `envelope()` / `error()` trong `apps.common.responses`.
- App `chatbot` phu thuoc catalog DB; neu bang `products` thieu thi chatbot co the loi theo catalog.
- App `tryon` xu ly dong bo trong request, can de y timeout va kich thuoc file upload.

### React storefront

- Dung `getCatalogClient()` cho san pham/danh muc/brand.
- Dung `getCoreClient()` cho gio hang, don hang, payment, chatbot.
- Token localStorage key: `auth_token`.
- File URL ghep qua helper trong `src/api/client.ts`, khong hardcode host anh trong component.
- Chatbot da nam trong `Layout`, nen se xuat hien tren cac page co layout, khong xuat hien tren payment process/result vi route nay nam ngoai layout.

### Admin

- Admin dung React Router 6, storefront dung Router 7. Khi copy code routing giua 2 app phai sua API/router cho dung version.
- Dung component/view san co trong `Backend/src/views` de giu layout admin nhat quan.

## 6. Bien moi truong

| Noi dat | Bien quan trong |
| --- | --- |
| `Server/.env` | `DB_*`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT` |
| `PythonServer/.env` | `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DB_*`, `CORS_ALLOWED_ORIGINS`, `TRYON_RESULT_TTL_DAYS` |
| `Frontend/eyewear-store/.env` | `VITE_API_BASE_URL`, `VITE_API_V2_BASE_URL`, `VITE_USE_API_V2_CATALOG`, `VITE_USE_API_V2_CORE`, `VITE_FILE_BASE_URL` |
| `Backend/.env` | `VITE_API_BASE_URL`, `VITE_API_V2_BASE_URL`, `VITE_USE_API_V2_CATALOG`, `VITE_FILE_BASE_URL` |

## 7. Nhung dieu can tranh

1. Khong tro Django 5 vao MariaDB 10.4 cua XAMPP cho phase hien tai; dung MySQL 8.
2. Khong gia dinh `migrate` Django se tao bang legacy `products`, `orders`, `users`; cac bang nay phai import tu DB cu.
3. Khong de `JWT_SECRET` va `DJANGO_SECRET_KEY` khac nhau neu client login o mot stack va goi API o stack con lai.
4. Khong pha envelope `{ data: ... }` khi frontend/admin van doc theo contract cu.
5. Khong bat `VITE_USE_API_V2_CORE=0` roi ky vong chatbot Django hoat dong; chatbot storefront goi core client.
6. Khong ky vong Node co san `POST /payments/create-url`; hien route nay chi co trong Django v2.
7. Khong commit `.env`, password DB, JWT secret that.
8. Khong them queue/worker vao tai lieu hay code path neu chua co implement that.

## 8. Kiem tra truoc khi sua

- Xac dinh endpoint dang thuoc Node v1 hay Django v2.
- Kiem tra env flags storefront/admin dang tro dau.
- Neu sua DB/schema, kiem tra ca Node repository va Django model/view co bi lech khong.
- Neu sua order/payment/inventory, doi chieu side effect ton kho va status giua Node va Django.
- Neu sua text/chatbot san pham, dam bao catalog query khong tra ca phu kien khi nguoi dung hoi kinh, tru khi intent la phu kien.

## 9. Lenh verify nhanh

```powershell
# Node
Set-Location Server
npm run build

# Storefront
Set-Location ..\Frontend\eyewear-store
npm run build

# Admin
Set-Location ..\..\Backend
npm run build

# Django
Set-Location ..\PythonServer
.\.venv\Scripts\python manage.py check
```
