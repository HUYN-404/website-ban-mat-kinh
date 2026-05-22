import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  HiOutlineBars3,
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiMiniXMark,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2'

import seeuLogo from '../assets/branding/seeu-logo.png'
import type { Product } from '../data/products'
import { formatCurrency } from '../utils/formatCurrency'
import normalizeSearchText from '../utils/normalizeSearchText'
import { useAuth } from '../contexts/AuthContext'
import { useCartContext } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useProducts } from '../services/products.service'
import ConfirmationDialog from './ConfirmationDialog'

const navItems = [
  { label: 'Thương hiệu', href: '/thuong-hieu' },
  { label: 'Sản phẩm', href: '/products' },
  { label: 'Phụ kiện', href: '/phu-kien' },
  { label: 'Thử kính', href: '/thu-kinh' },
  { label: 'Liên hệ', href: '/lien-he' },
]

const Navbar = () => {
  const { user, login, register, logout, isAuthenticated } = useAuth()
  const { itemCount } = useCartContext()
  const { success } = useToast()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const userDropdownRef = useRef<HTMLDivElement | null>(null)

  const currentSearchKeyword = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('search')?.trim() ?? ''
  }, [location.search])

  // Fetch products từ API để tìm kiếm (chỉ fetch khi có search query)
  const normalizedSearchQuery = normalizeSearchText(searchQuery)
  const { data: allProducts = [] } = useProducts({
    status: 'available',
    search: normalizedSearchQuery || undefined,
  })

  const { results: searchResults, totalMatches } = useMemo<{
    results: Product[]
    totalMatches: number
  }>(() => {
    if (!normalizedSearchQuery || !allProducts.length) {
      return { results: [], totalMatches: 0 }
    }

    // API đã filter theo search, nhưng có thể filter thêm ở FE để tìm chính xác hơn
    const matches = allProducts.filter((product) => {
      const haystack = `${product.name} ${product.brand} ${product.colorway || ''} ${product.description || ''}`
      return normalizeSearchText(haystack).includes(normalizedSearchQuery)
    })

    return {
      results: matches.slice(0, 5),
      totalMatches: matches.length,
    }
  }, [normalizedSearchQuery, allProducts])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isSearchOpen && !isAuthOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false)
          setSearchQuery('')
        }
        if (isAuthOpen) {
          setIsAuthOpen(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchOpen, isAuthOpen])

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false)
      }
    }

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  useEffect(() => {
    if (isSearchOpen || isAuthOpen) {
      document.body.style.setProperty('overflow', 'hidden')
    } else {
      document.body.style.removeProperty('overflow')
    }

    return () => {
      document.body.style.removeProperty('overflow')
    }
  }, [isSearchOpen, isAuthOpen])

  useEffect(() => {
    if (!isSearchOpen) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 150)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isSearchOpen])

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
  }

  const openSearch = () => {
    setSearchQuery(currentSearchKeyword)
    setIsSearchOpen(true)
    setIsMenuOpen(false)
  }

  const closeSearch = () => {
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const keyword = searchQuery.trim()

    if (!keyword) {
      return
    }

    const params = new URLSearchParams({ search: keyword })

    closeSearch()
    navigate(`/products?${params.toString()}`)
  }

  const handleSuggestionClick = (productId: string) => {
    closeSearch()
    navigate(`/products/${productId}`)
  }

  const handleCart = () => {
    navigate('/gio-hang')
  }

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode)
    setIsAuthOpen(true)
    setIsMenuOpen(false)
  }

  const closeAuthModal = () => {
    setIsAuthOpen(false)
  }

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError(null)

    const form = event.currentTarget
    const formData = new FormData(form)

    const username = formData.get('username')?.toString().trim() ?? ''
    const password = formData.get('password')?.toString() ?? ''
    const email = formData.get('email')?.toString().trim() ?? ''
    const fullName = formData.get('fullName')?.toString().trim() || undefined

    if (authMode === 'register') {
      if (!username || !password || !email) {
        setAuthError('Vui lòng nhập đủ username, email và password.')
        return
      }

      setIsSubmittingAuth(true)
      try {
        await register({ username, password, email, fullName })
        form.reset()
        closeAuthModal()
        success('Đăng ký thành công!')
      } catch (err: any) {
        setAuthError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      } finally {
        setIsSubmittingAuth(false)
      }
      return
    }

    // Đăng nhập
    if (!username || !password) {
      setAuthError('Vui lòng nhập đầy đủ thông tin.')
      return
    }

    setIsSubmittingAuth(true)
    try {
      await login(username, password)
      if (form) {
        form.reset()
      }
      closeAuthModal()
      success('Đăng nhập thành công!')
    } catch (err: any) {
      setAuthError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  const handleLogoutConfirm = () => {
    logout()
    setIsAuthOpen(false)
    setIsUserDropdownOpen(false)
    setIsLogoutDialogOpen(false)
    success('Đã đăng xuất thành công!')
  }

  const handleLogout = () => {
    setIsLogoutDialogOpen(true)
    setIsUserDropdownOpen(false)
  }

  const handleProfileClick = () => {
    navigate('/profile')
    setIsUserDropdownOpen(false)
  }

  const handleOrdersClick = () => {
    navigate('/don-hang')
    setIsUserDropdownOpen(false)
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition duration-500 ease-luxury ${
          isScrolled ? 'border-b border-neutral-200 bg-white/95 shadow-lg shadow-black/5 backdrop-blur' : 'border-b border-white/60 bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-8 px-6 py-4">
          <Link to="/" className="flex items-center flex-shrink-0">
            <img
              src={seeuLogo}
              alt="SeeU Eyewear"
              className="h-16 w-auto object-contain"
              style={{ display: 'block' }}
            />
          </Link>

          <nav className="hidden items-center gap-10 text-sm font-medium uppercase tracking-[0.4em] text-neutral-500 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `relative whitespace-nowrap pb-1 transition duration-300 hover:text-charcoal ${
                    isActive ? 'text-charcoal' : ''
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="whitespace-nowrap">{item.label}</span>
                    <span
                      className={`absolute bottom-0 left-0 h-[1.5px] w-full origin-left rounded-full bg-gold-500 transition duration-300 ease-luxury ${
                        isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openSearch}
              className="hidden h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-charcoal transition duration-300 ease-luxury hover:-translate-y-0.5 hover:border-neutral-900 hover:text-neutral-900 md:flex"
              aria-label="Tìm kiếm"
            >
              <HiOutlineMagnifyingGlass className="text-xl" />
            </button>
            {isAuthenticated ? (
              <div
                ref={userDropdownRef}
                className="relative hidden sm:block"
                onMouseEnter={() => setIsUserDropdownOpen(true)}
                onMouseLeave={() => setIsUserDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-charcoal transition duration-300 ease-luxury hover:-translate-y-0.5 hover:border-neutral-900 hover:text-neutral-900"
                  aria-label="Tài khoản"
                >
                  <HiOutlineUser className="text-xl" />
                </button>
                {/* Bridge element để giữ khoảng cách khi di chuyển chuột từ button xuống dropdown */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 top-full h-4 w-full" />
                )}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 top-full pt-4 w-64 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xl shadow-black/20 z-50">
                    <div className="mb-3 border-b border-neutral-200/60 pb-3">
                      <p className="text-sm font-semibold text-charcoal">
                        {user?.fullName || user?.username}
                      </p>
                      {user?.email && (
                        <p className="mt-1 text-xs text-neutral-500">{user.email}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleProfileClick}
                      className="flex w-full items-center justify-between rounded-xl border border-transparent bg-white px-4 py-3 text-left text-sm font-medium text-neutral-700 transition hover:border-neutral-200 hover:bg-neutral-50"
                    >
                      <span>Thông tin tài khoản</span>
                      <HiOutlineUser className="text-lg" />
                    </button>
                    <button
                      type="button"
                      onClick={handleOrdersClick}
                      className="mt-2 flex w-full items-center justify-between rounded-xl border border-transparent bg-white px-4 py-3 text-left text-sm font-medium text-neutral-700 transition hover:border-neutral-200 hover:bg-neutral-50"
                    >
                      <span>Đơn hàng của tôi</span>
                      <HiOutlineShoppingBag className="text-lg" />
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-2 flex w-full items-center justify-between rounded-xl border border-transparent bg-white px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50"
                    >
                      <span>Đăng xuất</span>
                      <HiOutlineArrowRightOnRectangle className="text-lg" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="hidden h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-charcoal transition duration-300 ease-luxury hover:-translate-y-0.5 hover:border-neutral-900 hover:text-neutral-900 sm:flex"
                aria-label="Tài khoản"
              >
                <HiOutlineUser className="text-xl" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCart}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-charcoal transition duration-300 ease-luxury hover:-translate-y-0.5 hover:border-neutral-900 hover:text-neutral-900"
              aria-label="Giỏ hàng"
            >
              <HiOutlineShoppingBag className="text-xl" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold-500 px-1.5 text-[10px] font-semibold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={toggleMenu}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-charcoal transition duration-300 ease-luxury hover:-translate-y-0.5 hover:border-neutral-900 hover:text-neutral-900 lg:hidden"
              aria-label="Mở menu"
            >
              {isMenuOpen ? <HiMiniXMark className="text-2xl" /> : <HiOutlineBars3 className="text-2xl" />}
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden border-t border-neutral-200/60 bg-white/95 backdrop-blur transition-[max-height,opacity] duration-500 ease-luxury lg:hidden ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="space-y-2 px-6 py-5 text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
            <button
              type="button"
              onClick={openSearch}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              <span>Tìm kiếm sản phẩm</span>
              <HiOutlineMagnifyingGlass className="text-lg" />
            </button>
            {isAuthenticated ? (
              <div className="flex w-full items-center justify-between rounded-2xl border border-neutral-200/80 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-charcoal">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-neutral-500">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 transition hover:text-neutral-900"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex w-full items-center justify-between rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900"
              >
                <span>Tài khoản của tôi</span>
                <HiOutlineUser className="text-lg" />
              </button>
            )}
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center justify-between border-b border-neutral-200/60 pb-3 transition hover:text-charcoal ${
                    isActive ? 'text-charcoal' : ''
                  }`
                }
              >
                <span>{item.label}</span>
                <span className="text-xs">→</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-neutral-900/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Hộp thoại tìm kiếm sản phẩm"
          onClick={closeSearch}
        >
          <div
            className="mx-auto mt-24 w-full max-w-2xl px-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold uppercase tracking-[0.35em] text-neutral-500">
                  Tìm kiếm
                </h3>
                <button
                  type="button"
                  onClick={closeSearch}
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 transition hover:text-neutral-900"
                >
                  Đóng
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="mt-6 space-y-5">
                <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-5 py-3 shadow-sm shadow-black/5 transition focus-within:border-neutral-900">
                  <HiOutlineMagnifyingGlass className="text-xl text-neutral-400" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Tìm kiếm theo tên sản phẩm, thương hiệu hoặc màu sắc..."
                    className="w-full bg-transparent text-base text-neutral-800 outline-none placeholder:text-neutral-400"
                    aria-label="Nhập từ khóa tìm kiếm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 transition hover:text-neutral-900"
                    >
                      Xóa
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                  <span>Nhấn enter để xem tất cả kết quả</span>
                  <button
                    type="submit"
                    className="rounded-full bg-charcoal px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neutral-900"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </form>

              <div className="mt-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                  Gợi ý phù hợp
                </p>
                {searchQuery ? (
                  searchResults.length ? (
                    <ul className="space-y-3">
                      {searchResults.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(product.id)}
                            className="flex w-full items-center justify-between rounded-2xl border border-transparent bg-white px-5 py-4 text-left transition hover:border-neutral-200 hover:bg-neutral-50"
                          >
                            <div>
                              <p className="text-base font-semibold text-charcoal">{product.name}</p>
                              <p className="mt-1 text-sm text-neutral-500">
                                {product.brand} • {formatCurrency(product.price)}
                              </p>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
                              Xem
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-2xl bg-neutral-100 px-5 py-4 text-sm text-neutral-600">
                      Không tìm thấy sản phẩm nào phù hợp với từ khóa này.
                    </p>
                  )
                ) : (
                  <p className="rounded-2xl bg-neutral-100 px-5 py-4 text-sm text-neutral-600">
                    Nhập từ khóa để khám phá hơn 100+ thiết kế kính mắt cao cấp từ SeeU Studio.
                  </p>
                )}
                {searchResults.length > 0 && totalMatches > searchResults.length ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                    Đang hiển thị {searchResults.length} trong tổng số {totalMatches} sản phẩm phù hợp.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {isAuthOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-neutral-900/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Hộp thoại tài khoản người dùng"
          onClick={closeAuthModal}
        >
          <div
            className="mx-auto mt-24 w-full max-w-md px-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-charcoal">
                    {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {authMode === 'login'
                      ? 'Đăng nhập để theo dõi đơn hàng và trải nghiệm dịch vụ cá nhân hóa.'
                      : 'Tạo tài khoản mới để nhận ưu đãi độc quyền và quản lý đơn hàng dễ dàng.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 transition hover:text-neutral-900"
                >
                  Đóng
                </button>
              </div>

              <div className="mt-6 flex gap-2 rounded-full bg-neutral-100 p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                    authMode === 'login'
                      ? 'bg-white text-charcoal shadow-sm shadow-black/5'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                    authMode === 'register'
                      ? 'bg-white text-charcoal shadow-sm shadow-black/5'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Đăng ký
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                {authMode === 'register' && (
                  <label className="block text-sm font-medium text-neutral-600">
                    Họ và tên (tùy chọn)
                    <input
                      name="fullName"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition focus:border-charcoal focus:outline-none"
                    />
                  </label>
                )}
                <label className="block text-sm font-medium text-neutral-600">
                  Tên đăng nhập
                  <input
                    name="username"
                    type="text"
                    required
                    placeholder="seeu.customer"
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition focus:border-charcoal focus:outline-none"
                  />
                </label>
                {authMode === 'register' && (
                  <label className="block text-sm font-medium text-neutral-600">
                    Email
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="ban@seeu.vn"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition focus:border-charcoal focus:outline-none"
                    />
                  </label>
                )}
                <label className="block text-sm font-medium text-neutral-600">
                  Mật khẩu
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••"
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 transition focus:border-charcoal focus:outline-none"
                  />
                </label>
                {authMode === 'register' && (
                  <label className="flex items-center gap-3 text-xs text-neutral-500">
                    <input
                      type="checkbox"
                      name="agree"
                      required
                      className="h-4 w-4 rounded border-neutral-300 text-charcoal focus:ring-charcoal"
                    />
                    Tôi đồng ý nhận thông tin ưu đãi từ SeeU Studio.
                  </label>
                )}
                {authError && (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {authError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full rounded-full bg-charcoal py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingAuth ? 'Đang xử lý...' : authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              </form>

              {authMode === 'login' ? (
                <p className="mt-4 text-sm text-neutral-500">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="font-semibold text-charcoal underline-offset-4 transition hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              ) : (
                <p className="mt-4 text-sm text-neutral-500">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="font-semibold text-charcoal underline-offset-4 transition hover:underline"
                  >
                    Đăng nhập
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        variant="warning"
      />
    </>
  )
}

export default Navbar

