import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ToastContainer from './components/Toast'
import { router } from './router'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 15s: đủ ngắn để dữ liệu (đơn hàng/giao dịch mới) sớm xuất hiện,
      // nhưng vẫn không gọi lại API liên tục khi đi qua lại giữa các trang admin.
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      // Quay lại tab admin (sau khi đặt hàng ở storefront) → tự tải lại dữ liệu mới.
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)