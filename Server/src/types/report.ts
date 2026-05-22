// Dữ liệu view báo cáo
export interface ReportRecord {
  orderId: number
  customerName: string
  orderDate: string
  totalOrderValue: number
  totalItems: number
  paymentStatus: string | null
}

// Bộ lọc cho báo cáo
export interface ReportFilters {
  from?: string
  to?: string
  paymentStatus?: string
}


