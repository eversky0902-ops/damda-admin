import { supabase } from '@/lib/supabase'
import { logCreate, logUpdate, logDelete } from '@/services/adminLogService'
import type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryFilter,
  PaginationParams,
} from '@/types'

// 카테고리 목록 조회 (계층 구조 포함)
export async function getCategories(
  params?: PaginationParams & CategoryFilter
): Promise<{ data: Category[]; total: number }> {
  let query = supabase
    .from('categories')
    .select('*', { count: 'exact' })

  // 깊이 필터
  if (params?.depth) {
    query = query.eq('depth', params.depth)
  }

  // 부모 카테고리 필터
  if (params?.parentId) {
    query = query.eq('parent_id', params.parentId)
  } else if (params?.depth === undefined && params?.parentId === undefined) {
    // 기본: 최상위 카테고리만
  }

  // 상태 필터
  if (params?.status === 'active') {
    query = query.eq('is_active', true)
  } else if (params?.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  // 검색
  if (params?.search) {
    query = query.ilike('name', `%${params.search}%`)
  }

  // 정렬
  query = query.order('depth', { ascending: true }).order('sort_order', { ascending: true }).order('name', { ascending: true })

  // 페이지네이션
  if (params?.page && params?.pageSize) {
    const from = (params.page - 1) * params.pageSize
    const to = from + params.pageSize - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as Category[]) || [],
    total: count || 0,
  }
}

// 모든 카테고리 조회 (트리 구조용)
export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('depth', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as Category[]) || []
}

// 카테고리 트리 구조로 변환
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  // 먼저 모든 카테고리를 맵에 추가
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] })
  })

  // 부모-자식 관계 설정
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id)!
    if (cat.parent_id && categoryMap.has(cat.parent_id)) {
      const parent = categoryMap.get(cat.parent_id)!
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

// 카테고리 상세 조회
export async function getCategory(id: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Category
}

// 카테고리 상세 조회 (부모 정보 포함)
export async function getCategoryWithParent(id: string): Promise<CategoryWithParent> {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      parent:parent_id(id, name, depth)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as CategoryWithParent
}

export interface CategoryWithParent extends Category {
  parent: {
    id: string
    name: string
    depth: number
  } | null
}

// 하위 카테고리 조회
export async function getChildCategories(parentId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as Category[]) || []
}

// 카테고리 생성
export async function createCategory(input: CategoryCreateInput): Promise<Category> {
  // 기존 형제 카테고리들의 sort_order를 +1씩 증가 (새 카테고리가 0으로 맨 앞에 오도록)
  const siblingQuery = input.parent_id
    ? supabase.from('categories').select('id, sort_order').eq('parent_id', input.parent_id)
    : supabase.from('categories').select('id, sort_order').is('parent_id', null)

  const { data: siblings } = await siblingQuery

  // 기존 형제들의 sort_order를 +1 증가
  if (siblings && siblings.length > 0) {
    const updates = siblings.map((sibling) =>
      supabase
        .from('categories')
        .update({ sort_order: (sibling.sort_order || 0) + 1 })
        .eq('id', sibling.id)
    )
    await Promise.all(updates)
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name,
      parent_id: input.parent_id || null,
      depth: input.depth,
      sort_order: 0, // 새 카테고리는 항상 0
      is_active: input.is_active ?? true,
      icon_url: input.icon_url || null,
      banner_url: input.banner_url || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logCreate('category', data.id, data as Record<string, unknown>)

  return data as Category
}

// 카테고리 수정
export async function updateCategory(
  id: string,
  input: CategoryUpdateInput
): Promise<Category> {
  // 변경 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('categories')
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
    'category',
    id,
    beforeData as Record<string, unknown>,
    data as Record<string, unknown>
  )

  return data as Category
}

// 카테고리 삭제
export async function deleteCategory(id: string): Promise<void> {
  // 삭제할 카테고리 정보 조회 (parent_id, sort_order 필요)
  const { data: categoryToDelete } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  // 하위 카테고리 확인
  const { count: childCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', id)

  if (childCount && childCount > 0) {
    throw new Error('하위 카테고리가 있어 삭제할 수 없습니다.')
  }

  // 해당 카테고리를 사용하는 상품 확인
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (productCount && productCount > 0) {
    throw new Error('해당 카테고리를 사용하는 상품이 있어 삭제할 수 없습니다.')
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logDelete('category', id, categoryToDelete as Record<string, unknown>)

  // 삭제 후 형제 카테고리들의 sort_order 재정렬
  if (categoryToDelete) {
    // 삭제된 카테고리보다 sort_order가 큰 형제들 조회
    const siblingQuery = categoryToDelete.parent_id
      ? supabase
          .from('categories')
          .select('id, sort_order')
          .eq('parent_id', categoryToDelete.parent_id)
          .gt('sort_order', categoryToDelete.sort_order)
      : supabase
          .from('categories')
          .select('id, sort_order')
          .is('parent_id', null)
          .gt('sort_order', categoryToDelete.sort_order)

    const { data: siblings } = await siblingQuery

    // sort_order를 1씩 감소
    if (siblings && siblings.length > 0) {
      const updates = siblings.map((sibling) =>
        supabase
          .from('categories')
          .update({ sort_order: sibling.sort_order - 1 })
          .eq('id', sibling.id)
      )
      await Promise.all(updates)
    }
  }
}

// 카테고리 상태 변경
export async function updateCategoryStatus(
  id: string,
  isActive: boolean
): Promise<Category> {
  return updateCategory(id, { is_active: isActive })
}

// 카테고리 정렬 순서 변경
export async function updateCategorySortOrder(
  id: string,
  sortOrder: number
): Promise<Category> {
  return updateCategory(id, { sort_order: sortOrder })
}

// 카테고리별 상품 수 조회
export async function getCategoryProductCount(categoryId: string): Promise<number> {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId)

  if (error) {
    throw new Error(error.message)
  }

  return count || 0
}
