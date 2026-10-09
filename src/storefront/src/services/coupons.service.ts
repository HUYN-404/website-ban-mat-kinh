import { getApiClient } from '../api/client'

export interface CouponValidation {
  code: string
  discountType: string  // "percent" | "fixed"
  discountValue: number
  message: string
}

interface CouponResponse {
  data: CouponValidation
}

// Kiểm tra mã giảm giá
export const validateCoupon = async (code: string): Promise<CouponValidation> => {
  const response = await getApiClient().post<CouponResponse>('/coupons/validate', { code })
  return response.data.data
}
