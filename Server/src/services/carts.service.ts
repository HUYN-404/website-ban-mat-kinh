import HttpError from '../utils/httpError.js'
import type { Cart, UpdateCartStatusPayload } from '../types/cart.js'
import {
  createCart as createCartRepository,
  findActiveCartByUserId,
  findCartById,
  findCartsByUserId,
  updateCartStatus,
} from '../repositories/carts.repository.js'
import { findUserById } from '../repositories/users.repository.js'

// Nghiệp vụ giỏ hàng

const ensureCartExists = async (cartId: number): Promise<Cart> => {
  const cart = await findCartById(cartId)
  if (!cart) {
    throw new HttpError(404, 'Giỏ hàng không tồn tại.')
  }
  return cart
}

export const getCartById = async (cartId: number): Promise<Cart> => {
  return ensureCartExists(cartId)
}

export const getActiveCartByUserId = async (userId: number): Promise<Cart> => {
  await findUserById(userId).catch(() => {
    throw new HttpError(400, 'userId không tồn tại.')
  })

  const activeCart = await findActiveCartByUserId(userId)
  if (activeCart) {
    return activeCart
  }
  return createCartRepository(userId)
}

export const listCartsByUser = async (userId: number): Promise<Cart[]> => {
  await findUserById(userId).catch(() => {
    throw new HttpError(400, 'userId không tồn tại.')
  })

  return findCartsByUserId(userId)
}

export const createCartForUser = async (userId: number): Promise<Cart> => {
  await findUserById(userId).catch(() => {
    throw new HttpError(400, 'userId không tồn tại.')
  })

  const existingActive = await findActiveCartByUserId(userId)
  if (existingActive) {
    throw new HttpError(409, 'Người dùng đã có giỏ hàng hoạt động.')
  }

  return createCartRepository(userId)
}

export const changeCartStatus = async (
  cartId: number,
  payload: UpdateCartStatusPayload,
): Promise<Cart> => {
  const cart = await ensureCartExists(cartId)

  if (cart.status === payload.status) {
    return cart
  }

  const updated = await updateCartStatus(cartId, payload.status)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật trạng thái giỏ hàng.')
  }

  return ensureCartExists(cartId)
}


