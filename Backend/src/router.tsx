import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardLayout } from './ui/DashboardLayout'
import { LoginPage } from './views/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { UsersPage } from './views/UsersPage'
import { RolesPage } from './views/RolesPage'
import { CategoriesPage } from './views/CategoriesPage'
import { BrandsPage } from './views/BrandsPage'
import { SuppliersPage } from './views/SuppliersPage'
import { ProductsPage } from './views/ProductsPage'
import { ProductImagesPage } from './views/ProductImagesPage'
import { InventoryPage } from './views/InventoryPage'
import { InventoryTransactionsPage } from './views/InventoryTransactionsPage'
import { InventoryTransactionDetailPage } from './views/InventoryTransactionDetailPage'
import { OrdersPage } from './views/OrdersPage'
import { OrderDetailPage } from './views/OrderDetailPage'
import { OrderItemsPage } from './views/OrderItemsPage'
import { PaymentsPage } from './views/PaymentsPage'
import { CartsPage } from './views/CartsPage'
import { CartItemsPage } from './views/CartItemsPage'
import { ReportsPage } from './views/ReportsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ReportsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'roles', element: <RolesPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'brands', element: <BrandsPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'product-images', element: <ProductImagesPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'inventory-transactions', element: <InventoryTransactionsPage /> },
      { path: 'inventory-transactions/:transactionId', element: <InventoryTransactionDetailPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:orderId', element: <OrderDetailPage /> },
      { path: 'order-items', element: <OrderItemsPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'carts', element: <CartsPage /> },
      { path: 'cart-items', element: <CartItemsPage /> }
    ]
  }
])




