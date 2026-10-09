import { getApiClient } from '../api/client'

interface VnPayCreateUrlResponse {
  data: {
    provider: string
    paymentUrl: string
  }
}

/**
 * Yêu cầu backend tạo URL thanh toán VNPay cho một đơn hàng.
 * Sau khi có URL, storefront redirect khách sang cổng VNPay.
 */
export const createVnPayPaymentUrl = async (orderId: number): Promise<string> => {
  const response = await getApiClient().post<VnPayCreateUrlResponse>('/payments/vnpay/create-url', {
    orderId,
  })

  return response.data.data.paymentUrl
}
