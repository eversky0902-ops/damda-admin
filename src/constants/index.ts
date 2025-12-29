// 페이지네이션 기본값
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 날짜 포맷
export const DATE_FORMAT = 'YYYY-MM-DD'
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

// 상태 라벨
export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  pending: '대기중',
  confirmed: '확정',
  cancelled: '취소됨',
  completed: '완료',
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: '대기중',
  completed: '결제완료',
  refunded: '환불됨',
}

export const VENDOR_STATUS_LABEL: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
}
