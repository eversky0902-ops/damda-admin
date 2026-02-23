import { supabase } from '@/lib/supabase'
import { logCreate, logUpdate, logStatusChange } from '@/services/adminLogService'
import type {
  Reservation,
  ReservationStatusType,
  ReservationFilter,
  Payment,
  Refund,
  PaginationParams,
} from '@/types'

// 예약 목록 조회
export async function getReservations(
  params: PaginationParams & ReservationFilter
): Promise<{ data: Reservation[]; total: number }> {
  const { page, pageSize, status, business_owner_id, daycare_id, search, date_from, date_to } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('reservations')
    .select(`
      *,
      daycare:daycares(id, name, contact_name, contact_phone),
      product:products(id, name, thumbnail),
      business_owner:business_owners(id, name)
    `, { count: 'exact' })

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // 사업주 필터
  if (business_owner_id) {
    query = query.eq('business_owner_id', business_owner_id)
  }

  // 어린이집 필터
  if (daycare_id) {
    query = query.eq('daycare_id', daycare_id)
  }

  // 날짜 범위 필터
  if (date_from) {
    query = query.gte('reserved_date', date_from)
  }
  if (date_to) {
    query = query.lte('reserved_date', date_to)
  }

  // 검색 (예약번호, 어린이집명)
  if (search) {
    query = query.or(`reservation_number.ilike.%${search}%`)
  }

  // 정렬 및 페이지네이션 (예약일 기준 내림차순)
  query = query.order('reserved_date', { ascending: false }).order('reserved_time', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as unknown as Reservation[]) || [],
    total: count || 0,
  }
}

// 예약 전체 목록 조회 (엑셀 다운로드용)
export async function getAllReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      daycare:daycares(id, name, contact_name, contact_phone),
      product:products(id, name, thumbnail),
      business_owner:business_owners(id, name)
    `)
    .order('reserved_date', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as Reservation[]) || []
}

// 예약 상세 조회
export async function getReservation(id: string): Promise<Reservation> {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      daycare:daycares(*),
      product:products(*, business_owner:business_owners(*)),
      business_owner:business_owners(*),
      options:reservation_options(*, product_option:product_options(*))
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Reservation
}

// 예약 상태 변경
export async function updateReservationStatus(
  id: string,
  status: ReservationStatusType,
  cancelReason?: string
): Promise<Reservation> {
  // 변경 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'cancelled' || status === 'refunded') {
    updateData.cancel_reason = cancelReason || null
    updateData.cancelled_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('reservations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logStatusChange(
    'reservation',
    id,
    beforeData as Record<string, unknown>,
    data as Record<string, unknown>
  )

  return data as Reservation
}

// 예약 메모 수정
export async function updateReservationMemo(
  id: string,
  memo: string
): Promise<Reservation> {
  // 변경 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('reservations')
    .update({
      memo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logUpdate(
    'reservation',
    id,
    beforeData as Record<string, unknown>,
    data as Record<string, unknown>
  )

  return data as Reservation
}

// 결제 정보 조회
export async function getPayment(reservationId: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('reservation_id', reservationId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as Payment | null
}

// 환불 내역 조회
export async function getRefunds(reservationId: string): Promise<Refund[]> {
  const { data, error } = await supabase
    .from('refunds')
    .select(`
      *,
      admin:processed_by(name)
    `)
    .eq('reservation_id', reservationId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as Refund[]) || []
}

// 환불 처리 (나이스페이 PG 환불 API 호출 포함)
export async function processRefund(
  reservationId: string,
  paymentId: string,
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
    // Edge Function non-2xx 응답 시 body에서 실제 에러 메시지 추출
    try {
      const errorBody = await error.context?.json?.()
      if (errorBody?.error) {
        throw new Error(errorBody.error)
      }
    } catch (e) {
      if (e instanceof Error && e.message !== error.message) throw e
    }
    throw new Error(error.message || '환불 처리 중 오류가 발생했습니다.')
  }

  if (!data.success) {
    throw new Error(data.error || '환불 처리에 실패했습니다.')
  }

  // 활동 로그 기록
  await logCreate('refund', data.refund.id, data.refund as Record<string, unknown>)

  return data.refund as Refund
}

// 예약 통계 조회
export async function getReservationStats(): Promise<{
  total: number
  pending: number
  paid: number
  confirmed: number
  completed: number
  cancelled: number
  refunded: number
}> {
  const { data, error } = await supabase
    .from('reservations')
    .select('status')

  if (error) {
    throw new Error(error.message)
  }

  const stats = {
    total: data.length,
    pending: 0,
    paid: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    refunded: 0,
  }

  data.forEach((row) => {
    const status = row.status as ReservationStatusType
    if (status in stats) {
      stats[status]++
    }
  })

  return stats
}

// 사업주 목록 조회 (필터용)
export async function getBusinessOwnersForFilter(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('business_owners')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}
