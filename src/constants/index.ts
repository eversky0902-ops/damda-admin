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
  revision_required: '보완필요',
}

export const DAYCARE_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  requested: 'processing',
  approved: 'success',
  rejected: 'error',
  revision_required: 'warning',
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

// 시간 슬롯 모드 라벨
export const TIME_SLOT_MODE_LABEL: Record<string, string> = {
  auto: '자동 생성',
  custom: '직접 지정',
}

// 시간 슬롯 간격 옵션
export const TIME_SLOT_INTERVAL_OPTIONS = [
  { value: 30, label: '30분' },
  { value: 60, label: '60분' },
  { value: 90, label: '90분' },
  { value: 120, label: '2시간' },
]

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

// 지역 옵션 (레거시 - 시/도만)
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

// 지역 Cascader 옵션 (시/도 → 구/군)
// 사용자앱 regionGroups.ts의 districts와 동일한 값 사용
export const REGION_CASCADER_OPTIONS = [
  { value: '서울', label: '서울', children: [
    { value: '강남구', label: '강남구' }, { value: '강동구', label: '강동구' },
    { value: '강북구', label: '강북구' }, { value: '강서구', label: '강서구' },
    { value: '관악구', label: '관악구' }, { value: '광진구', label: '광진구' },
    { value: '구로구', label: '구로구' }, { value: '금천구', label: '금천구' },
    { value: '노원구', label: '노원구' }, { value: '도봉구', label: '도봉구' },
    { value: '동대문구', label: '동대문구' }, { value: '동작구', label: '동작구' },
    { value: '마포구', label: '마포구' }, { value: '서대문구', label: '서대문구' },
    { value: '서초구', label: '서초구' }, { value: '성동구', label: '성동구' },
    { value: '성북구', label: '성북구' }, { value: '송파구', label: '송파구' },
    { value: '양천구', label: '양천구' }, { value: '영등포구', label: '영등포구' },
    { value: '용산구', label: '용산구' }, { value: '은평구', label: '은평구' },
    { value: '종로구', label: '종로구' }, { value: '중구', label: '중구' },
    { value: '중랑구', label: '중랑구' },
  ]},
  { value: '경기', label: '경기', children: [
    { value: '가평군', label: '가평군' }, { value: '고양시', label: '고양시' },
    { value: '과천시', label: '과천시' }, { value: '광명시', label: '광명시' },
    { value: '광주시', label: '광주시' }, { value: '구리시', label: '구리시' },
    { value: '군포시', label: '군포시' }, { value: '김포시', label: '김포시' },
    { value: '남양주시', label: '남양주시' }, { value: '동두천시', label: '동두천시' },
    { value: '부천시', label: '부천시' }, { value: '성남시', label: '성남시' },
    { value: '수원시', label: '수원시' }, { value: '시흥시', label: '시흥시' },
    { value: '안산시', label: '안산시' }, { value: '안성시', label: '안성시' },
    { value: '안양시', label: '안양시' }, { value: '양주시', label: '양주시' },
    { value: '양평군', label: '양평군' }, { value: '여주시', label: '여주시' },
    { value: '연천군', label: '연천군' }, { value: '오산시', label: '오산시' },
    { value: '용인시', label: '용인시' }, { value: '의왕시', label: '의왕시' },
    { value: '의정부시', label: '의정부시' }, { value: '이천시', label: '이천시' },
    { value: '파주시', label: '파주시' }, { value: '평택시', label: '평택시' },
    { value: '포천시', label: '포천시' }, { value: '하남시', label: '하남시' },
    { value: '화성시', label: '화성시' },
  ]},
  { value: '인천', label: '인천', children: [
    { value: '강화군', label: '강화군' }, { value: '계양구', label: '계양구' },
    { value: '남동구', label: '남동구' }, { value: '동구', label: '동구' },
    { value: '미추홀구', label: '미추홀구' }, { value: '부평구', label: '부평구' },
    { value: '서구', label: '서구' }, { value: '연수구', label: '연수구' },
    { value: '옹진군', label: '옹진군' }, { value: '중구', label: '중구' },
  ]},
  { value: '부산', label: '부산', children: [
    { value: '강서구', label: '강서구' }, { value: '금정구', label: '금정구' },
    { value: '기장군', label: '기장군' }, { value: '남구', label: '남구' },
    { value: '동구', label: '동구' }, { value: '동래구', label: '동래구' },
    { value: '부산진구', label: '부산진구' }, { value: '북구', label: '북구' },
    { value: '사상구', label: '사상구' }, { value: '사하구', label: '사하구' },
    { value: '서구', label: '서구' }, { value: '수영구', label: '수영구' },
    { value: '연제구', label: '연제구' }, { value: '영도구', label: '영도구' },
    { value: '중구', label: '중구' }, { value: '해운대구', label: '해운대구' },
  ]},
  { value: '대구', label: '대구', children: [
    { value: '군위군', label: '군위군' }, { value: '남구', label: '남구' },
    { value: '달서구', label: '달서구' }, { value: '달성군', label: '달성군' },
    { value: '동구', label: '동구' }, { value: '북구', label: '북구' },
    { value: '서구', label: '서구' }, { value: '수성구', label: '수성구' },
    { value: '중구', label: '중구' },
  ]},
  { value: '광주', label: '광주', children: [
    { value: '광산구', label: '광산구' }, { value: '남구', label: '남구' },
    { value: '동구', label: '동구' }, { value: '북구', label: '북구' },
    { value: '서구', label: '서구' },
  ]},
  { value: '대전', label: '대전', children: [
    { value: '대덕구', label: '대덕구' }, { value: '동구', label: '동구' },
    { value: '서구', label: '서구' }, { value: '유성구', label: '유성구' },
    { value: '중구', label: '중구' },
  ]},
  { value: '울산', label: '울산', children: [
    { value: '남구', label: '남구' }, { value: '동구', label: '동구' },
    { value: '북구', label: '북구' }, { value: '울주군', label: '울주군' },
    { value: '중구', label: '중구' },
  ]},
  { value: '세종', label: '세종', children: [] },
  { value: '강원', label: '강원', children: [
    { value: '강릉시', label: '강릉시' }, { value: '고성군', label: '고성군' },
    { value: '동해시', label: '동해시' }, { value: '삼척시', label: '삼척시' },
    { value: '속초시', label: '속초시' }, { value: '양구군', label: '양구군' },
    { value: '양양군', label: '양양군' }, { value: '영월군', label: '영월군' },
    { value: '원주시', label: '원주시' }, { value: '인제군', label: '인제군' },
    { value: '정선군', label: '정선군' }, { value: '철원군', label: '철원군' },
    { value: '춘천시', label: '춘천시' }, { value: '태백시', label: '태백시' },
    { value: '평창군', label: '평창군' }, { value: '홍천군', label: '홍천군' },
    { value: '화천군', label: '화천군' }, { value: '횡성군', label: '횡성군' },
  ]},
  { value: '충북', label: '충북', children: [
    { value: '괴산군', label: '괴산군' }, { value: '단양군', label: '단양군' },
    { value: '보은군', label: '보은군' }, { value: '영동군', label: '영동군' },
    { value: '옥천군', label: '옥천군' }, { value: '음성군', label: '음성군' },
    { value: '제천시', label: '제천시' }, { value: '증평군', label: '증평군' },
    { value: '진천군', label: '진천군' }, { value: '청주시', label: '청주시' },
    { value: '충주시', label: '충주시' },
  ]},
  { value: '충남', label: '충남', children: [
    { value: '계룡시', label: '계룡시' }, { value: '공주시', label: '공주시' },
    { value: '금산군', label: '금산군' }, { value: '논산시', label: '논산시' },
    { value: '당진시', label: '당진시' }, { value: '보령시', label: '보령시' },
    { value: '부여군', label: '부여군' }, { value: '서산시', label: '서산시' },
    { value: '서천군', label: '서천군' }, { value: '아산시', label: '아산시' },
    { value: '예산군', label: '예산군' }, { value: '천안시', label: '천안시' },
    { value: '청양군', label: '청양군' }, { value: '태안군', label: '태안군' },
    { value: '홍성군', label: '홍성군' },
  ]},
  { value: '전북', label: '전북', children: [
    { value: '고창군', label: '고창군' }, { value: '군산시', label: '군산시' },
    { value: '김제시', label: '김제시' }, { value: '남원시', label: '남원시' },
    { value: '무주군', label: '무주군' }, { value: '부안군', label: '부안군' },
    { value: '순창군', label: '순창군' }, { value: '완주군', label: '완주군' },
    { value: '익산시', label: '익산시' }, { value: '임실군', label: '임실군' },
    { value: '장수군', label: '장수군' }, { value: '전주시', label: '전주시' },
    { value: '정읍시', label: '정읍시' }, { value: '진안군', label: '진안군' },
  ]},
  { value: '전남', label: '전남', children: [
    { value: '강진군', label: '강진군' }, { value: '고흥군', label: '고흥군' },
    { value: '곡성군', label: '곡성군' }, { value: '광양시', label: '광양시' },
    { value: '구례군', label: '구례군' }, { value: '나주시', label: '나주시' },
    { value: '담양군', label: '담양군' }, { value: '목포시', label: '목포시' },
    { value: '무안군', label: '무안군' }, { value: '보성군', label: '보성군' },
    { value: '순천시', label: '순천시' }, { value: '신안군', label: '신안군' },
    { value: '여수시', label: '여수시' }, { value: '영광군', label: '영광군' },
    { value: '영암군', label: '영암군' }, { value: '완도군', label: '완도군' },
    { value: '장성군', label: '장성군' }, { value: '장흥군', label: '장흥군' },
    { value: '진도군', label: '진도군' }, { value: '함평군', label: '함평군' },
    { value: '해남군', label: '해남군' }, { value: '화순군', label: '화순군' },
  ]},
  { value: '경북', label: '경북', children: [
    { value: '경산시', label: '경산시' }, { value: '경주시', label: '경주시' },
    { value: '구미시', label: '구미시' }, { value: '김천시', label: '김천시' },
    { value: '문경시', label: '문경시' }, { value: '봉화군', label: '봉화군' },
    { value: '상주시', label: '상주시' }, { value: '성주군', label: '성주군' },
    { value: '안동시', label: '안동시' }, { value: '영덕군', label: '영덕군' },
    { value: '영주시', label: '영주시' }, { value: '영천시', label: '영천시' },
    { value: '예천군', label: '예천군' }, { value: '울릉군', label: '울릉군' },
    { value: '울진군', label: '울진군' }, { value: '의성군', label: '의성군' },
    { value: '청도군', label: '청도군' }, { value: '청송군', label: '청송군' },
    { value: '칠곡군', label: '칠곡군' }, { value: '포항시', label: '포항시' },
  ]},
  { value: '경남', label: '경남', children: [
    { value: '거제시', label: '거제시' }, { value: '거창군', label: '거창군' },
    { value: '고성군', label: '고성군' }, { value: '김해시', label: '김해시' },
    { value: '남해군', label: '남해군' }, { value: '밀양시', label: '밀양시' },
    { value: '사천시', label: '사천시' }, { value: '산청군', label: '산청군' },
    { value: '양산시', label: '양산시' }, { value: '의령군', label: '의령군' },
    { value: '진주시', label: '진주시' }, { value: '창녕군', label: '창녕군' },
    { value: '창원시', label: '창원시' }, { value: '통영시', label: '통영시' },
    { value: '하동군', label: '하동군' }, { value: '함안군', label: '함안군' },
    { value: '함양군', label: '함양군' }, { value: '합천군', label: '합천군' },
  ]},
  { value: '제주', label: '제주', children: [
    { value: '서귀포시', label: '서귀포시' }, { value: '제주시', label: '제주시' },
  ]},
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

// 광고 배너 상태 라벨
export const AD_BANNER_STATUS_LABEL: Record<string, string> = {
  visible: '공개',
  hidden: '비공개',
}

export const AD_BANNER_STATUS_COLOR: Record<string, string> = {
  visible: 'green',
  hidden: 'default',
}

// 법적 문서 카테고리 옵션
export const LEGAL_DOCUMENT_CATEGORY_OPTIONS = [
  { value: 'terms', label: '이용약관' },
  { value: 'privacy', label: '개인정보처리방침' },
  { value: 'refund-policy', label: '환불정책' },
  { value: 'reservation-guide', label: '예약안내' },
]

export const LEGAL_DOCUMENT_CATEGORY_LABEL: Record<string, string> = {
  'terms': '이용약관',
  'privacy': '개인정보처리방침',
  'refund-policy': '환불정책',
  'reservation-guide': '예약안내',
}

export const LEGAL_DOCUMENT_CATEGORY_COLOR: Record<string, string> = {
  'terms': 'blue',
  'privacy': 'green',
  'refund-policy': 'orange',
  'reservation-guide': 'purple',
}

// 법적 문서 공개 상태 라벨
export const LEGAL_DOCUMENT_VISIBILITY_LABEL: Record<string, string> = {
  visible: '공개',
  hidden: '비공개',
}

export const LEGAL_DOCUMENT_VISIBILITY_COLOR: Record<string, string> = {
  visible: 'green',
  hidden: 'default',
}

// 입점문의 상태 라벨
export const PARTNER_INQUIRY_STATUS_LABEL: Record<string, string> = {
  pending: '대기중',
  approved: '처리완료',
}

export const PARTNER_INQUIRY_STATUS_COLOR: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
}
