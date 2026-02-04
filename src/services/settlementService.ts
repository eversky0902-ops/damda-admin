import { supabase } from '@/lib/supabase'
import type { Settlement, SettlementStatus, PaginationParams } from '@/types'

export interface SettlementFilter {
  status?: SettlementStatus | 'all'
  business_owner_id?: string | 'all'
  date_from?: string
  date_to?: string
}

export interface SettlementCreateInput {
  business_owner_id: string
  settlement_period_start: string
  settlement_period_end: string
  total_sales: number
  commission_rate: number
  refund_amount?: number
}

export interface SettlementUpdateInput {
  settlement_period_start?: string
  settlement_period_end?: string
  total_sales?: number
  commission_rate?: number
  commission_amount?: number
  refund_amount?: number
  settlement_amount?: number
  status?: SettlementStatus
  settled_at?: string | null
}

export interface SettlementWithVendor extends Settlement {
  business_owner?: {
    id: string
    name: string
    email: string
  }
}

// 정산 목록 조회
export async function getSettlements(
  params: PaginationParams & SettlementFilter
): Promise<{ data: SettlementWithVendor[]; total: number }> {
  const { page, pageSize, status, business_owner_id, date_from, date_to } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('settlements')
    .select(`
      *,
      business_owner:business_owners!settlements_business_owner_id_fkey(id, name, email)
    `, { count: 'exact' })

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // 사업주 필터
  if (business_owner_id && business_owner_id !== 'all') {
    query = query.eq('business_owner_id', business_owner_id)
  }

  // 기간 필터
  if (date_from) {
    query = query.gte('settlement_period_start', date_from)
  }
  if (date_to) {
    query = query.lte('settlement_period_end', date_to)
  }

  // 정렬 및 페이지네이션
  query = query.order('settlement_period_end', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as SettlementWithVendor[]) || [],
    total: count || 0,
  }
}

// 정산 상세 조회
export async function getSettlement(id: string): Promise<SettlementWithVendor> {
  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      business_owner:business_owners!settlements_business_owner_id_fkey(id, name, email, bank_name, bank_account, bank_holder)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as SettlementWithVendor
}

// 정산 생성
export async function createSettlement(input: SettlementCreateInput): Promise<Settlement> {
  // 수수료 금액 계산
  const commission_amount = Math.round(input.total_sales * (input.commission_rate / 100))
  const refund_amount = input.refund_amount || 0
  const settlement_amount = input.total_sales - commission_amount - refund_amount

  const { data, error } = await supabase
    .from('settlements')
    .insert({
      business_owner_id: input.business_owner_id,
      settlement_period_start: input.settlement_period_start,
      settlement_period_end: input.settlement_period_end,
      total_sales: input.total_sales,
      commission_rate: input.commission_rate,
      commission_amount,
      refund_amount,
      settlement_amount,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Settlement
}

// 정산 수정
export async function updateSettlement(id: string, input: SettlementUpdateInput): Promise<Settlement> {
  // 수정 데이터 준비
  const updateData: Record<string, unknown> = { ...input }

  // 매출이나 수수료율이 변경되면 금액 재계산
  if (input.total_sales !== undefined || input.commission_rate !== undefined) {
    const current = await getSettlement(id)
    const total_sales = input.total_sales ?? current.total_sales
    const commission_rate = input.commission_rate ?? current.commission_rate
    const refund_amount = input.refund_amount ?? current.refund_amount

    updateData.commission_amount = Math.round(total_sales * (commission_rate / 100))
    updateData.settlement_amount = total_sales - (updateData.commission_amount as number) - refund_amount
  }

  const { data, error } = await supabase
    .from('settlements')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Settlement
}

// 정산 상태 변경 (정산 완료 처리)
export async function completeSettlement(id: string): Promise<Settlement> {
  const { data, error } = await supabase
    .from('settlements')
    .update({
      status: 'completed',
      settled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Settlement
}

// 정산 삭제
export async function deleteSettlement(id: string): Promise<void> {
  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// 전체 사업주 목록 조회 (셀렉트박스용 - 정산에서는 비활성 사업주도 포함)
export async function getVendorsForSelect(includeInactive = false): Promise<{ id: string; name: string; commission_rate: number; status: string }[]> {
  let query = supabase
    .from('business_owners')
    .select('id, name, commission_rate, status')

  if (!includeInactive) {
    query = query.eq('status', 'active')
  }

  const { data, error } = await query.order('name')

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// 정산용 결제 내역 조회
export interface SettlementPayment {
  id: string
  reservation_id: string
  amount: number
  status: string
  paid_at: string | null
  reservation: {
    id: string
    reservation_number: string
    reserved_date: string
    status: string
    total_amount: number
    daycare?: {
      name: string
    }
    product?: {
      name: string
    }
  }
}

export interface SettlementPaymentSummary {
  payments: SettlementPayment[]
  totalSales: number
  refundAmount: number
  paidCount: number
  refundedCount: number
}

export async function getPaymentsForSettlement(
  businessOwnerId: string,
  dateFrom: string,
  dateTo: string
): Promise<SettlementPaymentSummary> {
  // 해당 기간의 예약에 대한 결제 내역 조회
  const { data, error } = await supabase
    .from('payments')
    .select(`
      id,
      reservation_id,
      amount,
      status,
      paid_at,
      reservation:reservations!inner(
        id,
        reservation_number,
        reserved_date,
        status,
        total_amount,
        daycare:daycares(name),
        product:products(name)
      )
    `)
    .eq('reservations.business_owner_id', businessOwnerId)
    .gte('reservations.reserved_date', dateFrom)
    .lte('reservations.reserved_date', dateTo)
    .order('paid_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const payments = (data || []) as unknown as SettlementPayment[]

  // 매출 합계 (결제 완료된 것)
  const paidPayments = payments.filter(p => p.status === 'paid')
  const totalSales = paidPayments.reduce((sum, p) => sum + p.amount, 0)

  // 환불 합계 (취소된 결제 또는 환불된 예약)
  const refundedPayments = payments.filter(
    p => p.status === 'cancelled' || p.reservation?.status === 'refunded'
  )
  const refundAmount = refundedPayments.reduce((sum, p) => sum + p.amount, 0)

  return {
    payments,
    totalSales,
    refundAmount,
    paidCount: paidPayments.length,
    refundedCount: refundedPayments.length,
  }
}
