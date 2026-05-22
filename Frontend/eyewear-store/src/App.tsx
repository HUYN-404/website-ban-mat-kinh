import { Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import AccessoriesPage from './pages/AccessoriesPage'
import BrandStoryPage from './pages/BrandStoryPage'
import CartPage from './pages/CartPage'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import OrderDetailPage from './pages/OrderDetailPage'
import OrdersPage from './pages/OrdersPage'
import PaymentPage from './pages/PaymentPage'
import PaymentResultPage from './pages/PaymentResultPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductListPage from './pages/ProductListPage'
import ProfilePage from './pages/ProfilePage'
import TryOnPage from './pages/TryOnPage'

const App = () => {
  return (
    <ScrollToTop>
      <Routes>
        {/* Payment pages - không có Layout (Navbar/Footer) - PHẢI đặt trước */}
        <Route path="/payment/process" element={<PaymentPage />} />
        <Route path="/payment/result" element={<PaymentResultPage />} />
        
        {/* Các trang khác - có Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route
            path="products"
            element={
              <ProductListPage
                eyebrow="SeeU Eyewear"
                title="Bộ sưu tập kính"
                description="Tinh tuyển các thiết kế kính mắt cao cấp được chế tác thủ công với chất liệu nhập khẩu từ Nhật Bản, Ý và Pháp."
              />
            }
          />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="thuong-hieu" element={<BrandStoryPage />} />
          <Route path="phu-kien" element={<AccessoriesPage />} />
          <Route path="thu-kinh" element={<TryOnPage />} />
          <Route path="gio-hang" element={<CartPage />} />
          <Route path="don-hang" element={<OrdersPage />} />
          <Route path="don-hang/:orderId" element={<OrderDetailPage />} />
          <Route path="lien-he" element={<ContactPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ScrollToTop>
  )
}

export default App

