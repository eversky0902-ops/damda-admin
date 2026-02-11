import { supabase } from '@/lib/supabase'
import { logUpdate, logDelete } from '@/services/adminLogService'
import type {
  PartnerInquiry,
  PartnerInquiryStatus,
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
    data: (data as unknown as PartnerInquiry[]) || [],
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

  return data as unknown as PartnerInquiry
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

  return data as unknown as PartnerInquiry
}

// 입점문의 메모 수정
export async function updatePartnerInquiryMemo(
  id: string,
  memo: string
): Promise<void> {
  const { error } = await supabase
    .from('partner_inquiries')
    .update({ memo } as Record<string, unknown>)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// 입점문의 전체 목록 조회 (엑셀 다운로드용)
export async function getAllPartnerInquiries(): Promise<PartnerInquiry[]> {
  const { data, error } = await supabase
    .from('partner_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as PartnerInquiry[]) || []
}

// 입점문의 일괄 삭제
export async function deletePartnerInquiries(ids: string[]): Promise<void> {
  for (const id of ids) {
    const { data: beforeData } = await supabase
      .from('partner_inquiries')
      .select('*')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('partner_inquiries')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    await logDelete('partner_inquiry', id, beforeData as Record<string, unknown>)
  }
}

// 입점문의 일괄 상태 변경
export async function bulkUpdatePartnerInquiryStatus(
  ids: string[],
  status: PartnerInquiryStatus,
  reviewedBy: string
): Promise<void> {
  for (const id of ids) {
    const { data: beforeData } = await supabase
      .from('partner_inquiries')
      .select('*')
      .eq('id', id)
      .single()

    const updateData: Record<string, unknown> = {
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
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
  }
}

