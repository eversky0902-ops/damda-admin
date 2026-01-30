import { supabase } from '@/lib/supabase'
import type {
  Banner,
  BannerCreateInput,
  BannerUpdateInput,
  BannerFilter,
  PaginationParams,
} from '@/types'

// 배너 목록 조회
export async function getBanners(
  params: PaginationParams & BannerFilter
): Promise<{ data: Banner[]; total: number }> {
  const { page, pageSize, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('banners')
    .select('*', { count: 'exact' })

  // 공개 상태 필터
  if (status && status !== 'all') {
    query = query.eq('is_visible', status === 'visible')
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
    data: (data as Banner[]) || [],
    total: count || 0,
  }
}

// 배너 상세 조회
export async function getBanner(id: string): Promise<Banner> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Banner
}

// 배너 생성
export async function createBanner(input: BannerCreateInput): Promise<Banner> {
  const { data, error } = await supabase
    .from('banners')
    .insert({
      type: 'main', // 기본값으로 main 설정
      title: input.title || null,
      image_url: input.image_url,
      sort_order: input.sort_order ?? 0,
      is_visible: input.is_visible ?? true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Banner
}

// 배너 수정
export async function updateBanner(
  id: string,
  input: BannerUpdateInput
): Promise<Banner> {
  const { data, error } = await supabase
    .from('banners')
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

  return data as Banner
}

// 배너 삭제
export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// 배너 공개/비공개 토글
export async function toggleBannerVisibility(
  id: string,
  isVisible: boolean
): Promise<Banner> {
  return updateBanner(id, { is_visible: isVisible })
}

// 배너 순서 변경
export async function updateBannerSortOrder(
  id: string,
  sortOrder: number
): Promise<Banner> {
  return updateBanner(id, { sort_order: sortOrder })
}
