import { getApiClient } from '../api/client'

// Gửi yêu cầu đặt lại mật khẩu — backend tự tra email và gửi link về hộp thư của khách
export const requestPasswordReset = async (email: string): Promise<string> => {
  const response = await getApiClient().post<{ data: { message: string } }>('/auth/forgot-password', { email })
  return response.data.data.message
}

// Đặt lại mật khẩu bằng token lấy từ link trong email
export const resetPassword = async (token: string, newPassword: string): Promise<string> => {
  const response = await getApiClient().post<{ data: { message: string } }>('/auth/reset-password', {
    token,
    newPassword,
  })
  return response.data.data.message
}
