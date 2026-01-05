import { supabase } from '@/lib/supabase'
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
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name,
      parent_id: input.parent_id || null,
      depth: input.depth,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Category
}

// 카테고리 수정
export async function updateCategory(
  id: string,
  input: CategoryUpdateInput
): Promise<Category> {
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

  return data as Category
}

// 카테고리 삭제
export async function deleteCategory(id: string): Promise<void> {
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
