import type { RequestHandler } from 'express'

const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    message: 'Resource not found',
  })
}

export default notFoundHandler
