import type { Request, Response } from 'express'
import HttpError from '../utils/httpError.js'

export const handleUploadImage = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new HttpError(400, 'Không có file được upload.')
  }

  // Trả về đường dẫn để lưu vào database
  const imageUrl = `/uploads/${req.file.filename}`

  res.json({
    data: {
      imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    },
    message: 'Upload ảnh thành công.',
  })
}


