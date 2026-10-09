// Tiện ích ngày cho bộ lọc — dùng chung OrdersPage + PaymentsPage.

/** Ngày cho `input[type=date]` theo GIỜ ĐỊA PHƯƠNG.
 *  Không dùng `toISOString()` vì nó đổi sang UTC → lệch 1 ngày với người dùng VN (UTC+7).
 */
export const isoDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** Khoảng `days` ngày gần nhất tính đến hôm nay (bao gồm cả hôm nay). */
export const lastNDays = (days: number): { from: string; to: string } => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - (days - 1))
  return { from: isoDay(start), to: isoDay(today) }
}
