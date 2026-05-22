import cors from 'cors'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

import errorHandler from './middlewares/errorHandler.js'
import notFoundHandler from './middlewares/notFoundHandler.js'
import apiRouter from './routes/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files từ thư mục PRJ/uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')))

// Serve static files từ thư mục product_img (ảnh sản phẩm)
app.use('/product_img', express.static(path.resolve(__dirname, '../../../product_img')))

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api', apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
