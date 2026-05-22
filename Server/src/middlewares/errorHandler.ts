import type { ErrorRequestHandler } from 'express'

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  console.error('=== ERROR HANDLER ===')
  console.error('URL:', req.method, req.url)
  console.error('Error:', error)
  console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace')
  console.error('====================')

  const status = typeof (error as { status?: number }).status === 'number' ? (error as { status: number }).status : 500
  const message = error instanceof Error ? error.message : 'Internal server error'

  res.status(status).json({
    message: status === 500 ? 'Internal server error' : message,
    ...(process.env.NODE_ENV === 'development' && {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }),
  })
}

export default errorHandler
