import { supabase } from '@/lib/supabase'
import type {
  Inquiry,
  InquiryAnswerInput,
  InquiryFilter,
  PaginationParams,
} from '@/types'

// 1:1 문의 목록 조회
export async function getInquiries(
  params: PaginationParams & InquiryFilter
): Promise<{ data: Inquiry[]; total: number }> {
  const { page, pageSize, status, category, search } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('inquiries')
    .select(`
      *,
      daycare:daycare_id(id, name, email),
      admin:answered_by(name)
    `, { count: 'exact' })

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // 카테고리 필터
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  // 검색
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  // 정렬 (답변대기 먼저, 최신순)
  query = query
    .order('status', { ascending: true }) // pending이 answered보다 먼저
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as Inquiry[]) || [],
    total: count || 0,
  }
}

// 1:1 문의 상세 조회
export async function getInquiry(id: string): Promise<Inquiry> {
  const { data, error } = await supabase
    .from('inquiries')
    .select(`
      *,
      daycare:daycare_id(id, name, email, contact_name, contact_phone),
      admin:answered_by(name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Inquiry
}

// 1:1 문의 답변
export async function answerInquiry(
  id: string,
  input: InquiryAnswerInput,
  adminId: string
): Promise<Inquiry> {
  const { data, error } = await supabase
    .from('inquiries')
    .update({
      answer: input.answer,
      answered_by: adminId,
      answered_at: new Date().toISOString(),
      status: 'answered',
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Inquiry
}

// 1:1 문의 답변 수정
export async function updateInquiryAnswer(
  id: string,
  input: InquiryAnswerInput,
  adminId: string
): Promise<Inquiry> {
  const { data, error } = await supabase
    .from('inquiries')
    .update({
      answer: input.answer,
      answered_by: adminId,
      answered_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Inquiry
}

// 1:1 문의 삭제
export async function deleteInquiry(id: string): Promise<void> {
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
