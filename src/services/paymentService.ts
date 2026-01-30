import { supabase } from '@/lib/supabase'
import { logCreate, logStatusChange } from '@/services/adminLogService'
import type {
  Payment,
  PaymentStatusType,
  Refund,
  RefundStatusType,
  Reservation,
  PaginationParams,
} from '@/types'

// 결제 목록 조회를 위한 확장 타입
export interface PaymentWithDetails extends Payment {
  reservation?: Reservation & {
    daycare?: { id: string; name: string; contact_name: string; contact_phone: string }
    product?: { id: string; name: string; thumbnail: string }
    business_owner?: { id: string; name: string }
  }
  refunds?: Refund[]
}

// 결제 검색 필터
export interface PaymentFilter {
  status?: PaymentStatusType | 'all'
  payment_method?: string | 'all'
  pg_provider?: string | 'all'
  search?: string
  date_from?: string
  date_to?: string
}

// 결제 목록 조회
export async function getPayments(
  params: PaginationParams & PaymentFilter
): Promise<{ data: PaymentWithDetails[]; total: number }> {
  const { page, pageSize, status, payment_method, pg_provider, search, date_from, date_to } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('payments')
    .select(`
      *,
      reservation:reservations(
        id,
        reservation_number,
        reserved_date,
        reserved_time,
        participant_count,
        total_amount,
        status,
        daycare:daycares(id, name, contact_name, contact_phone),
        product:products(id, name, thumbnail),
        business_owner:business_owners(id, name)
      )
    `, { count: 'exact' })

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // 결제수단 필터
  if (payment_method && payment_method !== 'all') {
    query = query.eq('payment_method', payment_method)
  }

  // PG사 필터
  if (pg_provider && pg_provider !== 'all') {
    query = query.eq('pg_provider', pg_provider)
  }

  // 날짜 범위 필터
  if (date_from) {
    query = query.gte('created_at', `${date_from}T00:00:00`)
  }
  if (date_to) {
    query = query.lte('created_at', `${date_to}T23:59:59`)
  }

  // 검색 (PG TID)
  if (search) {
    query = query.or(`pg_tid.ilike.%${search}%`)
  }

  // 정렬 및 페이지네이션
  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as PaymentWithDetails[]) || [],
    total: count || 0,
  }
}

// 결제 상세 조회
export async function getPayment(id: string): Promise<PaymentWithDetails> {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      reservation:reservations(
        *,
        daycare:daycares(*),
        product:products(*, business_owner:business_owners(*)),
        business_owner:business_owners(*),
        options:reservation_options(*, product_option:product_options(*))
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 환불 내역 조회
  const { data: refunds, error: refundsError } = await supabase
    .from('refunds')
    .select(`
      *,
      admin:processed_by(name)
    `)
    .eq('payment_id', id)
    .order('created_at', { ascending: false })

  if (refundsError) {
    throw new Error(refundsError.message)
  }

  return {
    ...(data as PaymentWithDetails),
    refunds: (refunds as Refund[]) || [],
  }
}

// 결제 상태 변경
export async function updatePaymentStatus(
  id: string,
  status: PaymentStatusType
): Promise<Payment> {
  // 변경 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .single()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logStatusChange(
    'payment',
    id,
    beforeData as Record<string, unknown>,
    data as Record<string, unknown>
  )

  return data as Payment
}

// 환불 처리 (나이스페이 PG 환불 API 호출 포함)
export async function processRefund(
  paymentId: string,
  reservationId: string,
  refundAmount: number,
  reason: string,
  adminMemo: string,
  adminId: string
): Promise<Refund> {
  // Edge Function 호출하여 PG 환불 처리
  const { data, error } = await supabase.functions.invoke('process-refund', {
    body: {
      paymentId,
      reservationId,
      refundAmount,
      reason,
      adminMemo,
      adminId,
    },
  })

  if (error) {
    throw new Error(error.message || '환불 처리 중 오류가 발생했습니다.')
  }

  if (!data.success) {
    throw new Error(data.error || '환불 처리에 실패했습니다.')
  }

  // 활동 로그 기록
  await logCreate('refund', data.refund.id, data.refund as Record<string, unknown>)

  return data.refund as Refund
}

// 결제 통계 조회
export async function getPaymentStats(): Promise<{
  total: number
  pending: number
  paid: number
  failed: number
  cancelled: number
  totalAmount: number
  todayAmount: number
}> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('payments')
    .select('status, amount, created_at')

  if (error) {
    throw new Error(error.message)
  }

  const stats = {
    total: data.length,
    pending: 0,
    paid: 0,
    failed: 0,
    cancelled: 0,
    totalAmount: 0,
    todayAmount: 0,
  }

  data.forEach((row) => {
    const status = row.status as PaymentStatusType
    if (status in stats && typeof stats[status as keyof typeof stats] === 'number') {
      (stats as Record<string, number>)[status]++
    }

    if (status === 'paid') {
      stats.totalAmount += row.amount
      if (row.created_at.startsWith(today)) {
        stats.todayAmount += row.amount
      }
    }
  })

  return stats
}

// 환불 목록 조회
export async function getRefunds(
  params: PaginationParams & { status?: RefundStatusType | 'all' }
): Promise<{ data: Refund[]; total: number }> {
  const { page, pageSize, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('refunds')
    .select(`
      *,
      admin:processed_by(name)
    `, { count: 'exact' })

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // 정렬 및 페이지네이션
  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as Refund[]) || [],
    total: count || 0,
  }
}

// PG사 목록 조회 (필터용)
export async function getPgProviders(): Promise<string[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('pg_provider')

  if (error) {
    throw new Error(error.message)
  }

  const providers = [...new Set(data.map(d => d.pg_provider))]
  return providers.sort()
}

// 결제수단 목록 조회 (필터용)
export async function getPaymentMethods(): Promise<string[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('payment_method')

  if (error) {
    throw new Error(error.message)
  }

  const methods = [...new Set(data.map(d => d.payment_method))]
  return methods.sort()
}
