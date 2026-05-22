import HttpError from '../utils/httpError.js'
import type { LoginPayload, RegisterPayload } from '../types/auth.js'

// Validate payload đăng nhập
export const validateLoginPayload = (body: unknown): LoginPayload => {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Payload không hợp lệ.')
  }

  const payload = body as Record<string, unknown>

  if (!payload.username || typeof payload.username !== 'string' || !payload.username.trim()) {
    throw new HttpError(400, 'username là bắt buộc và phải là chuỗi không rỗng.')
  }

  if (!payload.password || typeof payload.password !== 'string' || !payload.password.trim()) {
    throw new HttpError(400, 'password là bắt buộc và phải là chuỗi không rỗng.')
  }

  return {
    username: payload.username.trim(),
    password: payload.password,
  }
}

// Validate payload đăng ký
export const validateRegisterPayload = (body: unknown): RegisterPayload => {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Payload không hợp lệ.')
  }

  const payload = body as Record<string, unknown>

  if (!payload.username || typeof payload.username !== 'string' || !payload.username.trim()) {
    throw new HttpError(400, 'username là bắt buộc và phải là chuỗi không rỗng.')
  }

  if (!payload.password || typeof payload.password !== 'string' || !payload.password.trim()) {
    throw new HttpError(400, 'password là bắt buộc và phải là chuỗi không rỗng.')
  }

  if (payload.password.length < 6) {
    throw new HttpError(400, 'password phải có tối thiểu 6 ký tự.')
  }

  if (!payload.email || typeof payload.email !== 'string' || !payload.email.trim()) {
    throw new HttpError(400, 'email là bắt buộc và phải là chuỗi không rỗng.')
  }

  const email = payload.email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new HttpError(400, 'email không hợp lệ.')
  }

  const fullName =
    typeof payload.fullName === 'string' && payload.fullName.trim()
      ? payload.fullName.trim()
      : undefined

  return {
    username: payload.username.trim(),
    password: payload.password,
    email,
    fullName,
  }
}














