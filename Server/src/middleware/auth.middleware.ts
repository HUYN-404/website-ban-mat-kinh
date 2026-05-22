import type { Request, Response, NextFunction } from 'express'

import { verifyToken } from '../services/auth.service.js'
import type { TokenPayload } from '../types/auth.js'

// Middleware để verify JWT token

// Extend Request type để có user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token không được cung cấp.' })
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    const payload = verifyToken(token)

    // Gắn thông tin user vào request
    req.user = payload

    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' })
  }
}














