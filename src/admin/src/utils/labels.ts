// Nhãn tiếng Việt cho các trạng thái — MỘT chỗ duy nhất cho toàn admin
// (trước đây OrdersPage / PaymentsPage / ReportsPage mỗi trang tự khai báo một bản).
import type { OrderStatus, PaymentStatus } from '../types/entities'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  refund_requested: 'Chờ hoàn tiền',
  shipped: 'Đã gửi hàng',
  in_transit: 'Đang vận chuyển',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
  returned: 'Đã trả hàng',
}

// ⚠ Phải khớp đúng giá trị thật của `payments.payment_status` trong DB.
// DB hiện có: pending · refunded (completed/failed là giá trị hợp lệ nhưng chưa phát sinh).
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Chờ xử lý',
  completed: 'Đã hoàn tất',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
}

/** Nhãn trạng thái thanh toán an toàn: giá trị lạ → trả nguyên chuỗi gốc (không hiện "undefined"). */
export const paymentStatusLabel = (status: string | null | undefined): string => {
  if (!status) return '—'
  return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status
}

/** 1 mục trong dropdown lọc trạng thái (trùng cấu trúc `FilterOption` của FilterSelect). */
export type StatusOption<T extends string> = { value: T; label: string }

/** Bộ lọc theo trạng thái ĐƠN HÀNG — dùng chung OrdersPage + PaymentsPage. */
export const ORDER_STATUS_FILTERS: StatusOption<'all' | OrderStatus>[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'in_transit', label: 'Đang vận chuyển' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'refund_requested', label: 'Chờ hoàn tiền' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
  { value: 'returned', label: 'Đã trả hàng' },
  { value: 'cancelled', label: 'Đã hủy' },
]

/** Bộ lọc theo trạng thái THANH TOÁN — khớp đúng `payments.payment_status` trong DB. */
export const PAYMENT_STATUS_FILTERS: StatusOption<'all' | PaymentStatus>[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'completed', label: 'Đã hoàn tất' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
]
