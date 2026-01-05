import { supabase } from '@/lib/supabase'
import type {
  Notice,
  NoticeCreateInput,
  NoticeUpdateInput,
  NoticeFilter,
  PaginationParams,
} from '@/types'

// 공지사항 목록 조회
export async function getNotices(
  params: PaginationParams & NoticeFilter
): Promise<{ data: Notice[]; total: number }> {
  const { page, pageSize, status, pinned, search } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('notices')
    .select(`
      *,
      admin:created_by(name)
    `, { count: 'exact' })

  // 공개 상태 필터
  if (status && status !== 'all') {
    query = query.eq('is_visible', status === 'visible')
  }

  // 고정 필터
  if (pinned && pinned !== 'all') {
    query = query.eq('is_pinned', pinned === 'pinned')
  }

  // 검색
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  // 정렬 (고정 먼저, 최신순)
  query = query
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as Notice[]) || [],
    total: count || 0,
  }
}

// 공지사항 상세 조회
export async function getNotice(id: string): Promise<Notice> {
  const { data, error } = await supabase
    .from('notices')
    .select(`
      *,
      admin:created_by(name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Notice
}

// 공지사항 생성
export async function createNotice(
  input: NoticeCreateInput,
  adminId: string
): Promise<Notice> {
  const { data, error } = await supabase
    .from('notices')
    .insert({
      title: input.title,
      content: input.content,
      is_pinned: input.is_pinned ?? false,
      is_visible: input.is_visible ?? true,
      created_by: adminId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Notice
}

// 공지사항 수정
export async function updateNotice(
  id: string,
  input: NoticeUpdateInput
): Promise<Notice> {
  const { data, error } = await supabase
    .from('notices')
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

  return data as Notice
}

// 공지사항 삭제
export async function deleteNotice(id: string): Promise<void> {
  const { error } = await supabase
    .from('notices')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// 공지사항 공개/비공개 토글
export async function toggleNoticeVisibility(
  id: string,
  isVisible: boolean
): Promise<Notice> {
  return updateNotice(id, { is_visible: isVisible })
}

// 공지사항 고정/해제 토글
export async function toggleNoticePinned(
  id: string,
  isPinned: boolean
): Promise<Notice> {
  return updateNotice(id, { is_pinned: isPinned })
}
