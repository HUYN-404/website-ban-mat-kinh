# Điều Kiện Đăng Nhập & Phân Quyền

## Tổng quan

Hệ thống đăng nhập sử dụng **JWT (JSON Web Token)** để xác thực và phân quyền người dùng dựa trên **Role**.

---

## 1. ĐIỀU KIỆN ĐẦU VÀO (Input Validation)

### 1.1. Format Request
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### 1.2. Điều kiện username
```
✅ BẮT BUỘC: username phải có
✅ KIỂU DỮ LIỆU: phải là string
✅ KHÔNG RỖNG: username.trim() không được rỗng
✅ TỰ ĐỘNG TRIM: khoảng trắng đầu/cuối sẽ bị loại bỏ
```

**Ví dụ hợp lệ:**
- `"admin"`
- `"user123"`
- `"  admin  "` → tự động trim thành `"admin"`

**Ví dụ không hợp lệ:**
- `""` → Lỗi 400: "username là bắt buộc và phải là chuỗi không rỗng"
- `null` → Lỗi 400: "username là bắt buộc và phải là chuỗi không rỗng"
- `undefined` → Lỗi 400: "username là bắt buộc và phải là chuỗi không rỗng"
- `123` (số) → Lỗi 400: "username là bắt buộc và phải là chuỗi không rỗng"

### 1.3. Điều kiện password
```
✅ BẮT BUỘC: password phải có
✅ KIỂU DỮ LIỆU: phải là string
✅ KHÔNG RỖNG: password.trim() không được rỗng
```

**Ví dụ hợp lệ:**
- `"password123"`
- `"  mypass  "` → tự động trim thành `"mypass"`

**Ví dụ không hợp lệ:**
- `""` → Lỗi 400: "password là bắt buộc và phải là chuỗi không rỗng"
- `null` → Lỗi 400: "password là bắt buộc và phải là chuỗi không rỗng"
- `undefined` → Lỗi 400: "password là bắt buộc và phải là chuỗi không rỗng"

---

## 2. ĐIỀU KIỆN XÁC THỰC (Authentication)

Sau khi validate input, hệ thống kiểm tra theo thứ tự:

### 2.1. User tồn tại
```
❌ Nếu username KHÔNG tồn tại trong database
   → Lỗi 401: "Tên đăng nhập hoặc mật khẩu không đúng."
```

**Query thực hiện:**
```sql
SELECT * FROM users 
LEFT JOIN roles ON users.role_id = roles.role_id
WHERE username = ?
```

### 2.2. Trạng thái tài khoản (Status)
```
✅ User phải có status = 'active'
❌ Nếu status ≠ 'active' (ví dụ: 'inactive', 'banned')
   → Lỗi 403: "Tài khoản đã bị vô hiệu hóa."
```

**Các trạng thái có thể:**
- `'active'` → ✅ Cho phép đăng nhập
- `'inactive'` → ❌ Không cho phép đăng nhập
- `'banned'` → ❌ Không cho phép đăng nhập

### 2.3. Mật khẩu đúng
```
✅ Password phải khớp với password đã hash trong database
❌ Nếu password SAI
   → Lỗi 401: "Tên đăng nhập hoặc mật khẩu không đúng."
```

**Lưu ý:**
- Password được hash bằng **bcrypt**
- So sánh bằng `bcrypt.compare(plainPassword, hashedPassword)`
- Không thể so sánh trực tiếp (vì đã hash)

### 2.4. Role tồn tại và có quyền đăng nhập
```
✅ Nếu user có role_id:
   - Role phải tồn tại trong bảng roles
   - Role được JOIN và lấy role_name
   
✅ Kiểm tra quyền đăng nhập:
   - Chỉ role 'admin' hoặc 'staff' được phép đăng nhập vào dashboard
   - Các role khác (customer, manager, ...) → Lỗi 403
   - User không có role (roleName = null) → Lỗi 403
```

**Lưu ý:**
- **⚠️ QUAN TRỌNG**: Chỉ `admin` và `staff` mới đăng nhập được vào dashboard admin
- Nếu role_id tồn tại nhưng role không tồn tại → roleName = null → Không đăng nhập được
- Role được lưu trong JWT token dưới dạng `roleId`

---

## 3. ĐIỀU KIỆN PHÂN QUYỀN (Authorization - Role Check)

### 3.1. Role được lưu trong Token
Sau khi đăng nhập thành công, JWT token chứa:
```typescript
{
  userId: number,      // ID người dùng
  username: string,    // Tên đăng nhập
  roleId: number | null // ID vai trò (có thể null)
}
```

### 3.2. Role được trả về trong Response
```typescript
{
  token: string,
  user: {
    id: number,
    username: string,
    fullName: string | null,
    email: string | null,
    roleName: string | null  // Tên role (ví dụ: "admin", "staff")
  }
}
```

### 3.3. Các Role trong hệ thống

**⚠️ VẤN ĐỀ HIỆN TẠI:**
- **Backend**: Hỗ trợ role động (có thể tạo bất kỳ role nào trong database)
- **Frontend**: Chỉ hardcode 2 role: `'admin' | 'staff'`

**Các role có thể có:**
```typescript
// Backend: role_name là string tự do trong database
// Ví dụ: 'admin', 'staff', 'customer', 'manager', 'supervisor', 'guest', ...

// Frontend: Hiện tại chỉ chấp nhận
type RoleName = 'admin' | 'staff'  // ❌ Hardcode, không linh hoạt
```

**Phân quyền hiện tại:**
- **`admin`**: Toàn quyền, truy cập tất cả trang
- **`staff`**: Quyền hạn chế, chỉ truy cập một số trang
- **Các role khác** (customer, manager, ...): ❌ **KHÔNG được nhận diện** ở Frontend

**⚠️ Hệ quả nếu có role khác:**
1. User có role `'customer'` → Đăng nhập thành công (Backend OK)
2. Frontend nhận `roleName = 'customer'` → Không match với `'admin' | 'staff'`
3. `canAccessRoute()` trả về `false` → User không truy cập được trang nào
4. Navigation items bị ẩn hết → User không thấy menu nào

### 3.4. Xử lý Role động (Nếu có role khác admin/staff)

**Vấn đề:**
- Database có thể lưu bất kỳ role nào: `'customer'`, `'manager'`, `'supervisor'`, ...
- Frontend chỉ hardcode `'admin' | 'staff'` → Role khác sẽ bị bỏ qua

**Cách xử lý hiện tại:**
```typescript
// Backend/src/utils/permissions.ts
export const canAccessRoute = (routePath: string, roleName: string | null | undefined): boolean => {
  const role = roleName?.toLowerCase() as RoleName | undefined
  
  // ❌ Nếu role không phải 'admin' hoặc 'staff' → return false
  if (!role) {
    return false
  }
  
  // Logic check...
}
```

**Hệ quả:**
- Role `'customer'` → `role.toLowerCase()` = `'customer'`
- `'customer' as RoleName` → TypeScript warning (nhưng vẫn chạy)
- `!role` → `false` (vì 'customer' là truthy)
- Nhưng `item.roles.includes(role)` → `false` (vì item.roles chỉ có ['admin'] hoặc ['staff'])
- **Kết quả**: Role khác không truy cập được route nào có phân quyền

**Giải pháp đề xuất:**

#### Giải pháp 1: Sửa Frontend để hỗ trợ role động
```typescript
// Thay vì hardcode
type RoleName = 'admin' | 'staff'

// Dùng string
type RoleName = string  // Hoặc bỏ type này, dùng string trực tiếp

// Logic check
export const canAccessRoute = (routePath: string, roleName: string | null | undefined): boolean => {
  if (!roleName) {
    return false
  }
  
  const role = roleName.toLowerCase()
  const allItems = getAllNavigationItems()
  const item = allItems.find(...)
  
  if (!item) {
    // Route không có trong danh sách → chỉ admin được phép
    return role === 'admin'
  }
  
  if (!item.roles) {
    // Không có roles → tất cả được phép
    return true
  }
  
  // Check role có trong danh sách không
  return item.roles.map(r => r.toLowerCase()).includes(role)
}
```

#### Giải pháp 2: Thêm role mới vào type (Nếu biết trước)
```typescript
type RoleName = 'admin' | 'staff' | 'customer' | 'manager' | 'supervisor'
```

#### Giải pháp 3: Lấy danh sách role từ Backend (Tốt nhất)
```typescript
// Fetch roles từ API
const roles = await apiClient.get('/roles')
// roles = ['admin', 'staff', 'customer', 'manager', ...]

// Dùng roles này để check thay vì hardcode
```

### 3.5. Kiểm tra quyền truy cập Route (Frontend)

**Điều kiện:**
```
1. User phải đã đăng nhập (có token hợp lệ)
2. User phải có roleName
3. Route phải cho phép role đó truy cập
```

**Logic kiểm tra:**
```typescript
// Nếu route không có trong danh sách → chỉ admin được phép
if (!item) {
  return role === 'admin'
}

// Nếu route không có roles → tất cả roles đều được phép
if (!item.roles) {
  return true
}

// Nếu route có roles → chỉ role nằm trong danh sách mới được phép
return item.roles.includes(role)
```

**Các route và quyền truy cập:**

| Route | Admin | Staff | Ghi chú |
|-------|-------|-------|---------|
| `/` (Reports) | ✅ | ✅ | Tất cả roles |
| `/users` | ✅ | ❌ | Chỉ admin |
| `/roles` | ✅ | ❌ | Chỉ admin |
| `/categories` | ✅ | ❌ | Chỉ admin |
| `/brands` | ✅ | ❌ | Chỉ admin |
| `/suppliers` | ✅ | ❌ | Chỉ admin |
| `/products` | ✅ | ✅ | Tất cả roles |
| `/product-images` | ✅ | ✅ | Tất cả roles |
| `/inventory` | ✅ | ✅ | Tất cả roles |
| `/inventory-transactions` | ✅ | ❌ | Chỉ admin |
| `/orders` | ✅ | ✅ | Tất cả roles |
| `/order-items` | ✅ | ❌ | Chỉ admin |
| `/payments` | ✅ | ❌ | Chỉ admin |
| `/carts` | ✅ | ❌ | Chỉ admin |
| `/cart-items` | ✅ | ❌ | Chỉ admin |

### 3.5. Middleware xác thực (Backend)

**Điều kiện để truy cập protected routes:**
```
1. Request phải có header: Authorization: Bearer <token>
2. Token phải hợp lệ (chưa hết hạn, đúng secret)
3. Token phải chứa userId, username, roleId
```

**Nếu không đạt:**
- Thiếu token → Lỗi 401: "Token không được cung cấp."
- Token không hợp lệ → Lỗi 401: "Token không hợp lệ hoặc đã hết hạn."

---

## 4. CÁC ĐIỀU KIỆN KHÁC

### 4.1. JWT Token

**Thông tin trong token:**
```typescript
{
  userId: number,      // ID người dùng
  username: string,    // Tên đăng nhập
  roleId: number | null // ID vai trò
}
```

**Thời gian hết hạn:**
- **Mặc định**: 7 ngày
- **Cấu hình**: `JWT_EXPIRES_IN` trong `.env`
- **Ví dụ**: `JWT_EXPIRES_IN=7d` hoặc `JWT_EXPIRES_IN=24h`

**Secret key:**
- **Mặc định**: `'your-secret-key-change-in-production'`
- **Cấu hình**: `JWT_SECRET` trong `.env`
- **⚠️ QUAN TRỌNG**: Phải đổi secret key trong production!

### 4.2. Password Hash

**Thuật toán:** bcrypt
**Lưu ý:**
- Password KHÔNG BAO GIỜ được lưu dạng plain text
- Mỗi lần hash sẽ tạo salt khác nhau
- Không thể reverse từ hash về password gốc

### 4.3. Rate Limiting (Chưa implement)

**⚠️ Nên thêm:**
- Giới hạn số lần đăng nhập thất bại
- Chặn IP sau nhiều lần thất bại
- Tạm khóa tài khoản sau N lần thất bại

---

## 5. LUỒNG XỬ LÝ ĐĂNG NHẬP

```
1. Nhận request POST /api/auth/login
   │
   ├─► Validate input (username, password)
   │   ├─► Thiếu username → Lỗi 400
   │   ├─► Thiếu password → Lỗi 400
   │   └─► Format sai → Lỗi 400
   │
2. Tìm user trong database theo username
   │   (JOIN với roles để lấy role_name)
   │
   ├─► User không tồn tại → Lỗi 401
   │
3. Kiểm tra status user
   │
   ├─► Status ≠ 'active' → Lỗi 403
   │
4. So sánh password (bcrypt.compare)
   │
   ├─► Password sai → Lỗi 401
   │
5. Kiểm tra role có quyền đăng nhập
   │
   ├─► Role ≠ 'admin' và ≠ 'staff' → Lỗi 403
   ├─► Role = null → Lỗi 403
   │
6. Tạo JWT token
   │
   ├─► Token chứa: userId, username, roleId
   ├─► Expires: 7 ngày (mặc định)
   │
7. Trả về response
   │
   └─► { token, user: { id, username, fullName, email, roleName } }
```

---

## 6. RESPONSE

### 6.1. Khi thành công (200 OK)
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "roleName": "admin"
    }
  },
  "message": "Đăng nhập thành công."
}
```

### 6.2. Khi thất bại

#### Lỗi 400 - Bad Request (Input không hợp lệ)
```json
{
  "message": "username là bắt buộc và phải là chuỗi không rỗng."
}
```
hoặc
```json
{
  "message": "password là bắt buộc và phải là chuỗi không rỗng."
}
```

#### Lỗi 401 - Unauthorized (Sai thông tin đăng nhập)
```json
{
  "message": "Tên đăng nhập hoặc mật khẩu không đúng."
}
```

#### Lỗi 403 - Forbidden

**Tài khoản bị vô hiệu hóa:**
```json
{
  "message": "Tài khoản đã bị vô hiệu hóa."
}
```

**Không đủ quyền đăng nhập (role không phải admin/staff):**
```json
{
  "message": "Bạn không đủ quyền để đăng nhập vào hệ thống quản trị."
}
```

---

## 7. BẢNG TÓM TẮT ĐIỀU KIỆN

| # | Điều kiện | Yêu cầu | Lỗi nếu không đạt |
|---|-----------|---------|-------------------|
| **1** | **username** | Bắt buộc, string, không rỗng | 400: "username là bắt buộc..." |
| **2** | **password** | Bắt buộc, string, không rỗng | 400: "password là bắt buộc..." |
| **3** | **User tồn tại** | Username phải có trong DB | 401: "Tên đăng nhập hoặc mật khẩu không đúng" |
| **4** | **Status = 'active'** | User phải active | 403: "Tài khoản đã bị vô hiệu hóa" |
| **5** | **Password đúng** | Password phải khớp (bcrypt) | 401: "Tên đăng nhập hoặc mật khẩu không đúng" |
| **6** | **Role = 'admin' hoặc 'staff'** | Chỉ admin/staff được đăng nhập | 403: "Bạn không đủ quyền để đăng nhập vào hệ thống quản trị" |
| **7** | **Token hợp lệ** | Khi truy cập protected routes | 401: "Token không hợp lệ hoặc đã hết hạn" |
| **8** | **Role có quyền** | Khi truy cập route có phân quyền | 403: "Không có quyền truy cập" (Frontend) |

---

## 8. VÍ DỤ TEST CASES

### ✅ Test case 1: Đăng nhập thành công (Admin)
```json
Request:
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

Response: 200 OK
{
  "data": {
    "token": "...",
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "roleName": "admin"
    }
  }
}
```

### ✅ Test case 2: Đăng nhập thành công (Staff)
```json
Request:
POST /api/auth/login
{
  "username": "staff1",
  "password": "staff123"
}

Response: 200 OK
{
  "data": {
    "token": "...",
    "user": {
      "id": 2,
      "username": "staff1",
      "fullName": "Staff User",
      "email": "staff@example.com",
      "roleName": "staff"
    }
  }
}
```

### ❌ Test case 3: Thiếu username
```json
Request:
POST /api/auth/login
{
  "password": "admin123"
}

Response: 400 Bad Request
{
  "message": "username là bắt buộc và phải là chuỗi không rỗng."
}
```

### ❌ Test case 4: Username không tồn tại
```json
Request:
POST /api/auth/login
{
  "username": "notexist",
  "password": "anypassword"
}

Response: 401 Unauthorized
{
  "message": "Tên đăng nhập hoặc mật khẩu không đúng."
}
```

### ❌ Test case 5: Password sai
```json
Request:
POST /api/auth/login
{
  "username": "admin",
  "password": "wrongpassword"
}

Response: 401 Unauthorized
{
  "message": "Tên đăng nhập hoặc mật khẩu không đúng."
}
```

### ❌ Test case 6: Tài khoản bị vô hiệu hóa
```json
Request:
POST /api/auth/login
{
  "username": "inactive_user",
  "password": "correctpassword"
}

Response: 403 Forbidden
{
  "message": "Tài khoản đã bị vô hiệu hóa."
}
```

### ❌ Test case 7: User có role khác (customer, manager, ...)
```json
Request:
POST /api/auth/login
{
  "username": "customer1",
  "password": "password123"
}

Response: 403 Forbidden
{
  "message": "Bạn không đủ quyền để đăng nhập vào hệ thống quản trị."
}

Lưu ý:
- Đăng nhập thất bại ngay từ Backend
- Không tạo token
- User không thể truy cập dashboard admin
```

### ❌ Test case 8: User không có role (roleName = null)
```json
Request:
POST /api/auth/login
{
  "username": "user_no_role",
  "password": "password123"
}

Response: 403 Forbidden
{
  "message": "Bạn không đủ quyền để đăng nhập vào hệ thống quản trị."
}
```

### ❌ Test case 9: Staff cố truy cập route chỉ dành cho Admin
```
Request:
GET /api/users
Headers: Authorization: Bearer <staff_token>

Response: 200 OK (Backend không block)
Nhưng Frontend sẽ hiển thị: "Không có quyền truy cập"
```


---

## 9. XỬ LÝ ROLE ĐỘNG

### 9.1. Tình trạng hiện tại

**Backend:**
- ✅ Hỗ trợ role động (có thể tạo bất kỳ role nào)
- ✅ API `/roles` để quản lý roles
- ✅ User có thể có role bất kỳ hoặc không có role (NULL)

**Frontend:**
- ❌ Hardcode `type RoleName = 'admin' | 'staff'`
- ❌ Chỉ nhận diện 2 role: admin và staff
- ❌ Role khác sẽ bị bỏ qua

### 9.2. Các trường hợp role

| Trường hợp | roleName | Kết quả Frontend |
|------------|----------|-----------------|
| Admin | `'admin'` | ✅ Hoạt động bình thường |
| Staff | `'staff'` | ✅ Hoạt động bình thường |
| Customer | `'customer'` | ❌ Không nhận diện, không truy cập được |
| Manager | `'manager'` | ❌ Không nhận diện, không truy cập được |
| Supervisor | `'supervisor'` | ❌ Không nhận diện, không truy cập được |
| Không có role | `null` | ❌ Không truy cập được |

### 9.3. Cách sửa để hỗ trợ role động

#### Option 1: Bỏ type hardcode (Đơn giản nhất)
```typescript
// Backend/src/utils/permissions.ts

// ❌ Cũ:
export type RoleName = 'admin' | 'staff'

// ✅ Mới:
// Bỏ type này, dùng string trực tiếp

export const canAccessRoute = (routePath: string, roleName: string | null | undefined): boolean => {
  if (!roleName) {
    return false
  }
  
  const role = roleName.toLowerCase()  // Không cần cast nữa
  // ... logic check
}
```

#### Option 2: Lấy roles từ Backend (Tốt nhất)
```typescript
// Fetch roles từ API khi app khởi động
const { data: roles } = await apiClient.get('/roles')
// roles = [{ id: 1, roleName: 'admin' }, { id: 2, roleName: 'staff' }, ...]

// Dùng để check
const roleNames = roles.map(r => r.roleName.toLowerCase())
if (roleNames.includes(userRole.toLowerCase())) {
  // Cho phép
}
```

#### Option 3: Thêm role mới vào type (Nếu biết trước)
```typescript
export type RoleName = 'admin' | 'staff' | 'customer' | 'manager' | 'supervisor'
```

### 9.4. Cấu hình phân quyền cho role mới

**Ví dụ: Thêm role 'manager'**

```typescript
// Backend/src/utils/permissions.ts

export const getAllNavigationItems = (): NavigationItem[] => [
  // ... các items hiện tại
  
  // Thêm route cho manager
  { label: 'Quản lý đơn hàng', path: '/orders', icon: null, roles: ['admin', 'staff', 'manager'] },
  { label: 'Báo cáo bán hàng', path: '/sales-reports', icon: null, roles: ['admin', 'manager'] },
]
```

### 9.5. Best Practice

**Nên:**
- ✅ Lấy danh sách roles từ Backend API
- ✅ Dùng string thay vì hardcode type
- ✅ Cấu hình phân quyền linh hoạt trong database
- ✅ Có default behavior cho role không xác định

**Không nên:**
- ❌ Hardcode danh sách role trong Frontend
- ❌ Giả định chỉ có 2 role
- ❌ Block user nếu role không match

## 10. BẢO MẬT

### ✅ Đã implement
- Password được hash bằng bcrypt (không lưu plain text)
- JWT token có thời gian hết hạn
- Kiểm tra status user (chặn tài khoản inactive)
- Validate input đầy đủ
- Token-based authentication
- Role-based authorization (Frontend)

### ⚠️ Lưu ý & Nên cải thiện
- Secret key phải đổi trong production
- Token được lưu ở client (localStorage) - có thể bị XSS
- Nên implement rate limiting để chống brute force
- Nên implement refresh token cho bảo mật tốt hơn
- Nên implement role check ở Backend (middleware) thay vì chỉ Frontend
- Nên log các lần đăng nhập thất bại để phát hiện tấn công

---

## 11. CODE THAM KHẢO

### Validator (Server/src/validators/auth.validator.ts)
```typescript
export const validateLoginPayload = (body: unknown): LoginPayload => {
  // Kiểm tra body là object
  // Kiểm tra username: bắt buộc, string, không rỗng
  // Kiểm tra password: bắt buộc, string, không rỗng
  // Trả về { username: trimmed, password }
}
```

### Service (Server/src/services/auth.service.ts)
```typescript
export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  // 1. Tìm user theo username (JOIN với roles)
  // 2. Kiểm tra user tồn tại
  // 3. Kiểm tra status = 'active'
  // 4. So sánh password (bcrypt)
  // 5. Kiểm tra role = 'admin' hoặc 'staff' (chỉ 2 role này được đăng nhập)
  // 6. Tạo JWT token (chứa userId, username, roleId)
  // 7. Trả về { token, user: { id, username, fullName, email, roleName } }
}
```

### Middleware (Server/src/middleware/auth.middleware.ts)
```typescript
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // 1. Kiểm tra header Authorization: Bearer <token>
  // 2. Verify token
  // 3. Gắn payload vào req.user
  // 4. Cho phép tiếp tục (next())
}
```

### Frontend Permission Check (Backend/src/utils/permissions.ts)
```typescript
export const canAccessRoute = (routePath: string, roleName: string | null | undefined): boolean => {
  // 1. Kiểm tra roleName hợp lệ
  // 2. Tìm route trong danh sách
  // 3. Nếu route không có roles → tất cả được phép
  // 4. Nếu route có roles → chỉ role trong danh sách được phép
  // 5. Nếu route không tồn tại → chỉ admin được phép
}
```
