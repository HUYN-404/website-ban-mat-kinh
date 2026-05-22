import { Outlet } from 'react-router-dom'

import Footer from './Footer'
import ChatbotWidget from './ChatbotWidget'
import Navbar from './Navbar'

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <ChatbotWidget />
      <Footer />
    </div>
  )
}

export default Layout


