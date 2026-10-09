// Tiền từ API là chuỗi (DRF trả Decimal dạng chuỗi) → ép số trước khi format;
// giá trị rỗng/không hợp lệ hiển thị 0 thay vì "NaN ₫".
export const formatCurrency = (value: number | string | null | undefined): string => {
  const amount = Number(value)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}


