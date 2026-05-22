import HttpError from '../utils/httpError.js'

export const validateOrderItemId = (value: unknown): number => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'orderItemId không hợp lệ.')
  }
  return id
}


