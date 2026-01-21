import * as XLSX from 'xlsx'
import type { BusinessOwner, Product } from '@/types'

// 사업주 엑셀 다운로드용 컬럼 정의
export const VENDOR_EXCEL_COLUMNS = [
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
  { key: 'name', header: '상품명' },
  { key: 'summary', header: '요약' },
  { key: 'business_owner_name', header: '사업주' },
  { key: 'category_name', header: '카테고리' },
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

// 사업주 엑셀 업로드용 컬럼 정의 (필수 필드)
export const VENDOR_UPLOAD_COLUMNS = [
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
    business_owner_name: product.business_owner?.name || '',
    category_name: product.category?.name || '',
    is_visible: product.is_visible ? 'Y' : 'N',
    is_sold_out: product.is_sold_out ? 'Y' : 'N',
  }))
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

  XLSX.writeFile(wb, '사업주_등록_양식.xlsx')
}

// 상품 업로드 템플릿 다운로드
export function downloadProductTemplate() {
  const headers = PRODUCT_UPLOAD_COLUMNS.map((col) =>
    col.required ? `${col.header}*` : col.header
  )
  const sampleData = [
    [
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
    ],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData])
  const colWidths = headers.map((header) => ({
    wch: Math.max(header.length * 2, 15),
  }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '상품등록양식')

  XLSX.writeFile(wb, '상품_등록_양식.xlsx')
}
