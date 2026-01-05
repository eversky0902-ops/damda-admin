// 페이지네이션 기본값
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 날짜 포맷
export const DATE_FORMAT = 'YYYY-MM-DD'
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

// 상태 라벨
export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  pending: '결제대기',
  paid: '결제완료',
  confirmed: '확정',
  completed: '이용완료',
  cancelled: '취소됨',
  refunded: '환불됨',
}

export const RESERVATION_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  paid: 'processing',
  confirmed: 'blue',
  completed: 'success',
  cancelled: 'error',
  refunded: 'warning',
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: '대기중',
  paid: '결제완료',
  failed: '실패',
  cancelled: '취소됨',
}

export const PAYMENT_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  paid: 'success',
  failed: 'error',
  cancelled: 'warning',
}

export const REFUND_STATUS_LABEL: Record<string, string> = {
  pending: '처리중',
  completed: '환불완료',
  failed: '실패',
}

export const REFUND_STATUS_COLOR: Record<string, string> = {
  pending: 'processing',
  completed: 'success',
  failed: 'error',
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  card: '카드',
  bank: '계좌이체',
  virtual: '가상계좌',
  phone: '휴대폰',
}

export const VENDOR_STATUS_LABEL: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
}

export const DAYCARE_STATUS_LABEL: Record<string, string> = {
  pending: '가입대기',
  requested: '승인요청',
  approved: '승인완료',
  rejected: '승인거절',
}

export const DAYCARE_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  requested: 'processing',
  approved: 'success',
  rejected: 'error',
}

// 상품 상태 라벨
export const PRODUCT_STATUS_LABEL: Record<string, string> = {
  visible: '노출',
  hidden: '숨김',
  sold_out: '품절',
}

export const PRODUCT_STATUS_COLOR: Record<string, string> = {
  visible: 'green',
  hidden: 'default',
  sold_out: 'red',
}

// 요일 라벨
export const DAY_OF_WEEK_LABEL: Record<number, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
}

// 카테고리 상태 라벨
export const CATEGORY_STATUS_LABEL: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
}

// 카테고리 깊이 라벨
export const CATEGORY_DEPTH_LABEL: Record<number, string> = {
  1: '대분류',
  2: '중분류',
  3: '소분류',
}

// 카테고리 깊이 색상
export const CATEGORY_DEPTH_COLOR: Record<number, string> = {
  1: 'blue',
  2: 'green',
  3: 'orange',
}

// 지역 옵션
export const REGION_OPTIONS = [
  { value: '서울', label: '서울' },
  { value: '경기', label: '경기' },
  { value: '인천', label: '인천' },
  { value: '부산', label: '부산' },
  { value: '대구', label: '대구' },
  { value: '광주', label: '광주' },
  { value: '대전', label: '대전' },
  { value: '울산', label: '울산' },
  { value: '세종', label: '세종' },
  { value: '강원', label: '강원' },
  { value: '충북', label: '충북' },
  { value: '충남', label: '충남' },
  { value: '전북', label: '전북' },
  { value: '전남', label: '전남' },
  { value: '경북', label: '경북' },
  { value: '경남', label: '경남' },
  { value: '제주', label: '제주' },
]

// 리뷰 상태 라벨
export const REVIEW_VISIBILITY_LABEL: Record<string, string> = {
  visible: '공개',
  hidden: '비공개',
}

export const REVIEW_VISIBILITY_COLOR: Record<string, string> = {
  visible: 'green',
  hidden: 'default',
}

// 별점 옵션
export const RATING_OPTIONS = [
  { value: 'all', label: '전체 별점' },
  { value: 5, label: '5점' },
  { value: 4, label: '4점' },
  { value: 3, label: '3점' },
  { value: 2, label: '2점' },
  { value: 1, label: '1점' },
]

// 공지사항 상태 라벨
export const NOTICE_VISIBILITY_LABEL: Record<string, string> = {
  visible: '공개',
  hidden: '비공개',
}

export const NOTICE_VISIBILITY_COLOR: Record<string, string> = {
  visible: 'green',
  hidden: 'default',
}

// FAQ 카테고리 옵션
export const FAQ_CATEGORY_OPTIONS = [
  { value: 'general', label: '일반' },
  { value: 'reservation', label: '예약' },
  { value: 'payment', label: '결제' },
  { value: 'refund', label: '환불' },
  { value: 'member', label: '회원' },
  { value: 'etc', label: '기타' },
]

export const FAQ_CATEGORY_LABEL: Record<string, string> = {
  general: '일반',
  reservation: '예약',
  payment: '결제',
  refund: '환불',
  member: '회원',
  etc: '기타',
}

// 배너 타입 라벨
export const BANNER_TYPE_LABEL: Record<string, string> = {
  main: '메인 배너',
  sub: '서브 배너',
}

export const BANNER_TYPE_COLOR: Record<string, string> = {
  main: 'blue',
  sub: 'green',
}

// 팝업 위치 라벨
export const POPUP_POSITION_LABEL: Record<string, string> = {
  center: '중앙',
  bottom: '하단',
}

// 문의 상태 라벨
export const INQUIRY_STATUS_LABEL: Record<string, string> = {
  pending: '답변대기',
  answered: '답변완료',
}

export const INQUIRY_STATUS_COLOR: Record<string, string> = {
  pending: 'warning',
  answered: 'success',
}

// 문의 카테고리 옵션
export const INQUIRY_CATEGORY_OPTIONS = [
  { value: 'reservation', label: '예약문의' },
  { value: 'payment', label: '결제문의' },
  { value: 'refund', label: '환불문의' },
  { value: 'product', label: '상품문의' },
  { value: 'member', label: '회원문의' },
  { value: 'etc', label: '기타문의' },
]

export const INQUIRY_CATEGORY_LABEL: Record<string, string> = {
  reservation: '예약문의',
  payment: '결제문의',
  refund: '환불문의',
  product: '상품문의',
  member: '회원문의',
  etc: '기타문의',
}

// 정산 상태 라벨
export const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  pending: '정산대기',
  completed: '정산완료',
}

export const SETTLEMENT_STATUS_COLOR: Record<string, string> = {
  pending: 'processing',
  completed: 'success',
}

// PG사 라벨
export const PG_PROVIDER_LABEL: Record<string, string> = {
  tosspayments: '토스페이먼츠',
  kakaopay: '카카오페이',
  naverpay: '네이버페이',
  nicepay: '나이스페이',
  inicis: '이니시스',
  kcp: 'KCP',
}
