export interface Role {
  id: number
  roleName: string
  description: string | null
}

export interface User {
  id: number
  username: string
  fullName: string | null
  email: string | null
  phone: string | null
  address: string | null
  status: 'active' | 'inactive'
  roleId: number | null
  roleName: string | null
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  description: string | null
  parentId: number | null
  parentName: string | null
  createdAt: string
  updatedAt: string
}

export interface Brand {
  id: number
  name: string
  description: string | null
  country: string | null
  createdAt: string
  updatedAt: string
}

export interface BrandImage {
  id: number
  brandId: number
  imageUrl: string
  createdAt: string
}

export interface Supplier {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

export type ProductStatus = 'available' | 'unavailable'

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  stockQuantity: number
  status: ProductStatus
  categoryId: number
  categoryName: string | null
  brandId: number
  brandName: string | null
  supplierId: number
  supplierName: string | null
  materials: string[] | null
  highlights: string[] | null
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: number
  productId: number
  imageUrl: string
  createdAt: string
}

export interface InventoryItem {
  id: number
  productId: number
  productName: string | null
  totalQuantity: number
  lastUpdated: string
}

export type InventoryTransactionType = 'import' | 'export'

export interface InventoryTransaction {
  id: number
  productId: number
  productName: string | null
  userId: number | null
  userName: string | null
  roleName: string | null
  type: InventoryTransactionType
  quantity: number
  note: string | null
  createdAt: string
}

export interface BulkInventoryTransactionItem {
  productId: number
  quantity: number
}

export interface CreateBulkInventoryTransactionPayload {
  items: BulkInventoryTransactionItem[]
  userId?: number | null
  transactionType: InventoryTransactionType
  note?: string | null
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

export interface Order {
  id: number
  userId: number
  userName: string | null
  status: OrderStatus
  totalAmount: number
  paymentId: number | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: number
  productId: number
  productName: string | null
  productStatus: ProductStatus | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export type PaymentMethod = 'cash' | 'credit_card' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'completed' | 'failed'

export interface Payment {
  id: number
  orderId: number
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  transactionCode: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export type CartStatus = 'active' | 'inactive'

export interface Cart {
  id: number
  userId: number
  status: CartStatus
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  id: number
  cartId: number
  productId: number
  productName: string | null
  quantity: number
  unitPrice: number
  subtotal: number
  createdAt: string
  updatedAt: string
}

export interface ReportRecord {
  orderId: number
  customerName: string
  orderDate: string
  totalOrderValue: number
  totalItems: number
  paymentStatus: string | null
}


