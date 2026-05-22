import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cấu hình lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Lưu vào thư mục PRJ/uploads
    const uploadPath = path.resolve(__dirname, '../../../uploads')
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Tạo tên file: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    const filename = `${name}-${uniqueSuffix}${ext}`
    cb(null, filename)
  },
})

// Lọc file chỉ cho phép ảnh
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|avif/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  // Kiểm tra mimetype: hỗ trợ cả image/avif và các định dạng khác
  const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp|avif)$/
  const mimetype = allowedMimeTypes.test(file.mimetype.toLowerCase())

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp, avif)'))
  }
}

// Cấu hình multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

// Middleware upload single file
export const uploadSingle = upload.single('image')


