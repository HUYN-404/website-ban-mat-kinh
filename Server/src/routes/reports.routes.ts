import { Router } from 'express'

import { handleGetReports } from '../controllers/reports.controller.js'

// Endpoint read-only cho báo cáo
const router = Router()

router.get('/', handleGetReports)

export default router


