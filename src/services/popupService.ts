import { supabase } from '@/lib/supabase'
import { logCreate, logUpdate, logDelete } from '@/services/adminLogService'
import type {
  Popup,
  PopupCreateInput,
  PopupUpdateInput,
  PopupFilter,
  PaginationParams,
} from '@/types'

// 팝업 목록 조회
export async function getPopups(
  params: PaginationParams & PopupFilter
): Promise<{ data: Popup[]; total: number }> {
  const { page, pageSize, position, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('popups')
    .select('*', { count: 'exact' })

  // 위치 필터
  if (position && position !== 'all') {
    query = query.eq('position', position)
  }

  // 상태 필터
  if (status && status !== 'all') {
    const now = new Date().toISOString()
    if (status === 'visible') {
      query = query.eq('is_visible', true)
    } else if (status === 'hidden') {
      query = query.eq('is_visible', false)
    } else if (status === 'active') {
      query = query
        .eq('is_visible', true)
        .lte('start_date', now)
        .gte('end_date', now)
    } else if (status === 'scheduled') {
      query = query.gt('start_date', now)
    } else if (status === 'expired') {
      query = query.lt('end_date', now)
    }
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
    data: (data as Popup[]) || [],
    total: count || 0,
  }
}

// 팝업 상세 조회
export async function getPopup(id: string): Promise<Popup> {
  const { data, error } = await supabase
    .from('popups')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Popup
}

// 팝업 생성
export async function createPopup(input: PopupCreateInput): Promise<Popup> {
  const { data, error } = await supabase
    .from('popups')
    .insert({
      title: input.title,
      content: input.content || null,
      image_url: input.image_url || null,
      link_url: input.link_url || null,
      position: input.position ?? 'center',
      width: input.width ?? 400,
      height: input.height ?? 300,
      start_date: input.start_date,
      end_date: input.end_date,
      is_visible: input.is_visible ?? true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logCreate('popup', data.id, data as Record<string, unknown>)

  return data as Popup
}

// 팝업 수정
export async function updatePopup(
  id: string,
  input: PopupUpdateInput
): Promise<Popup> {
  // 변경 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('popups')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('popups')
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
    'popup',
    id,
    beforeData as Record<string, unknown>,
    data as Record<string, unknown>
  )

  return data as Popup
}

// 팝업 삭제
export async function deletePopup(id: string): Promise<void> {
  // 삭제 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('popups')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('popups')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logDelete('popup', id, beforeData as Record<string, unknown>)
}

// 팝업 공개/비공개 토글
export async function togglePopupVisibility(
  id: string,
  isVisible: boolean
): Promise<Popup> {
  return updatePopup(id, { is_visible: isVisible })
}
