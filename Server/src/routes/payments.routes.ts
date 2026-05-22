import { Router } from 'express'

import {
  handleCreatePayment,
  handleGetPayment,
  handleListPayments,
  handleListPaymentsByOrder,
  handleUpdatePayment,
} from '../controllers/payments.controller.js'

// Endpoints thanh toán
const router = Router()

router.get('/', handleListPayments)
router.get('/:paymentId', handleGetPayment)
router.get('/order/:orderId', handleListPaymentsByOrder)
router.post('/', handleCreatePayment)
router.put('/:paymentId', handleUpdatePayment)

export default router


