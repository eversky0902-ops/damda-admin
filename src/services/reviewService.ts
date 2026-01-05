import { supabase } from '@/lib/supabase'
import type { Review, ReviewFilter, PaginationParams } from '@/types'

// 리뷰 목록 조회
export async function getReviews(
  params: PaginationParams & ReviewFilter
): Promise<{ data: Review[]; total: number }> {
  const { page, pageSize, status, featured, rating, search } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('reviews')
    .select(
      `
      *,
      daycare:daycares(id, name, contact_name),
      product:products(id, name, thumbnail),
      images:review_images(id, image_url, sort_order)
    `,
      { count: 'exact' }
    )

  // 공개 상태 필터
  if (status && status !== 'all') {
    query = query.eq('is_visible', status === 'visible')
  }

  // 베스트 리뷰 필터
  if (featured && featured !== 'all') {
    query = query.eq('is_featured', featured === 'featured')
  }

  // 별점 필터
  if (rating && rating !== 'all') {
    query = query.eq('rating', rating)
  }

  // 검색 (상품명 또는 리뷰 내용)
  if (search) {
    query = query.or(`content.ilike.%${search}%`)
  }

  // 정렬 및 페이지네이션
  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as Review[]) || [],
    total: count || 0,
  }
}

// 리뷰 상세 조회
export async function getReview(id: string): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      *,
      daycare:daycares(id, name, contact_name, contact_phone, email),
      product:products(id, name, thumbnail, sale_price, business_owner:business_owners(id, name)),
      images:review_images(id, image_url, sort_order)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Review
}

// 리뷰 공개/비공개 토글
export async function updateReviewVisibility(
  id: string,
  isVisible: boolean
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
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

  return data as Review
}

// 베스트 리뷰 지정/해제
export async function updateReviewFeatured(
  id: string,
  isFeatured: boolean
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      is_featured: isFeatured,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Review
}

// 리뷰 삭제
export async function deleteReview(id: string): Promise<void> {
  // 먼저 리뷰 이미지 삭제
  const { error: imageError } = await supabase
    .from('review_images')
    .delete()
    .eq('review_id', id)

  if (imageError) {
    throw new Error(imageError.message)
  }

  // 리뷰 삭제
  const { error } = await supabase.from('reviews').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// 리뷰 통계 조회
export async function getReviewStats(): Promise<{
  total: number
  visible: number
  hidden: number
  featured: number
  averageRating: number
}> {
  const { data, error, count } = await supabase
    .from('reviews')
    .select('is_visible, is_featured, rating', { count: 'exact' })

  if (error) {
    throw new Error(error.message)
  }

  const reviews = data || []
  const total = count || 0
  const visible = reviews.filter((r) => r.is_visible).length
  const hidden = reviews.filter((r) => !r.is_visible).length
  const featured = reviews.filter((r) => r.is_featured).length
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return {
    total,
    visible,
    hidden,
    featured,
    averageRating: Math.round(averageRating * 10) / 10,
  }
}
