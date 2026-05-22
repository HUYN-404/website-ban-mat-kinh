export interface ApiResponse<T> {
  data: T
  message?: string
}

export type ApiListResponse<T> = ApiResponse<T[]>


