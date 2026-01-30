// 공통 타입 정의

// 관리자 타입
export interface Admin {
  id: string
  loginId: string
  name: string
  role: 'super_admin' | 'admin'
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export interface AdminSession {
  access_token: string
  refresh_token: string
  expires_at: string
}

export interface LoginResponse {
  admin: Admin
  session: AdminSession
}

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

// 사업주 타입
export interface BusinessOwner {
  id: string
  email: string
  name: string
  business_number: string
  representative: string
  contact_name: string
  contact_phone: string
  address: string
  address_detail: string | null
  zipcode: string | null
  latitude: number | null
  longitude: number | null
  bank_name: string | null
  bank_account: string | null
  bank_holder: string | null
  logo_url: string | null
  commission_rate: number
  status: VendorStatus
  created_at: string
  updated_at: string
}

// 사업주 생성 입력
export interface BusinessOwnerCreateInput {
  email: string
  name: string
  business_number: string
  representative: string
  contact_name: string
  contact_phone: string
  address: string
  address_detail?: string
  zipcode?: string
  bank_name?: string
  bank_account?: string
  bank_holder?: string
  logo_url?: string
  commission_rate?: number
}

// 사업주 수정 입력
export interface BusinessOwnerUpdateInput {
  name?: string
  representative?: string
  contact_name?: string
  contact_phone?: string
  address?: string
  address_detail?: string
  zipcode?: string
  bank_name?: string
  bank_account?: string
  bank_holder?: string
  logo_url?: string
  status?: VendorStatus
}

// 정산 상태
export type SettlementStatus = 'pending' | 'completed'

// 정산 내역
export interface Settlement {
  id: string
  business_owner_id: string
  settlement_period_start: string
  settlement_period_end: string
  total_sales: number
  commission_amount: number
  commission_rate: number
  refund_amount: number
  settlement_amount: number
  status: SettlementStatus
  settled_at: string | null
  created_at: string
}

// 수수료 변경 이력
export interface CommissionHistory {
  id: string
  business_owner_id: string
  previous_rate: number
  new_rate: number
  effective_date: string
  changed_by: string | null
  reason: string | null
  created_at: string
  admin?: {
    name: string
  }
}

// 사업주 검색 필터
export interface VendorFilter {
  status?: VendorStatus | 'all'
  search?: string
}

// 어린이집(회원) 상태
export type DaycareStatus = 'pending' | 'requested' | 'approved' | 'rejected'

// 어린이집(회원) 타입
export interface Daycare {
  id: string
  email: string
  name: string
  representative: string | null
  contact_name: string
  contact_phone: string
  business_number: string | null
  license_number: string
  license_file: string
  address: string
  address_detail: string | null
  zipcode: string | null
  tel: string | null
  capacity: number | null
  status: DaycareStatus
  rejection_reason: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

// 어린이집 메모 타입
export interface DaycareMemo {
  id: string
  daycare_id: string
  admin_id: string
  content: string
  created_at: string
  admin?: {
    name: string
  }
}

// 어린이집 검색 필터
export interface DaycareFilter {
  status?: DaycareStatus | 'all'
  search?: string
}

// 어린이집 생성 입력
export interface DaycareCreateInput {
  email: string
  name: string
  representative?: string
  contact_name: string
  contact_phone: string
  business_number?: string
  license_number: string
  license_file?: string
  address: string
  address_detail?: string
  zipcode?: string
  tel?: string
  capacity?: number
}

// 어린이집 수정 입력
export interface DaycareUpdateInput {
  name?: string
  representative?: string
  contact_name?: string
  contact_phone?: string
  business_number?: string
  license_number?: string
  license_file?: string
  address?: string
  address_detail?: string
  zipcode?: string
  tel?: string
  capacity?: number
}

// 카테고리 타입
export interface Category {
  id: string
  parent_id: string | null
  name: string
  depth: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  children?: Category[]
}

// 카테고리 생성 입력
export interface CategoryCreateInput {
  name: string
  parent_id?: string | null
  depth: number
  sort_order?: number
  is_active?: boolean
}

// 카테고리 수정 입력
export interface CategoryUpdateInput {
  name?: string
  parent_id?: string | null
  sort_order?: number
  is_active?: boolean
}

// 카테고리 검색 필터
export interface CategoryFilter {
  depth?: number
  parentId?: string
  status?: 'active' | 'inactive' | 'all'
  search?: string
}

// 상품 타입
export interface Product {
  id: string
  business_owner_id: string
  category_id: string | null
  name: string
  summary: string | null
  description: string | null
  thumbnail: string
  original_price: number
  sale_price: number
  min_participants: number
  max_participants: number
  duration_minutes: number | null
  address: string | null
  address_detail: string | null
  latitude: number | null
  longitude: number | null
  region: string | null
  available_time_slots: TimeSlot[] | null
  is_visible: boolean
  is_sold_out: boolean
  view_count: number
  created_at: string
  updated_at: string
  // 조인 데이터 (일부 필드만 조회)
  business_owner?: Pick<BusinessOwner, 'id' | 'name' | 'email' | 'contact_phone'>
  category?: Pick<Category, 'id' | 'name' | 'parent_id'>
  options?: ProductOption[]
  images?: ProductImage[]
}

// 시간대 타입
export interface TimeSlot {
  day: number // 0=일, 1=월, ..., 6=토
  start: string // "09:00"
  end: string // "18:00"
}

// 상품 옵션 타입
export interface ProductOption {
  id: string
  product_id: string
  name: string
  price: number
  is_required: boolean
  sort_order: number
  created_at: string
}

// 상품 이미지 타입
export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  sort_order: number
  created_at: string
}

// 상품 예약 불가일 타입
export interface ProductUnavailableDate {
  id: string
  product_id: string
  unavailable_date: string
  reason: string | null
  is_recurring: boolean
  day_of_week: number | null
  created_at: string
}

// 상품 생성 입력
export interface ProductCreateInput {
  business_owner_id: string
  category_id?: string
  name: string
  summary?: string
  description?: string
  thumbnail: string
  original_price: number
  sale_price: number
  min_participants?: number
  max_participants: number
  duration_minutes?: number
  address?: string
  address_detail?: string
  region?: string
  available_time_slots?: TimeSlot[]
  is_visible?: boolean
  options?: Omit<ProductOption, 'id' | 'product_id' | 'created_at'>[]
  images?: string[]
}

// 상품 수정 입력
export interface ProductUpdateInput {
  category_id?: string | null
  name?: string
  summary?: string | null
  description?: string | null
  thumbnail?: string
  original_price?: number
  sale_price?: number
  min_participants?: number
  max_participants?: number
  duration_minutes?: number | null
  address?: string | null
  address_detail?: string | null
  region?: string | null
  available_time_slots?: TimeSlot[] | null
  is_visible?: boolean
  is_sold_out?: boolean
  options?: Omit<ProductOption, 'product_id' | 'created_at'>[]
  images?: string[]
}

// 상품 검색 필터
export interface ProductFilter {
  status?: 'all' | 'visible' | 'hidden' | 'sold_out'
  business_owner_id?: string
  category_id?: string
  search?: string
}

// 리뷰 타입
export interface Review {
  id: string
  daycare_id: string
  product_id: string
  reservation_id: string
  rating: number
  content: string
  is_visible: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  // 조인 데이터
  daycare?: Daycare
  product?: Product
  images?: ReviewImage[]
}

// 리뷰 이미지 타입
export interface ReviewImage {
  id: string
  review_id: string
  image_url: string
  sort_order: number
  created_at: string
}

// 리뷰 검색 필터
export interface ReviewFilter {
  status?: 'all' | 'visible' | 'hidden'
  featured?: 'all' | 'featured' | 'normal'
  rating?: number | 'all'
  search?: string
}

// 예약 상태 타입 (DB 스키마 기준)
export type ReservationStatusType = 'pending' | 'paid' | 'confirmed' | 'completed' | 'cancelled' | 'refunded'

// 예약 타입
export interface Reservation {
  id: string
  reservation_number: string
  daycare_id: string
  product_id: string
  business_owner_id: string
  reserved_date: string
  reserved_time: string | null
  participant_count: number
  total_amount: number
  status: ReservationStatusType
  memo: string | null
  cancel_reason: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  // 조인 데이터
  daycare?: Daycare
  product?: Product
  business_owner?: BusinessOwner
  options?: ReservationOption[]
  payment?: Payment
}

// 예약 옵션 타입
export interface ReservationOption {
  id: string
  reservation_id: string
  product_option_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
  // 조인 데이터
  product_option?: ProductOption
}

// 결제 상태 타입
export type PaymentStatusType = 'pending' | 'paid' | 'failed' | 'cancelled'

// 결제 타입
export interface Payment {
  id: string
  reservation_id: string
  pg_provider: string
  pg_tid: string | null
  payment_method: string
  amount: number
  status: PaymentStatusType
  paid_at: string | null
  receipt_url: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// 환불 상태 타입
export type RefundStatusType = 'pending' | 'completed' | 'failed'

// 환불 타입
export interface Refund {
  id: string
  payment_id: string
  reservation_id: string
  original_amount: number
  refund_amount: number
  reason: string | null
  admin_memo: string | null
  status: RefundStatusType
  refunded_at: string | null
  processed_by: string | null
  created_at: string
  // 조인 데이터
  admin?: {
    name: string
  }
}

// 예약 검색 필터
export interface ReservationFilter {
  status?: ReservationStatusType | 'all'
  business_owner_id?: string
  daycare_id?: string
  product_id?: string
  search?: string
  date_from?: string
  date_to?: string
}

// 공지사항 타입
export interface Notice {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_visible: boolean
  view_count: number
  created_by: string | null
  created_at: string
  updated_at: string
  admin?: {
    name: string
  }
}

// 공지사항 생성 입력
export interface NoticeCreateInput {
  title: string
  content: string
  is_pinned?: boolean
  is_visible?: boolean
}

// 공지사항 수정 입력
export interface NoticeUpdateInput {
  title?: string
  content?: string
  is_pinned?: boolean
  is_visible?: boolean
}

// 공지사항 검색 필터
export interface NoticeFilter {
  status?: 'all' | 'visible' | 'hidden'
  pinned?: 'all' | 'pinned' | 'normal'
  search?: string
}

// FAQ 타입
export interface FAQ {
  id: string
  category: string
  question: string
  answer: string
  sort_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

// FAQ 생성 입력
export interface FAQCreateInput {
  category: string
  question: string
  answer: string
  sort_order?: number
  is_visible?: boolean
}

// FAQ 수정 입력
export interface FAQUpdateInput {
  category?: string
  question?: string
  answer?: string
  sort_order?: number
  is_visible?: boolean
}

// FAQ 검색 필터
export interface FAQFilter {
  category?: string | 'all'
  status?: 'all' | 'visible' | 'hidden'
  search?: string
}

// 배너 타입
export type BannerType = 'main' | 'sub'

export interface Banner {
  id: string
  type: BannerType
  title: string | null
  image_url: string
  link_url: string | null
  sort_order: number
  start_date: string | null
  end_date: string | null
  is_visible: boolean
  created_at: string
  updated_at: string
}

// 배너 생성 입력
export interface BannerCreateInput {
  type: BannerType
  title?: string
  image_url: string
  link_url?: string
  sort_order?: number
  start_date?: string
  end_date?: string
  is_visible?: boolean
}

// 배너 수정 입력
export interface BannerUpdateInput {
  type?: BannerType
  title?: string
  image_url?: string
  link_url?: string
  sort_order?: number
  start_date?: string | null
  end_date?: string | null
  is_visible?: boolean
}

// 배너 검색 필터
export interface BannerFilter {
  type?: BannerType | 'all'
  status?: 'all' | 'visible' | 'hidden'
}

// 팝업 위치 타입
export type PopupPosition = 'center' | 'bottom'

// 팝업 타입
export interface Popup {
  id: string
  title: string
  content: string | null
  image_url: string | null
  link_url: string | null
  position: PopupPosition
  width: number | null
  height: number | null
  start_date: string
  end_date: string
  is_visible: boolean
  created_at: string
  updated_at: string
}

// 팝업 생성 입력
export interface PopupCreateInput {
  title: string
  content?: string
  image_url?: string
  link_url?: string
  position?: PopupPosition
  width?: number
  height?: number
  start_date: string
  end_date: string
  is_visible?: boolean
}

// 팝업 수정 입력
export interface PopupUpdateInput {
  title?: string
  content?: string | null
  image_url?: string | null
  link_url?: string | null
  position?: PopupPosition
  width?: number | null
  height?: number | null
  start_date?: string
  end_date?: string
  is_visible?: boolean
}

// 팝업 검색 필터
export interface PopupFilter {
  position?: PopupPosition | 'all'
  status?: 'all' | 'visible' | 'hidden' | 'active' | 'scheduled' | 'expired'
}

// 1:1 문의 상태 타입
export type InquiryStatus = 'pending' | 'answered'

// 1:1 문의 타입
export interface Inquiry {
  id: string
  daycare_id: string
  category: string
  title: string
  content: string
  status: InquiryStatus
  answer: string | null
  answered_by: string | null
  answered_at: string | null
  created_at: string
  daycare?: Daycare
  admin?: {
    name: string
  }
}

// 1:1 문의 답변 입력
export interface InquiryAnswerInput {
  answer: string
}

// 1:1 문의 검색 필터
export interface InquiryFilter {
  status?: InquiryStatus | 'all'
  category?: string | 'all'
  search?: string
}

// 사이트 설정 타입
export interface SiteSetting {
  key: string
  value: unknown
  description: string | null
  updated_by: string | null
  updated_at: string
}

// 관리자 활동 로그 타입
export type AdminLogAction = 'create' | 'update' | 'delete' | 'status_change' | 'login' | 'logout'
export type AdminLogTargetType =
  | 'business_owner'
  | 'daycare'
  | 'product'
  | 'category'
  | 'reservation'
  | 'review'
  | 'notice'
  | 'faq'
  | 'banner'
  | 'popup'
  | 'inquiry'
  | 'site_settings'

export interface AdminLog {
  id: string
  admin_id: string
  action: AdminLogAction
  target_type: AdminLogTargetType
  target_id: string
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  admin?: {
    name: string
    login_id: string
  }
}

// 관리자 활동 로그 검색 필터
export interface AdminLogFilter {
  admin_id?: string | 'all'
  action?: AdminLogAction | 'all'
  target_type?: AdminLogTargetType | 'all'
  search?: string
  date_from?: string
  date_to?: string
}
