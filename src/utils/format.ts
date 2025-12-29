import dayjs from 'dayjs'
import { DATE_FORMAT, DATETIME_FORMAT } from '@/constants'

// 날짜 포맷
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-'
  return dayjs(date).format(DATE_FORMAT)
}

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-'
  return dayjs(date).format(DATETIME_FORMAT)
}

// 금액 포맷
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return '-'
  return `${amount.toLocaleString('ko-KR')}원`
}

// 전화번호 포맷
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }
  return phone
}

// 사업자등록번호 포맷
export const formatBusinessNumber = (num: string | null | undefined): string => {
  if (!num) return '-'
  const cleaned = num.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
  }
  return num
}
