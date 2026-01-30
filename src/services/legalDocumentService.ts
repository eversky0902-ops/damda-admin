import { supabase } from '@/lib/supabase'
import type {
  LegalDocument,
  LegalDocumentCreateInput,
  LegalDocumentFilter,
  PaginationParams,
} from '@/types'

// 법적 문서 목록 조회
export async function getLegalDocuments(
  params: PaginationParams & LegalDocumentFilter
): Promise<{ data: LegalDocument[]; total: number }> {
  const { page, pageSize, category, status, search } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('legal_documents')
    .select(`
      *,
      admin:created_by(name)
    `, { count: 'exact' })

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
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
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
    data: (data as LegalDocument[]) || [],
    total: count || 0,
  }
}

// 법적 문서 상세 조회
export async function getLegalDocument(id: string): Promise<LegalDocument> {
  const { data, error } = await supabase
    .from('legal_documents')
    .select(`
      *,
      admin:created_by(name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as LegalDocument
}

// 다음 버전 번호 조회
async function getNextVersion(category: string): Promise<number> {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('version')
    .eq('category', category)
    .order('version', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  return data && data.length > 0 ? data[0].version + 1 : 1
}

// 법적 문서 생성
export async function createLegalDocument(
  input: LegalDocumentCreateInput,
  adminId: string
): Promise<LegalDocument> {
  const nextVersion = await getNextVersion(input.category)

  const { data, error } = await supabase
    .from('legal_documents')
    .insert({
      category: input.category,
      title: input.title,
      content: input.content,
      version: nextVersion,
      is_visible: input.is_visible ?? true,
      created_by: adminId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as LegalDocument
}

// 법적 문서 삭제
export async function deleteLegalDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('legal_documents')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// 법적 문서 공개/비공개 토글
export async function toggleLegalDocumentVisibility(
  id: string,
  isVisible: boolean
): Promise<LegalDocument> {
  const { data, error } = await supabase
    .from('legal_documents')
    .update({
      is_visible: isVisible,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as LegalDocument
}
