import { supabase } from '@/lib/supabase'
import { logUpdate } from '@/services/adminLogService'
import type {
  PartnerInquiry,
  PartnerInquiryFilter,
  PaginationParams,
} from '@/types'

// 입점문의 목록 조회
export async function getPartnerInquiries(
  params: PaginationParams & PartnerInquiryFilter
): Promise<{ data: PartnerInquiry[]; total: number }> {
  const { page, pageSize, status, search } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('partner_inquiries')
    .select(`
      *,
      admin:reviewed_by(name)
    `, { count: 'exact' })

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // 검색 (업체명으로 검색)
  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  // 정렬 (최신순)
  query = query
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as PartnerInquiry[]) || [],
    total: count || 0,
  }
}

// 입점문의 상세 조회
export async function getPartnerInquiry(id: string): Promise<PartnerInquiry> {
  const { data, error } = await supabase
    .from('partner_inquiries')
    .select(`
      *,
      admin:reviewed_by(name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PartnerInquiry
}

// 입점문의 처리완료 + 메모 저장
export async function updatePartnerInquiryStatus(
  id: string,
  reviewedBy: string,
  memo?: string
): Promise<PartnerInquiry> {
  const { data: beforeData } = await supabase
    .from('partner_inquiries')
    .select('*')
    .eq('id', id)
    .single()

  const updateData: Record<string, unknown> = {
    status: 'approved',
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    memo: memo || null,
  }

  const { data, error } = await supabase
    .from('partner_inquiries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await logUpdate(
    'partner_inquiry',
    id,
    beforeData as Record<string, unknown>,
    data as Record<string, unknown>
  )

  return data as PartnerInquiry
}

// 입점문의 메모 수정
export async function updatePartnerInquiryMemo(
  id: string,
  memo: string
): Promise<void> {
  const { error } = await supabase
    .from('partner_inquiries')
    .update({ memo })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
