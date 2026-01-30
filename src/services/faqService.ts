import { supabase } from '@/lib/supabase'
import { logCreate, logUpdate, logDelete } from '@/services/adminLogService'
import type {
  FAQ,
  FAQCreateInput,
  FAQUpdateInput,
  FAQFilter,
  PaginationParams,
} from '@/types'

// FAQ 목록 조회
export async function getFAQs(
  params: PaginationParams & FAQFilter
): Promise<{ data: FAQ[]; total: number }> {
  const { page, pageSize, category, status, search } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('faqs')
    .select('*', { count: 'exact' })

  // 카테고리 필터
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  // 공개 상태 필터
  if (status && status !== 'all') {
    query = query.eq('is_visible', status === 'visible')
  }

  // 검색
  if (search) {
    query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`)
  }

  // 정렬 (정렬순서, 최신순)
  query = query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as FAQ[]) || [],
    total: count || 0,
  }
}

// FAQ 상세 조회
export async function getFAQ(id: string): Promise<FAQ> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as FAQ
}

// FAQ 생성
export async function createFAQ(input: FAQCreateInput): Promise<FAQ> {
  const { data, error } = await supabase
    .from('faqs')
    .insert({
      category: input.category,
      question: input.question,
      answer: input.answer,
      sort_order: input.sort_order ?? 0,
      is_visible: input.is_visible ?? true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logCreate('faq', data.id, data as Record<string, unknown>)

  return data as FAQ
}

// FAQ 수정
export async function updateFAQ(
  id: string,
  input: FAQUpdateInput
): Promise<FAQ> {
  // 변경 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('faqs')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('faqs')
    .update({
      ...input,
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
    'faq',
    id,
    beforeData as Record<string, unknown>,
    data as Record<string, unknown>
  )

  return data as FAQ
}

// FAQ 삭제
export async function deleteFAQ(id: string): Promise<void> {
  // 삭제 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('faqs')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logDelete('faq', id, beforeData as Record<string, unknown>)
}

// FAQ 공개/비공개 토글
export async function toggleFAQVisibility(
  id: string,
  isVisible: boolean
): Promise<FAQ> {
  return updateFAQ(id, { is_visible: isVisible })
}

// FAQ 순서 변경
export async function updateFAQSortOrder(
  id: string,
  sortOrder: number
): Promise<FAQ> {
  return updateFAQ(id, { sort_order: sortOrder })
}
