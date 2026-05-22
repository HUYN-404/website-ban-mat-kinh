# Hướng dẫn sử dụng Authentication

## Tính năng đã triển khai

### Backend API
- ✅ `POST /api/auth/login` - Đăng nhập
- ✅ `POST /api/auth/logout` - Đăng xuất (chỉ để thông báo, xử lý ở client)
- ✅ `GET /api/auth/me` - Lấy thông tin user hiện tại (cần token)

### Frontend
- ✅ AuthContext để quản lý state đăng nhập
- ✅ Tự động lưu token vào localStorage
- ✅ Tự động load token khi app khởi động
- ✅ Navbar hiển thị tên user và nút đăng xuất khi đã đăng nhập
- ✅ Form đăng nhập tích hợp vào modal

## Cách sử dụng

### 1. Đăng nhập
- Click vào icon user ở navbar
- Nhập username và password
- Click "Đăng nhập"
- Token sẽ được lưu tự động vào localStorage

### 2. Đăng xuất
- Click nút "Đăng xuất" ở navbar
- Token sẽ bị xóa khỏi localStorage

### 3. Token tự động
- Token được lưu trong localStorage với key `auth_token`
- Khi app khởi động, tự động load token và lấy thông tin user
- Token được gửi kèm trong header `Authorization: Bearer <token>` cho mọi request

## Thông tin đăng nhập mặc định

Từ file `DTB/sample_data_insert.sql`:
- **Admin:** Username: `seeu.admin`, Password: `password123`
- **Customer:** Username: `seeu.ngocanh`, Password: `password123`

## Cấu hình

### Backend (.env)
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### Frontend (.env hoặc vite.config.ts)
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Lưu ý

- Token hết hạn sau 7 ngày (có thể cấu hình trong .env)
- Khi token hết hạn, user sẽ tự động bị đăng xuất
- Token chỉ được lưu ở client (localStorage), không lưu ở server
- Đăng xuất chỉ xóa token ở client, không cần gọi API

