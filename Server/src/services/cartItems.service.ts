import HttpError from '../utils/httpError.js'
import type { AddCartItemPayload, CartItem, UpdateCartItemPayload } from '../types/cartItem.js'
import { findCartById } from '../repositories/carts.repository.js'
import { findProductById } from '../repositories/products.repository.js'
import {
  createCartItem,
  deleteCartItem,
  findCartItemByCartAndProduct,
  findCartItemById,
  findCartItems,
  updateCartItemQuantity,
} from '../repositories/cartItems.repository.js'
import { getInventory } from './inventory.service.js'

// Nghiệp vụ item trong giỏ hàng

const ensureCartExists = async (cartId: number) => {
  const cart = await findCartById(cartId)
  if (!cart) {
    throw new HttpError(404, 'Giỏ hàng không tồn tại.')
  }
  if (cart.status !== 'active') {
    throw new HttpError(400, 'Không thể thao tác trên giỏ hàng không hoạt động.')
  }
  return cart
}

const ensureProductAvailable = async (productId: number) => {
  const product = await findProductById(productId)
  if (!product) {
    throw new HttpError(400, 'Sản phẩm không tồn tại.')
  }
  if (product.status !== 'available') {
    throw new HttpError(400, `Sản phẩm ${product.name} hiện không khả dụng.`)
  }
  return product
}

export const listCartItems = async (cartId: number): Promise<CartItem[]> => {
  await ensureCartExists(cartId)
  return findCartItems(cartId)
}

export const addCartItem = async (payload: AddCartItemPayload): Promise<CartItem[]> => {
  const cart = await ensureCartExists(payload.cartId)
  const product = await ensureProductAvailable(payload.productId)

  const inventory = await getInventory(product.id)
  const quantityToAdd = payload.quantity ?? 1

  const existingItem = await findCartItemByCartAndProduct(cart.id, product.id)
  const desiredQuantity = (existingItem?.quantity ?? 0) + quantityToAdd

  if (inventory.totalQuantity < desiredQuantity) {
    throw new HttpError(
      400,
      `Sản phẩm ${product.name} chỉ còn ${inventory.totalQuantity} trong kho.`,
    )
  }

  if (existingItem) {
    await updateCartItemQuantity(existingItem.id, desiredQuantity)
  } else {
    await createCartItem(cart.id, product.id, quantityToAdd, Number(product.price))
  }

  return listCartItems(cart.id)
}

export const updateCartItem = async (
  cartId: number,
  cartItemId: number,
  payload: UpdateCartItemPayload,
): Promise<CartItem[]> => {
  await ensureCartExists(cartId)

  const cartItem = await findCartItemById(cartItemId)
  if (!cartItem || cartItem.cartId !== cartId) {
    throw new HttpError(404, 'Sản phẩm trong giỏ không tồn tại.')
  }

  const product = await ensureProductAvailable(cartItem.productId)

  const inventory = await getInventory(product.id)
  if (inventory.totalQuantity < payload.quantity) {
    throw new HttpError(
      400,
      `Sản phẩm ${product.name} chỉ còn ${inventory.totalQuantity} trong kho.`,
    )
  }

  const updated = await updateCartItemQuantity(cartItemId, payload.quantity)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật sản phẩm trong giỏ.')
  }

  return listCartItems(cartId)
}

export const removeCartItem = async (cartId: number, cartItemId: number): Promise<CartItem[]> => {
  await ensureCartExists(cartId)

  const cartItem = await findCartItemById(cartItemId)
  if (!cartItem || cartItem.cartId !== cartId) {
    throw new HttpError(404, 'Sản phẩm trong giỏ không tồn tại.')
  }

  const deleted = await deleteCartItem(cartItemId)
  if (!deleted) {
    throw new HttpError(500, 'Không thể xóa sản phẩm trong giỏ.')
  }

  return listCartItems(cartId)
}


