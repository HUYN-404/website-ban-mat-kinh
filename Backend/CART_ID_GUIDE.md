# Hướng dẫn lấy Cart ID

## 1. Trong Frontend (React)

### Cách 1: Sử dụng CartContext (Khuyến nghị)

```typescript
import { useCartContext } from '../contexts/CartContext'

function MyComponent() {
  const { cartId } = useCartContext()
  
  // cartId sẽ là number | null
  // Nếu user chưa có cart, cartId sẽ là null
  // Nếu user đã có cart, cartId sẽ là số ID của cart
  
  if (cartId) {
    console.log('Cart ID:', cartId)
  } else {
    console.log('User chưa có giỏ hàng')
  }
}
```

### Cách 2: Sử dụng API trực tiếp

```typescript
import { getActiveCart } from '../services/cart.service'
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user } = useAuth()
  
  const fetchCart = async () => {
    if (!user?.id) return
    
    try {
      const cart = await getActiveCart(user.id)
      if (cart) {
        console.log('Cart ID:', cart.id)
      }
    } catch (error) {
      console.error('Lỗi khi lấy cart:', error)
    }
  }
}
```

## 2. Trong Backend Admin

### Xem Cart ID của User

1. Vào trang **"Giỏ hàng"** (`/carts`)
2. Nhập **User ID** vào ô input
3. Click **"Tải giỏ hàng"**
4. Sẽ hiển thị:
   - **Giỏ đang hoạt động**: Cart ID (ví dụ: `#1`)
   - **Lịch sử giỏ hàng**: Danh sách các cart với Cart ID

### Xem Cart Items

1. Vào trang **"Sản phẩm giỏ"** (`/cart-items`)
2. Nhập **Cart ID** vào ô input
3. Click **"Xem sản phẩm"**
4. Sẽ hiển thị tất cả sản phẩm trong cart đó

## 3. Từ Database

```sql
-- Lấy cart_id của user
SELECT cart_id, user_id, status, created_at
FROM carts
WHERE user_id = ? AND status = 'active'
LIMIT 1;

-- Lấy tất cả cart của user
SELECT cart_id, user_id, status, created_at, updated_at
FROM carts
WHERE user_id = ?
ORDER BY created_at DESC;

-- Lấy items trong cart
SELECT cart_item_id, cart_id, product_id, quantity, unit_price
FROM cart_items
WHERE cart_id = ?
ORDER BY created_at ASC;
```

## 4. API Endpoints

### Lấy Active Cart của User
```
GET /api/carts/user/:userId/active
Response: { data: { id: number, userId: number, status: string, ... } }
```

### Lấy Cart theo ID
```
GET /api/carts/:cartId
Response: { data: { id: number, userId: number, status: string, ... } }
```

### Lấy Items trong Cart
```
GET /api/carts/:cartId/items
Response: { data: CartItem[] }
```

## Lưu ý

- Mỗi user chỉ có **1 cart active** tại một thời điểm
- Khi user thêm sản phẩm vào giỏ, hệ thống tự động tạo cart nếu chưa có
- Cart ID được lưu trong `CartContext` và tự động cập nhật khi user đăng nhập




