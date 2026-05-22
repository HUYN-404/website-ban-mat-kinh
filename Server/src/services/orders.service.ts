import HttpError from '../utils/httpError.js'
import type {
  AddOrderItemPayload,
  CreateOrderItemPayload,
  CreateOrderPayload,
  Order,
  OrderItem,
  OrderStatus,
  UpdateOrderItemPayload,
} from '../types/order.js'
import {
  createOrderItem,
  createOrderWithItems,
  deleteOrderItemRecord,
  findAllOrders,
  findOrderById,
  findOrderItemById,
  findOrderItems,
  recalculateOrderTotal,
  updateOrderItemRecord,
  updateOrderPaymentId,
  updateOrderStatus,
} from '../repositories/orders.repository.js'
import { findUserById } from '../repositories/users.repository.js'
import { findProductById } from '../repositories/products.repository.js'
import { getInventory } from './inventory.service.js'
import { recordInventoryTransaction } from './inventoryTransactions.service.js'

// Nghiệp vụ đơn hàng

export const ensureOrderExists = async (orderId: number): Promise<Order> => {
  const order = await findOrderById(orderId)
  if (!order) {
    throw new HttpError(404, 'Đơn hàng không tồn tại.')
  }
  return order
}

const fetchOrderItems = async (orderId: number): Promise<OrderItem[]> => {
  return findOrderItems(orderId)
}

const ensureOrderPending = async (orderId: number): Promise<Order> => {
  const order = await ensureOrderExists(orderId)
  if (order.status !== 'pending') {
    throw new HttpError(400, 'Chỉ có thể thao tác sản phẩm khi đơn hàng đang ở trạng thái pending.')
  }
  return order
}

interface ListOrdersOptions {
  userId?: number
  status?: OrderStatus
  from?: string
  to?: string
}

export const listOrders = async (options: ListOrdersOptions): Promise<(Order & { items?: OrderItem[] })[]> => {
  const orders = await findAllOrders(options)
  // Fetch items count cho mỗi order để hiển thị
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const items = await fetchOrderItems(order.id)
      return { ...order, items }
    }),
  )
  return ordersWithItems
}

export const getOrder = async (orderId: number): Promise<Order & { items: OrderItem[] }> => {
  const order = await ensureOrderExists(orderId)
  const items = await fetchOrderItems(orderId)
  return { ...order, items }
}

const validateOrderItemsAgainstInventory = async (
  userId: number,
  items: CreateOrderItemPayload[],
) => {
  const enriched: Array<CreateOrderItemPayload & { unitPrice: number }> = []

  for (const item of items) {
    const product = await findProductById(item.productId)
    if (!product) {
      throw new HttpError(400, `Sản phẩm ${item.productId} không tồn tại.`)
    }
    if (product.status !== 'available') {
      throw new HttpError(400, `Sản phẩm ${product.name} hiện không khả dụng.`)
    }

    const inventory = await getInventory(item.productId)
    if (inventory.totalQuantity < item.quantity) {
      throw new HttpError(
        400,
        `Sản phẩm ${product.name} chỉ còn ${inventory.totalQuantity} trong kho.`,
      )
    }

    enriched.push({
      ...item,
      unitPrice: Number(product.price),
    })
  }

  if (!enriched.length) {
    throw new HttpError(400, 'Đơn hàng phải có ít nhất một sản phẩm.')
  }

  return enriched
}

/**
 * Tạo đơn hàng mới
 * 
 * Logic trạng thái đơn hàng:
 * - Khi tạo: Order status = 'pending' (chờ xử lý)
 * - Sau khi tạo payment:
 *   + Thanh toán khi nhận hàng (cash): Payment status = 'pending', Order status = 'pending' (chờ thanh toán khi giao hàng)
 *   + Thanh toán ngân hàng/thẻ (bank_transfer, credit_card): Payment status = 'pending', Order status = 'pending' (chờ xác nhận thanh toán)
 * - Khi admin xác nhận thanh toán: Payment status = 'completed' → Order status tự động chuyển sang 'paid' (đã thanh toán)
 * - Khi admin ship hàng: Order status = 'shipped' (đang giao hàng)
 * - Khi giao hàng thành công: Order status = 'completed' (hoàn thành)
 * - Khi hủy đơn: Order status = 'cancelled' (đã hủy) → tự động trả hàng lại kho
 */
export const createOrder = async (payload: CreateOrderPayload): Promise<Order & { items: OrderItem[] }> => {
  const user = await findUserById(payload.userId)
  if (!user) {
    throw new HttpError(400, 'userId không tồn tại.')
  }

  const items = await validateOrderItemsAgainstInventory(payload.userId, payload.items)

  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  // Ghi nhận giao dịch xuất kho trước
  try {
    for (const item of items) {
      await recordInventoryTransaction({
        productId: item.productId,
        userId: payload.userId,
        transactionType: 'export',
        quantity: item.quantity,
        note: 'Xuất kho khi tạo đơn hàng',
      })
    }
  } catch (error) {
    throw error
  }

  let orderId: number | null = null
  try {
    orderId = await createOrderWithItems({
      userId: payload.userId,
      status: 'pending',
      totalAmount,
      note: payload.note ?? null,
      items,
    })
  } catch (error) {
    // Rollback inventory đã trừ
    for (const item of items) {
      await recordInventoryTransaction({
        productId: item.productId,
        userId: payload.userId,
        transactionType: 'import',
        quantity: item.quantity,
        note: 'Hoàn kho do tạo đơn hàng thất bại',
      })
    }
    throw error
  }

  if (!orderId) {
    throw new HttpError(500, 'Không thể tạo đơn hàng.')
  }

  return getOrder(orderId)
}

export const changeOrderStatus = async (
  orderId: number,
  status: OrderStatus,
): Promise<Order & { items: OrderItem[] }> => {
  const order = await ensureOrderExists(orderId)

  if (order.status === status) {
    return getOrder(orderId)
  }

  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled'],
    shipped: ['completed'],
    completed: [],
    cancelled: [],
  }

  if (!validTransitions[order.status].includes(status)) {
    throw new HttpError(400, `Không thể chuyển trạng thái từ ${order.status} sang ${status}.`)
  }

  const items = await fetchOrderItems(orderId)

  if (status === 'cancelled') {
    // Trả hàng lại kho
    for (const item of items) {
      await recordInventoryTransaction({
        productId: item.productId,
        userId: order.userId,
        transactionType: 'import',
        quantity: item.quantity,
        note: `Hoàn kho do hủy đơn #${orderId}`,
      })
    }
  }

  const updated = await updateOrderStatus(orderId, status)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật trạng thái đơn hàng.')
  }

  return getOrder(orderId)
}

export const attachPaymentToOrder = async (
  orderId: number,
  paymentId: number | null,
): Promise<Order & { items: OrderItem[] }> => {
  await ensureOrderExists(orderId)

  const updated = await updateOrderPaymentId(orderId, paymentId)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật thông tin thanh toán.')
  }

  if (paymentId) {
    // Nếu có payment, chuyển trạng thái sang paid (nếu đang pending)
    const order = await ensureOrderExists(orderId)
    if (order.status === 'pending') {
      await updateOrderStatus(orderId, 'paid')
    }
  }

  return getOrder(orderId)
}

export const listOrderItems = async (orderId: number): Promise<OrderItem[]> => {
  await ensureOrderExists(orderId)
  return fetchOrderItems(orderId)
}

export const addOrderItem = async (
  orderId: number,
  payload: AddOrderItemPayload,
): Promise<Order & { items: OrderItem[] }> => {
  const order = await ensureOrderPending(orderId)

  const product = await findProductById(payload.productId)
  if (!product) {
    throw new HttpError(400, 'productId không tồn tại.')
  }
  if (product.status !== 'available') {
    throw new HttpError(400, `Sản phẩm ${product.name} hiện không khả dụng.`)
  }

  const inventory = await getInventory(payload.productId)
  if (inventory.totalQuantity < payload.quantity) {
    throw new HttpError(
      400,
      `Sản phẩm ${product.name} chỉ còn ${inventory.totalQuantity} trong kho.`,
    )
  }

  await recordInventoryTransaction({
    productId: payload.productId,
    userId: order.userId,
    transactionType: 'export',
    quantity: payload.quantity,
    note: `Xuất kho bổ sung sản phẩm vào đơn #${orderId}`,
  })

  const unitPrice =
    payload.unitPrice !== undefined ? payload.unitPrice : Number(product.price)

  await createOrderItem(orderId, {
    productId: payload.productId,
    quantity: payload.quantity,
    unitPrice,
  })

  await recalculateOrderTotal(orderId)

  return getOrder(orderId)
}

export const updateOrderItem = async (
  orderId: number,
  orderItemId: number,
  payload: UpdateOrderItemPayload,
): Promise<Order & { items: OrderItem[] }> => {
  const order = await ensureOrderPending(orderId)

  const orderItem = await findOrderItemById(orderItemId)
  if (!orderItem || orderItem.orderId !== orderId) {
    throw new HttpError(404, 'Sản phẩm trong đơn không tồn tại.')
  }

  const newQuantity = payload.quantity ?? orderItem.quantity
  if (newQuantity <= 0) {
    throw new HttpError(400, 'quantity phải lớn hơn 0.')
  }

  const quantityDiff = newQuantity - orderItem.quantity

  if (quantityDiff !== 0) {
    if (quantityDiff > 0) {
      const inventory = await getInventory(orderItem.productId)
      if (inventory.totalQuantity < quantityDiff) {
        throw new HttpError(
          400,
          `Sản phẩm hiện chỉ còn ${inventory.totalQuantity} trong kho.`,
        )
      }
      await recordInventoryTransaction({
        productId: orderItem.productId,
        userId: order.userId,
        transactionType: 'export',
        quantity: quantityDiff,
        note: `Xuất kho do tăng số lượng sản phẩm (đơn #${orderId})`,
      })
    } else {
      await recordInventoryTransaction({
        productId: orderItem.productId,
        userId: order.userId,
        transactionType: 'import',
        quantity: Math.abs(quantityDiff),
        note: `Hoàn kho do giảm số lượng sản phẩm (đơn #${orderId})`,
      })
    }
  }

  const updatePayload: { quantity?: number; unitPrice?: number } = {}
  if (payload.quantity !== undefined) {
    updatePayload.quantity = payload.quantity
  }
  if (payload.unitPrice !== undefined) {
    updatePayload.unitPrice = payload.unitPrice
  }

  const updated = await updateOrderItemRecord(orderItemId, updatePayload)
  if (!updated) {
    throw new HttpError(500, 'Không thể cập nhật sản phẩm trong đơn.')
  }

  await recalculateOrderTotal(orderId)

  return getOrder(orderId)
}

export const removeOrderItem = async (
  orderId: number,
  orderItemId: number,
): Promise<Order & { items: OrderItem[] }> => {
  const order = await ensureOrderPending(orderId)

  const orderItem = await findOrderItemById(orderItemId)
  if (!orderItem || orderItem.orderId !== orderId) {
    throw new HttpError(404, 'Sản phẩm trong đơn không tồn tại.')
  }

  await recordInventoryTransaction({
    productId: orderItem.productId,
    userId: order.userId,
    transactionType: 'import',
    quantity: orderItem.quantity,
    note: `Hoàn kho do xóa sản phẩm khỏi đơn #${orderId}`,
  })

  const deleted = await deleteOrderItemRecord(orderItemId)
  if (!deleted) {
    throw new HttpError(500, 'Không thể xóa sản phẩm trong đơn.')
  }

  await recalculateOrderTotal(orderId)

  return getOrder(orderId)
}

