// 공통 타입 정의

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 사용자 역할
export type UserRole = 'admin' | 'vendor' | 'user'

// 예약 상태
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

// 결제 상태
export type PaymentStatus = 'pending' | 'completed' | 'refunded'

// 사업주 상태
export type VendorStatus = 'active' | 'inactive'
