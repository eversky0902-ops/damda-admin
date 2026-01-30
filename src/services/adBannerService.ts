import { supabase } from '@/lib/supabase'
import type {
  AdBanner,
  AdBannerCreateInput,
  AdBannerUpdateInput,
  AdBannerFilter,
  PaginationParams,
} from '@/types'

// 광고 배너 목록 조회
export async function getAdBanners(
  params: PaginationParams & AdBannerFilter
): Promise<{ data: AdBanner[]; total: number }> {
  const { page, pageSize, status } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('ad_banners')
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
    data: (data as AdBanner[]) || [],
    total: count || 0,
  }
}

// 광고 배너 상세 조회
export async function getAdBanner(id: string): Promise<AdBanner> {
  const { data, error } = await supabase
    .from('ad_banners')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as AdBanner
}

// 광고 배너 생성
export async function createAdBanner(input: AdBannerCreateInput): Promise<AdBanner> {
  const { data, error } = await supabase
    .from('ad_banners')
    .insert({
      title: input.title,
      advertiser_name: input.advertiser_name,
      image_url: input.image_url,
      link_url: input.link_url,
      sort_order: input.sort_order ?? 0,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      is_visible: input.is_visible ?? true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as AdBanner
}

// 광고 배너 수정
export async function updateAdBanner(
  id: string,
  input: AdBannerUpdateInput
): Promise<AdBanner> {
  const { data, error } = await supabase
    .from('ad_banners')
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

  return data as AdBanner
}

// 광고 배너 삭제
export async function deleteAdBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from('ad_banners')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// 광고 배너 공개/비공개 토글
export async function toggleAdBannerVisibility(
  id: string,
  isVisible: boolean
): Promise<AdBanner> {
  return updateAdBanner(id, { is_visible: isVisible })
}

// 광고 배너 순서 변경
export async function updateAdBannerSortOrder(
  id: string,
  sortOrder: number
): Promise<AdBanner> {
  return updateAdBanner(id, { sort_order: sortOrder })
}
