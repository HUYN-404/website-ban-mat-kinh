import { Router } from 'express'
import { handleUploadImage } from '../controllers/upload.controller.js'
import { uploadSingle } from '../middlewares/upload.middleware.js'

const router = Router()

// POST /api/upload
router.post('/', uploadSingle, handleUploadImage)

export default router










