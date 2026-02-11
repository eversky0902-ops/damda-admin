import * as XLSX from 'xlsx'
import type { BusinessOwner, Product } from '@/types'

// 사업주 엑셀 다운로드용 컬럼 정의
export const VENDOR_EXCEL_COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: '사업자명' },
  { key: 'business_number', header: '사업자번호' },
  { key: 'representative', header: '대표자' },
  { key: 'contact_name', header: '담당자' },
  { key: 'contact_phone', header: '연락처' },
  { key: 'email', header: '이메일' },
  { key: 'address', header: '주소' },
  { key: 'address_detail', header: '상세주소' },
  { key: 'zipcode', header: '우편번호' },
  { key: 'bank_name', header: '은행명' },
  { key: 'bank_account', header: '계좌번호' },
  { key: 'bank_holder', header: '예금주' },
  { key: 'commission_rate', header: '수수료율(%)' },
  { key: 'status', header: '상태' },
  { key: 'created_at', header: '가입일' },
] as const

// 상품 엑셀 다운로드용 컬럼 정의
export const PRODUCT_EXCEL_COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: '상품명' },
  { key: 'summary', header: '요약' },
  { key: 'business_owner_id', header: '사업주ID' },
  { key: 'business_owner_name', header: '사업주' },
  { key: 'category_id', header: '카테고리ID' },
  { key: 'category_name', header: '카테고리' },
  { key: 'thumbnail', header: '썸네일URL' },
  { key: 'original_price', header: '정가' },
  { key: 'sale_price', header: '판매가' },
  { key: 'min_participants', header: '최소인원' },
  { key: 'max_participants', header: '최대인원' },
  { key: 'duration_minutes', header: '소요시간(분)' },
  { key: 'address', header: '주소' },
  { key: 'region', header: '지역' },
  { key: 'is_visible', header: '노출여부' },
  { key: 'is_sold_out', header: '품절여부' },
  { key: 'view_count', header: '조회수' },
  { key: 'created_at', header: '등록일' },
] as const

// 회원(어린이집) 엑셀 다운로드용 컬럼 정의
export const DAYCARE_EXCEL_COLUMNS = [
  { key: 'name', header: '어린이집명' },
  { key: 'email', header: '이메일' },
  { key: 'representative', header: '대표자' },
  { key: 'contact_name', header: '담당자' },
  { key: 'contact_phone', header: '연락처' },
  { key: 'business_number', header: '사업자번호' },
  { key: 'license_number', header: '인가번호' },
  { key: 'address', header: '주소' },
  { key: 'address_detail', header: '상세주소' },
  { key: 'zipcode', header: '우편번호' },
  { key: 'tel', header: '전화번호' },
  { key: 'capacity', header: '정원' },
  { key: 'status', header: '상태' },
  { key: 'created_at', header: '가입일' },
] as const

// 회원 데이터 엑셀 형식으로 변환
const DAYCARE_STATUS_KR: Record<string, string> = {
  pending: '가입대기',
  requested: '승인요청',
  approved: '승인완료',
  rejected: '승인거절',
  revision_required: '보완필요',
}

export function formatDaycaresForExcel(daycares: DaycareForExcel[]) {
  return daycares.map((d) => ({
    ...d,
    status: DAYCARE_STATUS_KR[d.status] || d.status,
    capacity: d.capacity || '',
  }))
}

interface DaycareForExcel {
  name: string
  email: string
  representative?: string | null
  contact_name: string
  contact_phone: string
  business_number?: string | null
  license_number: string
  address: string
  address_detail?: string | null
  zipcode?: string | null
  tel?: string | null
  capacity?: number | null
  status: string
  created_at: string
}

// 예약 엑셀 다운로드용 컬럼 정의
export const RESERVATION_EXCEL_COLUMNS = [
  { key: 'reservation_number', header: '예약번호' },
  { key: 'daycare_name', header: '어린이집' },
  { key: 'product_name', header: '상품명' },
  { key: 'business_owner_name', header: '사업주' },
  { key: 'reserved_date', header: '예약일' },
  { key: 'reserved_time', header: '예약시간' },
  { key: 'participant_count', header: '인원' },
  { key: 'total_amount', header: '결제금액' },
  { key: 'status', header: '상태' },
  { key: 'created_at', header: '예약신청일' },
] as const

// 예약 데이터 엑셀 형식으로 변환
const RESERVATION_STATUS_KR: Record<string, string> = {
  pending: '결제대기',
  paid: '결제완료',
  confirmed: '확정',
  completed: '이용완료',
  cancelled: '취소됨',
  refunded: '환불됨',
}

export function formatReservationsForExcel(reservations: ReservationForExcel[]) {
  return reservations.map((r) => ({
    reservation_number: r.reservation_number,
    daycare_name: r.daycare?.name || '',
    product_name: r.product?.name || '',
    business_owner_name: r.business_owner?.name || '',
    reserved_date: r.reserved_date,
    reserved_time: r.reserved_time || '',
    participant_count: r.participant_count,
    total_amount: r.total_amount,
    status: RESERVATION_STATUS_KR[r.status] || r.status,
    created_at: r.created_at,
  }))
}

interface ReservationForExcel {
  reservation_number: string
  reserved_date: string
  reserved_time?: string | null
  participant_count: number
  total_amount: number
  status: string
  created_at: string
  daycare?: { name: string }
  product?: { name: string }
  business_owner?: { name: string }
}

// 결제 엑셀 다운로드용 컬럼 정의
export const PAYMENT_EXCEL_COLUMNS = [
  { key: 'id', header: '결제ID' },
  { key: 'reservation_number', header: '예약번호' },
  { key: 'daycare_name', header: '어린이집' },
  { key: 'product_name', header: '상품명' },
  { key: 'business_owner_name', header: '사업주' },
  { key: 'payment_method', header: '결제수단' },
  { key: 'pg_provider', header: 'PG사' },
  { key: 'pg_tid', header: 'PG TID' },
  { key: 'amount', header: '결제금액' },
  { key: 'status', header: '상태' },
  { key: 'paid_at', header: '결제완료일시' },
  { key: 'created_at', header: '결제요청일시' },
] as const

// 정산 목록 엑셀 다운로드용 컬럼 정의
export const SETTLEMENT_LIST_EXCEL_COLUMNS = [
  { key: 'settlement_month', header: '정산월' },
  { key: 'business_owner_name', header: '사업주' },
  { key: 'period', header: '정산기간' },
  { key: 'total_sales', header: '총매출' },
  { key: 'commission_rate', header: '수수료율(%)' },
  { key: 'commission_amount', header: '수수료금액' },
  { key: 'refund_amount', header: '환불금액' },
  { key: 'settlement_amount', header: '정산금' },
  { key: 'status', header: '상태' },
  { key: 'settled_at', header: '정산일' },
] as const

// 정산 목록 데이터 엑셀 형식으로 변환
const SETTLEMENT_STATUS_KR: Record<string, string> = {
  pending: '정산대기',
  completed: '정산완료',
}

export function formatSettlementsForExcel(settlements: SettlementListForExcel[]) {
  return settlements.map((s) => ({
    settlement_month: s.settlement_month || '',
    business_owner_name: s.business_owner?.name || '',
    period: `${s.settlement_period_start} ~ ${s.settlement_period_end}`,
    total_sales: s.total_sales,
    commission_rate: s.commission_rate,
    commission_amount: s.commission_amount,
    refund_amount: s.refund_amount,
    settlement_amount: s.settlement_amount,
    status: SETTLEMENT_STATUS_KR[s.status] || s.status,
    settled_at: s.settled_at || '',
  }))
}

interface SettlementListForExcel {
  settlement_month: string | null
  settlement_period_start: string
  settlement_period_end: string
  total_sales: number
  commission_rate: number
  commission_amount: number
  refund_amount: number
  settlement_amount: number
  status: string
  settled_at: string | null
  business_owner?: { name: string }
}

// 정산 결제내역 엑셀 다운로드용 컬럼 정의
export const SETTLEMENT_PAYMENT_EXCEL_COLUMNS = [
  { key: 'reservation_number', header: '예약번호' },
  { key: 'reserved_date', header: '예약일' },
  { key: 'daycare_name', header: '어린이집' },
  { key: 'product_name', header: '상품' },
  { key: 'amount', header: '결제금액' },
  { key: 'payment_status', header: '결제상태' },
  { key: 'reservation_status', header: '예약상태' },
  { key: 'paid_at', header: '결제일시' },
] as const

// 정산 결제내역 데이터 엑셀 형식으로 변환
export function formatSettlementPaymentsForExcel(payments: SettlementPaymentForExcel[]) {
  const statusLabels: Record<string, string> = {
    paid: '완료',
    cancelled: '취소',
    pending: '대기',
    failed: '실패',
  }
  const reservationStatusLabels: Record<string, string> = {
    confirmed: '확정',
    completed: '완료',
    cancelled: '취소',
    refunded: '환불',
    pending: '대기',
    paid: '결제완료',
  }
  return payments.map((p) => ({
    reservation_number: p.reservation?.reservation_number || '',
    reserved_date: p.reservation?.reserved_date || '',
    daycare_name: p.reservation?.daycare?.name || '',
    product_name: p.reservation?.product?.name || '',
    amount: p.amount,
    payment_status: statusLabels[p.status] || p.status,
    reservation_status: reservationStatusLabels[p.reservation?.status || ''] || p.reservation?.status || '',
    paid_at: p.paid_at || '',
  }))
}

interface SettlementPaymentForExcel {
  amount: number
  status: string
  paid_at: string | null
  reservation?: {
    reservation_number?: string
    reserved_date?: string
    status?: string
    daycare?: { name: string }
    product?: { name: string }
  }
}

// 입점문의 엑셀 다운로드용 컬럼 정의
export const PARTNER_INQUIRY_EXCEL_COLUMNS = [
  { key: 'name', header: '업체명' },
  { key: 'business_number', header: '사업자번호' },
  { key: 'representative', header: '대표자' },
  { key: 'contact_name', header: '담당자' },
  { key: 'contact_phone', header: '연락처' },
  { key: 'email', header: '이메일' },
  { key: 'address', header: '주소' },
  { key: 'address_detail', header: '상세주소' },
  { key: 'program_types', header: '프로그램 유형' },
  { key: 'description', header: '설명' },
  { key: 'status', header: '상태' },
  { key: 'memo', header: '메모' },
  { key: 'created_at', header: '등록일' },
] as const

// 입점문의 데이터 엑셀 형식으로 변환
const PARTNER_INQUIRY_STATUS_KR: Record<string, string> = {
  pending: '대기중',
  approved: '처리완료',
}

export function formatPartnerInquiriesForExcel(inquiries: PartnerInquiryForExcel[]) {
  return inquiries.map((i) => ({
    ...i,
    status: PARTNER_INQUIRY_STATUS_KR[i.status] || i.status,
  }))
}

interface PartnerInquiryForExcel {
  name: string
  business_number: string
  representative: string
  contact_name: string
  contact_phone: string
  email: string
  address?: string | null
  address_detail?: string | null
  program_types?: string | null
  description?: string | null
  status: string
  memo?: string | null
  created_at: string
}

// 사업주 엑셀 업로드용 컬럼 정의 (필수 필드)
export const VENDOR_UPLOAD_COLUMNS = [
  { key: 'id', header: 'ID', required: false }, // ID가 있으면 수정, 없으면 신규
  { key: 'email', header: '이메일', required: true },
  { key: 'name', header: '사업자명', required: true },
  { key: 'business_number', header: '사업자번호', required: true },
  { key: 'representative', header: '대표자', required: true },
  { key: 'contact_name', header: '담당자', required: true },
  { key: 'contact_phone', header: '연락처', required: true },
  { key: 'address', header: '주소', required: true },
  { key: 'address_detail', header: '상세주소', required: false },
  { key: 'zipcode', header: '우편번호', required: false },
  { key: 'bank_name', header: '은행명', required: false },
  { key: 'bank_account', header: '계좌번호', required: false },
  { key: 'bank_holder', header: '예금주', required: false },
  { key: 'commission_rate', header: '수수료율(%)', required: false },
] as const

// 상품 엑셀 업로드용 컬럼 정의 (필수 필드)
export const PRODUCT_UPLOAD_COLUMNS = [
  { key: 'id', header: 'ID', required: false }, // ID가 있으면 수정, 없으면 신규
  { key: 'name', header: '상품명', required: true },
  { key: 'business_owner_id', header: '사업주ID', required: true },
  { key: 'thumbnail', header: '썸네일URL', required: true },
  { key: 'original_price', header: '정가', required: true },
  { key: 'sale_price', header: '판매가', required: true },
  { key: 'max_participants', header: '최대인원', required: true },
  { key: 'summary', header: '요약', required: false },
  { key: 'description', header: '설명', required: false },
  { key: 'category_id', header: '카테고리ID', required: false },
  { key: 'min_participants', header: '최소인원', required: false },
  { key: 'duration_minutes', header: '소요시간(분)', required: false },
  { key: 'address', header: '주소', required: false },
  { key: 'region', header: '지역', required: false },
  { key: 'is_visible', header: '노출여부(Y/N)', required: false },
  { key: 'options', header: '옵션(이름:가격:필수|...)', required: false },
  { key: 'available_time_slots', header: '운영시간(요일:시작-종료|...)', required: false },
] as const

// 엑셀 파일 다운로드
export function downloadExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: readonly { key: string; header: string }[],
  filename: string
) {
  // 데이터를 헤더 기준으로 변환
  const headers = columns.map((col) => col.header)
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key]
      // 날짜 형식 처리
      if (col.key.includes('_at') && value) {
        return new Date(value as string).toLocaleDateString('ko-KR')
      }
      // 불린 처리
      if (typeof value === 'boolean') {
        return value ? 'Y' : 'N'
      }
      return value ?? ''
    })
  )

  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // 열 너비 자동 조정
  const colWidths = headers.map((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map((row) => String(row[i] ?? '').length)
    )
    return { wch: Math.min(Math.max(maxLength * 2, 10), 50) }
  })
  ws['!cols'] = colWidths

  // 워크북 생성
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  // 파일 다운로드
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// 사업주 데이터 엑셀 형식으로 변환
export function formatVendorsForExcel(vendors: BusinessOwner[]) {
  return vendors.map((vendor) => ({
    ...vendor,
    status: vendor.status === 'active' ? '활성' : '비활성',
  }))
}

// 상품 데이터 엑셀 형식으로 변환
export function formatProductsForExcel(products: Product[]) {
  return products.map((product) => ({
    ...product,
    business_owner_id: product.business_owner_id || product.business_owner?.id || '',
    business_owner_name: product.business_owner?.name || '',
    category_id: product.category_id || product.category?.id || '',
    category_name: product.category?.name || '',
    is_visible: product.is_visible ? 'Y' : 'N',
    is_sold_out: product.is_sold_out ? 'Y' : 'N',
  }))
}

// 결제 상태 한글 변환
const PAYMENT_STATUS_KR: Record<string, string> = {
  pending: '대기중',
  paid: '결제완료',
  failed: '실패',
  cancelled: '취소됨',
}

// 결제수단 한글 변환
const PAYMENT_METHOD_KR: Record<string, string> = {
  card: '카드',
  bank: '계좌이체',
  virtual: '가상계좌',
  phone: '휴대폰',
}

// 결제 데이터 엑셀 형식으로 변환
export function formatPaymentsForExcel(payments: PaymentWithDetails[]) {
  return payments.map((payment) => ({
    id: payment.id,
    reservation_number: payment.reservation?.reservation_number || '',
    daycare_name: payment.reservation?.daycare?.name || '',
    product_name: payment.reservation?.product?.name || '',
    business_owner_name: payment.reservation?.business_owner?.name || '',
    payment_method: PAYMENT_METHOD_KR[payment.payment_method] || payment.payment_method,
    pg_provider: payment.pg_provider,
    pg_tid: payment.pg_tid || '',
    amount: payment.amount,
    status: PAYMENT_STATUS_KR[payment.status] || payment.status,
    paid_at: payment.paid_at || '',
    created_at: payment.created_at,
  }))
}

// PaymentWithDetails 타입 import를 위한 인터페이스
interface PaymentWithDetails {
  id: string
  reservation_id: string
  pg_provider: string
  pg_tid: string | null
  payment_method: string
  amount: number
  status: string
  paid_at: string | null
  created_at: string
  reservation?: {
    reservation_number?: string
    daycare?: { name: string }
    product?: { name: string }
    business_owner?: { name: string }
  }
}

// 엑셀 파일 파싱
export async function parseExcelFile<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet)
        resolve(jsonData)
      } catch (error) {
        reject(new Error('엑셀 파일을 파싱하는데 실패했습니다.'))
      }
    }

    reader.onerror = () => {
      reject(new Error('파일을 읽는데 실패했습니다.'))
    }

    reader.readAsBinaryString(file)
  })
}

// 엑셀 데이터를 사업주 생성 입력으로 변환
export function parseVendorExcelData(
  data: Record<string, unknown>[]
): { valid: Record<string, unknown>[]; errors: { row: number; message: string }[] } {
  const valid: Record<string, unknown>[] = []
  const errors: { row: number; message: string }[] = []

  const headerKeyMap: Record<string, string> = {}
  VENDOR_UPLOAD_COLUMNS.forEach((col) => {
    headerKeyMap[col.header] = col.key
  })

  data.forEach((row, index) => {
    const rowNum = index + 2 // 헤더가 1행이므로 데이터는 2행부터

    // 헤더 이름을 키로 변환
    const converted: Record<string, unknown> = {}
    Object.entries(row).forEach(([key, value]) => {
      const mappedKey = headerKeyMap[key] || key
      converted[mappedKey] = value
    })

    // 필수 필드 검증
    const missingFields: string[] = []
    VENDOR_UPLOAD_COLUMNS.filter((col) => col.required).forEach((col) => {
      if (!converted[col.key] || String(converted[col.key]).trim() === '') {
        missingFields.push(col.header)
      }
    })

    if (missingFields.length > 0) {
      errors.push({
        row: rowNum,
        message: `필수 항목 누락: ${missingFields.join(', ')}`,
      })
      return
    }

    // 이메일 형식 검증
    const email = String(converted.email || '')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: rowNum, message: '이메일 형식이 올바르지 않습니다.' })
      return
    }

    // 사업자번호 형식 검증 (숫자 10자리)
    const businessNumber = String(converted.business_number || '').replace(/-/g, '')
    if (!/^\d{10}$/.test(businessNumber)) {
      errors.push({ row: rowNum, message: '사업자번호는 10자리 숫자여야 합니다.' })
      return
    }
    converted.business_number = businessNumber

    // 수수료율 변환
    if (converted.commission_rate) {
      const rate = Number(converted.commission_rate)
      if (isNaN(rate) || rate < 0 || rate > 100) {
        errors.push({ row: rowNum, message: '수수료율은 0~100 사이의 숫자여야 합니다.' })
        return
      }
      converted.commission_rate = rate
    } else {
      converted.commission_rate = 10 // 기본값
    }

    valid.push(converted)
  })

  return { valid, errors }
}

// 옵션 문자열 파싱: "옵션명:가격:필수여부|옵션명:가격:필수여부"
// 예: "추가인원:5000:N|특별케어:10000:Y"
function parseOptionsString(
  optionsStr: string
): { options: { name: string; price: number; is_required: boolean; sort_order: number }[]; error?: string } {
  if (!optionsStr || optionsStr.trim() === '') {
    return { options: [] }
  }

  const options: { name: string; price: number; is_required: boolean; sort_order: number }[] = []
  const parts = optionsStr.split('|')

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()
    if (!part) continue

    const segments = part.split(':')
    if (segments.length < 2) {
      return { options: [], error: `옵션 형식 오류: "${part}" (형식: 이름:가격:필수여부)` }
    }

    const name = segments[0].trim()
    const price = Number(segments[1])
    const isRequired = segments[2]?.toUpperCase() === 'Y'

    if (!name) {
      return { options: [], error: `옵션명이 비어있습니다.` }
    }
    if (isNaN(price) || price < 0) {
      return { options: [], error: `옵션 "${name}"의 가격이 올바르지 않습니다.` }
    }

    options.push({
      name,
      price,
      is_required: isRequired,
      sort_order: i,
    })
  }

  return { options }
}

// 운영시간 문자열 파싱: "요일:시작-종료|요일:시작-종료"
// 요일: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
// 예: "1:09:00-18:00|2:09:00-18:00|3:09:00-17:00"
function parseTimeSlotsString(
  slotsStr: string
): { slots: { day: number; start: string; end: string }[]; error?: string } {
  if (!slotsStr || slotsStr.trim() === '') {
    return { slots: [] }
  }

  const slots: { day: number; start: string; end: string }[] = []
  const parts = slotsStr.split('|')

  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    // 형식: "요일:시작시간-종료시간" 예: "1:09:00-18:00"
    const match = trimmed.match(/^(\d):(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/)
    if (!match) {
      return { slots: [], error: `운영시간 형식 오류: "${trimmed}" (형식: 요일:HH:MM-HH:MM)` }
    }

    const day = Number(match[1])
    const start = match[2].padStart(5, '0') // "9:00" -> "09:00"
    const end = match[3].padStart(5, '0')

    if (day < 0 || day > 6) {
      return { slots: [], error: `요일은 0(일)~6(토) 사이여야 합니다: "${trimmed}"` }
    }

    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      return { slots: [], error: `시간 형식 오류: "${trimmed}" (HH:MM 형식 필요)` }
    }

    slots.push({ day, start, end })
  }

  return { slots }
}

// 엑셀 데이터를 상품 생성 입력으로 변환
export function parseProductExcelData(
  data: Record<string, unknown>[]
): { valid: Record<string, unknown>[]; errors: { row: number; message: string }[] } {
  const valid: Record<string, unknown>[] = []
  const errors: { row: number; message: string }[] = []

  const headerKeyMap: Record<string, string> = {}
  PRODUCT_UPLOAD_COLUMNS.forEach((col) => {
    headerKeyMap[col.header] = col.key
  })

  data.forEach((row, index) => {
    const rowNum = index + 2

    // 헤더 이름을 키로 변환
    const converted: Record<string, unknown> = {}
    Object.entries(row).forEach(([key, value]) => {
      const mappedKey = headerKeyMap[key] || key
      converted[mappedKey] = value
    })

    // 필수 필드 검증
    const missingFields: string[] = []
    PRODUCT_UPLOAD_COLUMNS.filter((col) => col.required).forEach((col) => {
      if (!converted[col.key] || String(converted[col.key]).trim() === '') {
        missingFields.push(col.header)
      }
    })

    if (missingFields.length > 0) {
      errors.push({
        row: rowNum,
        message: `필수 항목 누락: ${missingFields.join(', ')}`,
      })
      return
    }

    // 가격 검증
    const originalPrice = Number(converted.original_price)
    const salePrice = Number(converted.sale_price)
    if (isNaN(originalPrice) || originalPrice < 0) {
      errors.push({ row: rowNum, message: '정가는 0 이상의 숫자여야 합니다.' })
      return
    }
    if (isNaN(salePrice) || salePrice < 0) {
      errors.push({ row: rowNum, message: '판매가는 0 이상의 숫자여야 합니다.' })
      return
    }
    converted.original_price = originalPrice
    converted.sale_price = salePrice

    // 인원 검증
    const maxParticipants = Number(converted.max_participants)
    if (isNaN(maxParticipants) || maxParticipants < 1) {
      errors.push({ row: rowNum, message: '최대인원은 1 이상의 숫자여야 합니다.' })
      return
    }
    converted.max_participants = maxParticipants

    if (converted.min_participants) {
      const minParticipants = Number(converted.min_participants)
      if (isNaN(minParticipants) || minParticipants < 1) {
        errors.push({ row: rowNum, message: '최소인원은 1 이상의 숫자여야 합니다.' })
        return
      }
      converted.min_participants = minParticipants
    } else {
      converted.min_participants = 1
    }

    // 소요시간 변환
    if (converted.duration_minutes) {
      const duration = Number(converted.duration_minutes)
      if (isNaN(duration) || duration < 0) {
        errors.push({ row: rowNum, message: '소요시간은 0 이상의 숫자여야 합니다.' })
        return
      }
      converted.duration_minutes = duration
    }

    // 노출여부 변환
    if (converted.is_visible) {
      const visible = String(converted.is_visible).toUpperCase()
      converted.is_visible = visible === 'Y' || visible === 'YES' || visible === '1'
    } else {
      converted.is_visible = true
    }

    // 옵션 파싱
    if (converted.options) {
      const { options, error } = parseOptionsString(String(converted.options))
      if (error) {
        errors.push({ row: rowNum, message: error })
        return
      }
      converted.options = options.length > 0 ? options : undefined
    }

    // 운영시간 파싱
    if (converted.available_time_slots) {
      const { slots, error } = parseTimeSlotsString(String(converted.available_time_slots))
      if (error) {
        errors.push({ row: rowNum, message: error })
        return
      }
      converted.available_time_slots = slots.length > 0 ? slots : undefined
    }

    valid.push(converted)
  })

  return { valid, errors }
}

// 사업주 업로드 템플릿 다운로드
export function downloadVendorTemplate() {
  const headers = VENDOR_UPLOAD_COLUMNS.map((col) =>
    col.required ? `${col.header}*` : col.header
  )
  const sampleData = [
    [
      '', // ID (비워두면 신규 등록)
      'example@email.com',
      '예시사업자',
      '1234567890',
      '홍길동',
      '김담당',
      '010-1234-5678',
      '서울시 강남구 테헤란로 123',
      '101동 1호',
      '06234',
      '신한은행',
      '110-123-456789',
      '홍길동',
      '10',
    ],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData])
  const colWidths = headers.map((header) => ({
    wch: Math.max(header.length * 2, 15),
  }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '사업주등록양식')

  // 안내 시트 추가
  const guideData = [
    ['사업주 엑셀 업로드 안내'],
    [''],
    ['[ID 컬럼 안내]'],
    ['- ID가 비어있으면: 신규 사업주로 등록됩니다.'],
    ['- ID가 있으면: 해당 사업주 정보가 수정됩니다.'],
    ['- 기존 데이터를 수정하려면 "전체 목록 다운로드"로 받은 엑셀에서 ID를 복사하세요.'],
    [''],
    ['[필수 항목]'],
    ['* 표시가 있는 항목은 반드시 입력해야 합니다.'],
    [''],
    ['[사업자번호]'],
    ['- 하이픈(-) 없이 10자리 숫자만 입력'],
    ['예시: 1234567890'],
    [''],
    ['[수수료율]'],
    ['- 0~100 사이의 숫자 (기본값: 10)'],
  ]
  const guideWs = XLSX.utils.aoa_to_sheet(guideData)
  guideWs['!cols'] = [{ wch: 60 }]
  XLSX.utils.book_append_sheet(wb, guideWs, '입력안내')

  XLSX.writeFile(wb, '사업주_등록_양식.xlsx')
}

// 상품 업로드 템플릿 다운로드
export function downloadProductTemplate() {
  const headers = PRODUCT_UPLOAD_COLUMNS.map((col) =>
    col.required ? `${col.header}*` : col.header
  )
  const sampleData = [
    [
      '', // ID (비워두면 신규 등록)
      '예시 상품명',
      'business-owner-uuid',
      'https://example.com/image.jpg',
      '50000',
      '45000',
      '30',
      '상품 요약 설명',
      '상품 상세 설명',
      'category-uuid',
      '1',
      '60',
      '서울시 강남구',
      '서울',
      'Y',
      '추가인원:5000:N|특별케어:10000:Y',
      '1:09:00-18:00|2:09:00-18:00|3:09:00-18:00|4:09:00-18:00|5:09:00-18:00',
    ],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData])
  const colWidths = headers.map((header) => ({
    wch: Math.max(header.length * 2, 20),
  }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '상품등록양식')

  // 안내 시트 추가
  const guideData = [
    ['상품 엑셀 업로드 안내'],
    [''],
    ['[ID 컬럼 안내]'],
    ['- ID가 비어있으면: 신규 상품으로 등록됩니다.'],
    ['- ID가 있으면: 해당 상품 정보가 수정됩니다.'],
    ['- 기존 데이터를 수정하려면 "전체 목록 다운로드"로 받은 엑셀에서 ID를 복사하세요.'],
    [''],
    ['[필수 항목]'],
    ['* 표시가 있는 항목은 반드시 입력해야 합니다.'],
    [''],
    ['[옵션 입력 형식]'],
    ['형식: 옵션명:가격:필수여부|옵션명:가격:필수여부'],
    ['- 옵션명: 옵션 이름'],
    ['- 가격: 숫자 (0 이상)'],
    ['- 필수여부: Y 또는 N (생략 시 N)'],
    ['예시: 추가인원:5000:N|특별케어:10000:Y'],
    [''],
    ['[운영시간 입력 형식]'],
    ['형식: 요일:시작시간-종료시간|요일:시작시간-종료시간'],
    ['- 요일: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토'],
    ['- 시간: HH:MM 형식 (24시간제)'],
    ['예시: 1:09:00-18:00|2:09:00-18:00|3:09:00-17:00'],
    ['(월~수 09:00~18:00, 17:00 운영)'],
    [''],
    ['[노출여부]'],
    ['Y 또는 N으로 입력 (생략 시 Y)'],
  ]
  const guideWs = XLSX.utils.aoa_to_sheet(guideData)
  guideWs['!cols'] = [{ wch: 60 }]
  XLSX.utils.book_append_sheet(wb, guideWs, '입력안내')

  XLSX.writeFile(wb, '상품_등록_양식.xlsx')
}
