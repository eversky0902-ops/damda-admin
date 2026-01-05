import { supabase } from '@/lib/supabase'
import type {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductOption,
  ProductImage,
  ProductFilter,
  PaginationParams,
  Category,
  BusinessOwner,
} from '@/types'

// 상품 목록 조회
export async function getProducts(
  params: PaginationParams & ProductFilter
): Promise<{ data: Product[]; total: number }> {
  const { page, pageSize, status, search, business_owner_id, category_id } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('products')
    .select(
      `
      *,
      business_owner:business_owners(id, name),
      category:categories(id, name)
    `,
      { count: 'exact' }
    )

  // 상태 필터
  if (status && status !== 'all') {
    if (status === 'visible') {
      query = query.eq('is_visible', true).eq('is_sold_out', false)
    } else if (status === 'hidden') {
      query = query.eq('is_visible', false)
    } else if (status === 'sold_out') {
      query = query.eq('is_sold_out', true)
    }
  }

  // 사업주 필터
  if (business_owner_id) {
    query = query.eq('business_owner_id', business_owner_id)
  }

  // 카테고리 필터
  if (category_id) {
    query = query.eq('category_id', category_id)
  }

  // 검색 (상품명)
  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  // 정렬 및 페이지네이션
  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as Product[]) || [],
    total: count || 0,
  }
}

// 상품 상세 조회
export async function getProduct(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      business_owner:business_owners(id, name, email, contact_phone),
      category:categories(id, name, parent_id)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 옵션 조회
  const { data: options } = await supabase
    .from('product_options')
    .select('*')
    .eq('product_id', id)
    .order('sort_order', { ascending: true })

  // 이미지 조회
  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', id)
    .order('sort_order', { ascending: true })

  return {
    ...data,
    options: options || [],
    images: images || [],
  } as Product
}

// 상품 생성
export async function createProduct(input: ProductCreateInput): Promise<Product> {
  const { options, images, available_time_slots, ...productData } = input

  // 상품 생성
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      ...productData,
      min_participants: productData.min_participants ?? 1,
      is_visible: productData.is_visible ?? true,
      available_time_slots: available_time_slots as unknown as undefined,
    })
    .select()
    .single()

  if (productError) {
    throw new Error(productError.message)
  }

  // 옵션 생성
  if (options && options.length > 0) {
    const optionsData = options.map((option, index) => ({
      product_id: product.id,
      name: option.name,
      price: option.price,
      is_required: option.is_required ?? false,
      sort_order: option.sort_order ?? index,
    }))

    const { error: optionsError } = await supabase.from('product_options').insert(optionsData)

    if (optionsError) {
      // 롤백: 상품 삭제
      await supabase.from('products').delete().eq('id', product.id)
      throw new Error(optionsError.message)
    }
  }

  // 이미지 생성
  if (images && images.length > 0) {
    const imagesData = images.map((image_url, index) => ({
      product_id: product.id,
      image_url,
      sort_order: index,
    }))

    const { error: imagesError } = await supabase.from('product_images').insert(imagesData)

    if (imagesError) {
      // 롤백: 상품 및 옵션 삭제
      await supabase.from('product_options').delete().eq('product_id', product.id)
      await supabase.from('products').delete().eq('id', product.id)
      throw new Error(imagesError.message)
    }
  }

  return product as Product
}

// 상품 수정
export async function updateProduct(id: string, input: ProductUpdateInput): Promise<Product> {
  const { options, images, available_time_slots, ...productData } = input

  // 상품 업데이트
  const { data: product, error: productError } = await supabase
    .from('products')
    .update({
      ...productData,
      available_time_slots: available_time_slots as unknown as undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (productError) {
    throw new Error(productError.message)
  }

  // 옵션 업데이트 (기존 삭제 후 재생성)
  if (options !== undefined) {
    await supabase.from('product_options').delete().eq('product_id', id)

    if (options.length > 0) {
      const optionsData = options.map((option, index) => ({
        id: option.id || undefined,
        product_id: id,
        name: option.name,
        price: option.price,
        is_required: option.is_required ?? false,
        sort_order: option.sort_order ?? index,
      }))

      const { error: optionsError } = await supabase.from('product_options').insert(optionsData)

      if (optionsError) {
        throw new Error(optionsError.message)
      }
    }
  }

  // 이미지 업데이트 (기존 삭제 후 재생성)
  if (images !== undefined) {
    await supabase.from('product_images').delete().eq('product_id', id)

    if (images.length > 0) {
      const imagesData = images.map((image_url, index) => ({
        product_id: id,
        image_url,
        sort_order: index,
      }))

      const { error: imagesError } = await supabase.from('product_images').insert(imagesData)

      if (imagesError) {
        throw new Error(imagesError.message)
      }
    }
  }

  return product as Product
}

// 상품 삭제
export async function deleteProduct(id: string): Promise<void> {
  // 관련 데이터 먼저 삭제
  await supabase.from('product_images').delete().eq('product_id', id)
  await supabase.from('product_options').delete().eq('product_id', id)
  await supabase.from('product_unavailable_dates').delete().eq('product_id', id)

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// 상품 노출 상태 변경
export async function updateProductVisibility(id: string, is_visible: boolean): Promise<Product> {
  return updateProduct(id, { is_visible })
}

// 상품 품절 상태 변경
export async function updateProductSoldOut(id: string, is_sold_out: boolean): Promise<Product> {
  return updateProduct(id, { is_sold_out })
}

// 상품 옵션 조회
export async function getProductOptions(productId: string): Promise<ProductOption[]> {
  const { data, error } = await supabase
    .from('product_options')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as ProductOption[]) || []
}

// 상품 이미지 조회
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as ProductImage[]) || []
}

// 카테고리 목록 조회 (계층구조)
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('depth', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  // 계층 구조로 변환
  const categories = data as Category[]
  const categoryMap = new Map<string, Category>()
  const rootCategories: Category[] = []

  // 먼저 모든 카테고리를 맵에 저장
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  // 부모-자식 관계 설정
  categories.forEach((category) => {
    const current = categoryMap.get(category.id)!
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(current)
      }
    } else {
      rootCategories.push(current)
    }
  })

  return rootCategories
}

// 플랫 카테고리 목록 조회 (선택 옵션용)
export async function getCategoriesFlat(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('depth', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as Category[]) || []
}

// 사업주 목록 조회 (선택 옵션용)
export async function getBusinessOwners(): Promise<Pick<BusinessOwner, 'id' | 'name' | 'email'>[]> {
  const { data, error } = await supabase
    .from('business_owners')
    .select('id, name, email')
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}
