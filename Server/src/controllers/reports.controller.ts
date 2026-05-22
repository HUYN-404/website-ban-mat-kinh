import type { Request, Response } from 'express'

import { getReports } from '../services/reports.service.js'

// Controller cho báo cáo

const parseReportFilters = (query: Record<string, unknown>) => {
  const filters: {
    from?: string
    to?: string
    paymentStatus?: string
  } = {}

  if (typeof query.from === 'string') {
    filters.from = query.from
  }
  if (typeof query.to === 'string') {
    filters.to = query.to
  }
  if (typeof query.paymentStatus === 'string') {
    filters.paymentStatus = query.paymentStatus
  }

  return filters
}

export const handleGetReports = async (req: Request, res: Response) => {
  const filters = parseReportFilters(req.query)
  const reports = await getReports(filters)
  res.json({ data: reports })
}


