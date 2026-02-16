import dayjs from 'dayjs'

import { supabase } from '@/lib/supabase'
import type { Settlement, SettlementStatus, PaginationParams } from '@/types'

export interface SettlementFilter {
  status?: SettlementStatus | 'all'
  business_owner_id?: string | 'all'
  vendor_search?: string
  settlement_month?: string // 'YYYY-MM' 형식
}

export interface SettlementCreateInput {
  business_owner_id: string
  settlement_period_start: string
  settlement_period_end: string
  settlement_month?: string
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
    bank_name?: string
    bank_account?: string
    bank_holder?: string
  }
}

// 정산 목록 조회
export async function getSettlements(
  params: Partial<PaginationParams> & SettlementFilter
): Promise<{ data: SettlementWithVendor[]; total: number }> {
  const { page, pageSize, status, business_owner_id, vendor_search, settlement_month } = params

  let query = supabase
    .from('settlements')
    .select(`
      *,
      business_owner:business_owners!settlements_business_owner_id_fkey(id, name, email, bank_name, bank_account, bank_holder)
    `, { count: 'exact' })

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // 사업주 필터 (ID 또는 이름 검색)
  if (business_owner_id && business_owner_id !== 'all') {
    query = query.eq('business_owner_id', business_owner_id)
  } else if (vendor_search) {
    // 사업주명으로 먼저 ID 목록 조회
    const { data: matchedVendors } = await supabase
      .from('business_owners')
      .select('id')
      .ilike('name', `%${vendor_search}%`)

    if (matchedVendors && matchedVendors.length > 0) {
      const vendorIds = matchedVendors.map((v) => v.id)
      query = query.in('business_owner_id', vendorIds)
    } else {
      return { data: [], total: 0 }
    }
  }

  // 정산월 필터
  if (settlement_month) {
    query = query.eq('settlement_month', settlement_month)
  }

  // 정렬
  query = query
    .order('settlement_month', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  // 페이지네이션 (page/pageSize가 있을 때만)
  if (page && pageSize) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
  }

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

  return data as unknown as SettlementWithVendor
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
      settlement_month: input.settlement_month || null,
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

// 정산 일괄 완료 처리
export async function bulkCompleteSettlements(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('settlements')
    .update({
      status: 'completed',
      settled_at: new Date().toISOString(),
    })
    .in('id', ids)
    .eq('status', 'pending')

  if (error) {
    throw new Error(error.message)
  }
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
  // 해당 기간의 이용 완료된 예약에 대한 결제 내역 조회
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

  // 매출 합계 (결제 완료 + 이용 완료된 예약)
  const paidPayments = payments.filter(
    p => p.status === 'paid' && p.reservation?.status === 'completed'
  )
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

// 정산 일괄 생성
export interface BulkGenerateResult {
  created: number
  skipped: number
  errors: string[]
}

export async function bulkGenerateSettlements(targetMonth: string): Promise<BulkGenerateResult> {
  // targetMonth는 정산이 실행되는 월 (예: "2026-02")
  // 정산 대상 기간: 전월 1일 ~ 전월 말일
  const targetDate = dayjs(targetMonth + '-01')
  const periodStart = targetDate.subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
  const periodEnd = targetDate.subtract(1, 'month').endOf('month').format('YYYY-MM-DD')

  const result: BulkGenerateResult = { created: 0, skipped: 0, errors: [] }

  // 1. 활성 사업주 전체 조회
  const { data: vendors, error: vendorError } = await supabase
    .from('business_owners')
    .select('id, name, commission_rate')
    .eq('status', 'active')

  if (vendorError) {
    throw new Error(`사업주 조회 실패: ${vendorError.message}`)
  }

  if (!vendors || vendors.length === 0) {
    throw new Error('활성 사업주가 없습니다')
  }

  // 2. 해당 월에 이미 생성된 정산 확인
  const { data: existingSettlements } = await supabase
    .from('settlements')
    .select('business_owner_id')
    .eq('settlement_month', targetMonth)

  const existingVendorIds = new Set(
    (existingSettlements || []).map(s => s.business_owner_id)
  )

  // 3. 각 사업주별 정산 생성
  for (const vendor of vendors) {
    // 이미 해당 월 정산이 있으면 스킵
    if (existingVendorIds.has(vendor.id)) {
      result.skipped++
      continue
    }

    try {
      // 결제 내역 조회
      const paymentSummary = await getPaymentsForSettlement(vendor.id, periodStart, periodEnd)

      // 정산 생성 (매출 0원이어도 생성)
      await createSettlement({
        business_owner_id: vendor.id,
        settlement_period_start: periodStart,
        settlement_period_end: periodEnd,
        settlement_month: targetMonth,
        total_sales: paymentSummary.totalSales,
        commission_rate: vendor.commission_rate,
        refund_amount: paymentSummary.refundAmount,
      })

      result.created++
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류'
      result.errors.push(`${vendor.name}: ${errorMsg}`)
    }
  }

  return result
}
