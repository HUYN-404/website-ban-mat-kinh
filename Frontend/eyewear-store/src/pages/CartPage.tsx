import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi'

import { useAuth } from '../contexts/AuthContext'
import { useCartContext } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { formatCurrency } from '../utils/formatCurrency'
import { createOrderFromCart } from '../services/orders.service'
import PageHeader from '../components/PageHeader'
import ConfirmationDialog from '../components/ConfirmationDialog'
import ImageViewer from '../components/ImageViewer'
import CheckoutModal, { type ShippingInfo } from '../components/CheckoutModal'
import OrderSuccessModal from '../components/OrderSuccessModal'

const CartPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { items, isLoading, total, itemCount, updateQuantity, removeItem, refreshCart } = useCartContext()
  const { error } = useToast()
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null)
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [viewerProductName, setViewerProductName] = useState<string>('')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)
  const [orderTotal, setOrderTotal] = useState<number>(0)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-charcoal">Đang tải giỏ hàng...</h2>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="pb-20">
        <PageHeader eyebrow="Giỏ hàng" title="Giỏ hàng của bạn" />
        <section className="mx-auto mt-10 max-w-6xl px-6">
          <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-neutral-300 bg-white/60 p-16 text-center">
            <FiShoppingBag size={64} className="text-neutral-400" />
            <div>
              <h4 className="text-xl font-semibold text-charcoal">Giỏ hàng trống</h4>
              <p className="mt-2 max-w-md text-sm leading-7 text-neutral-600">
                Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi.
              </p>
            </div>
            <Link
              to="/products"
              className="rounded-full bg-charcoal px-8 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500"
            >
              Xem sản phẩm
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <PageHeader eyebrow="Giỏ hàng" title={`Giỏ hàng của bạn (${itemCount} sản phẩm)`} />
      <section className="mx-auto mt-10 max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
          {/* Danh sách sản phẩm */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-6 rounded-3xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm shadow-black/5"
              >
                {/* Ảnh sản phẩm */}
                <div className="relative h-32 w-32 flex-shrink-0">
                  {item.productImage ? (
                    <button
                      type="button"
                      onClick={() => {
                        setViewerImages([item.productImage!])
                        setViewerProductName(item.productName)
                        setIsImageViewerOpen(true)
                      }}
                      className="relative block h-full w-full overflow-hidden rounded-2xl bg-alabaster transition hover:opacity-90"
                    >
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition hover:opacity-100">
                        <div className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-charcoal backdrop-blur-sm">
                          Xem ảnh
                        </div>
                      </div>
                    </button>
                  ) : (
                    <Link
                      to={`/products/${item.productId}`}
                      className="flex h-full w-full items-center justify-center rounded-2xl bg-alabaster text-neutral-400"
                    >
                      <FiShoppingBag size={32} />
                    </Link>
                  )}
                </div>

                {/* Thông tin sản phẩm */}
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex-1">
                    <Link
                      to={`/products/${item.productId}`}
                      className="text-lg font-semibold text-charcoal transition hover:text-gold-600"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-1 text-sm text-neutral-600">
                      {formatCurrency(item.unitPrice)} / sản phẩm
                    </p>
                  </div>

                  {/* Điều khiển số lượng */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 rounded-full border border-neutral-300 bg-white px-4 py-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-neutral-600 transition hover:text-charcoal"
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-neutral-600 transition hover:text-charcoal"
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-charcoal">
                        {formatCurrency(item.subtotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setItemToDelete({ id: item.id, name: item.productName })
                          setDeleteItemId(item.id)
                        }}
                        className="rounded-full p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Xóa sản phẩm"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tóm tắt đơn hàng */}
          <div className="h-fit rounded-3xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm shadow-black/5 lg:sticky lg:top-24">
            <h3 className="mb-6 text-lg font-semibold text-charcoal">Tóm tắt đơn hàng</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Tạm tính ({itemCount} sản phẩm)</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Phí vận chuyển</span>
                <span className="text-green-600">Miễn phí</span>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-charcoal">Tổng cộng</span>
                  <span className="text-2xl font-semibold text-charcoal">{formatCurrency(total)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!user?.id) {
                    error('Vui lòng đăng nhập để thanh toán')
                    return
                  }
                  setIsCheckoutOpen(true)
                }}
                disabled={items.length === 0}
                className="mt-6 w-full rounded-full bg-charcoal px-8 py-4 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 ease-luxury hover:-translate-y-0.5 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Thanh toán
              </button>
              <Link
                to="/products"
                className="block w-full rounded-full border border-neutral-300 bg-white px-8 py-4 text-center text-sm font-semibold uppercase tracking-[0.35em] text-neutral-700 transition duration-300 ease-luxury hover:bg-neutral-50"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ConfirmationDialog
        isOpen={deleteItemId !== null}
        onClose={() => {
          setDeleteItemId(null)
          setItemToDelete(null)
        }}
        onConfirm={async () => {
          if (deleteItemId) {
            await removeItem(deleteItemId)
            setDeleteItemId(null)
            setItemToDelete(null)
          }
        }}
        title="Xóa sản phẩm"
        message={`Bạn có chắc muốn xóa sản phẩm "${itemToDelete?.name || ''}" khỏi giỏ hàng?`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />

      <ImageViewer
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        images={viewerImages}
        initialIndex={0}
        productName={viewerProductName}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsCheckoutOpen(false)
          }
        }}
        items={items}
        total={total}
        itemCount={itemCount}
        isLoading={isSubmitting}
        onSubmit={async (shippingInfo: ShippingInfo) => {
          if (!user?.id) {
            error('Vui lòng đăng nhập để thanh toán')
            return
          }

          setIsSubmitting(true)
          try {
            // Tạo đơn hàng từ giỏ hàng
            const order = await createOrderFromCart(
              user.id,
              items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
              shippingInfo,
              total,
            )

            // Xóa giỏ hàng sau khi đặt hàng thành công
            await refreshCart()

            // Đóng checkout modal
            setIsCheckoutOpen(false)
            setCreatedOrderId(order.id)
            setOrderTotal(order.totalAmount)
          } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.'
            error(errorMessage)
          } finally {
            setIsSubmitting(false)
          }
        }}
      />

      <OrderSuccessModal
        isOpen={createdOrderId !== null}
        onClose={() => {
          setCreatedOrderId(null)
          navigate('/products')
        }}
        orderId={createdOrderId || 0}
        totalAmount={orderTotal}
        onViewOrder={() => {
          setCreatedOrderId(null)
          navigate('/profile') // Có thể tạo trang "Đơn hàng của tôi" sau
        }}
      />
    </div>
  )
}

export default CartPage



