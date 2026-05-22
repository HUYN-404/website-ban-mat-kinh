import { Router } from 'express'

import authRouter from './auth.routes.js'
import rolesRouter from './roles.routes.js'
import usersRouter from './users.routes.js'
import categoriesRouter from './categories.routes.js'
import brandsRouter from './brands.routes.js'
import suppliersRouter from './suppliers.routes.js'
import productsRouter from './products.routes.js'
import inventoryRouter from './inventory.routes.js'
import inventoryTransactionsRouter from './inventoryTransactions.routes.js'
import ordersRouter from './orders.routes.js'
import paymentsRouter from './payments.routes.js'
import cartsRouter from './carts.routes.js'
import reportsRouter from './reports.routes.js'
import uploadRouter from './upload.routes.js'

// Router gốc tổng hợp các module con
const router = Router()

router.get('/', (_req, res) => {
  res.json({
    message: 'API root',
  })
})

router.use('/auth', authRouter)
router.use('/roles', rolesRouter)
router.use('/users', usersRouter)
router.use('/categories', categoriesRouter)
router.use('/brands', brandsRouter)
router.use('/suppliers', suppliersRouter)
router.use('/products', productsRouter)
router.use('/inventory', inventoryRouter)
router.use('/inventory-transactions', inventoryTransactionsRouter)
router.use('/orders', ordersRouter)
router.use('/payments', paymentsRouter)
router.use('/carts', cartsRouter)
router.use('/reports', reportsRouter)
router.use('/upload', uploadRouter)

export default router
