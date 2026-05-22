import type { ReportFilters, ReportRecord } from '../types/report.js'
import { fetchReports } from '../repositories/reports.repository.js'

// Nghiệp vụ đọc báo cáo (read-only)

export const getReports = async (filters: ReportFilters): Promise<ReportRecord[]> => {
  return fetchReports(filters)
}


