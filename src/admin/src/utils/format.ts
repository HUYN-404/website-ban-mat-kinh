// Format tiền theo chuẩn Việt Nam — dùng chung toàn admin (tránh lặp định nghĩa).
// Tiền từ API là CHUỖI (DRF trả Decimal dạng chuỗi) → ép số; giá trị rỗng/hỏng hiển thị 0 thay vì "NaN".
export const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value)
  return `${(Number.isFinite(amount) ? amount : 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫`
}

// Cộng tiền: trong JS `sum + "5000.00"` là NỐI CHUỖI ("05000.009200000.00" → NaN khi format),
// nên bắt buộc Number() từng phần tử trước khi cộng.
export const sumMoney = (values: Array<number | string | null | undefined>): number =>
  values.reduce<number>((sum, value) => {
    const amount = Number(value)
    return sum + (Number.isFinite(amount) ? amount : 0)
  }, 0)

// Ngày + giờ cho bảng: rỗng/không hợp lệ → '—' (tránh "Invalid Date" và "1/1/1970")
export const formatDateTime = (value: string | number | Date | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}
