import { supabase } from '@/lib/supabase'
import { logCreate, logUpdate, logStatusChange } from '@/services/adminLogService'
import type { Daycare, DaycareFilter, DaycareMemo, DaycareCreateInput, DaycareUpdateInput, PaginatedResponse } from '@/types'

interface GetDaycaresParams {
  page: number
  pageSize: number
  filter?: DaycareFilter
}

// 어린이집 목록 조회
export async function getDaycares({
  page,
  pageSize,
  filter,
}: GetDaycaresParams): Promise<PaginatedResponse<Daycare>> {
  const from = (page - 1) * pageSize
  const to = page * pageSize - 1

  let query = supabase
    .from('daycares')
    .select('*', { count: 'exact' })

  // 상태 필터
  if (filter?.status && filter.status !== 'all') {
    query = query.eq('status', filter.status)
  }

  // 검색 필터 (이름, 이메일, 담당자)
  if (filter?.search) {
    query = query.or(
      `name.ilike.%${filter.search}%,email.ilike.%${filter.search}%,contact_name.ilike.%${filter.search}%`
    )
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: data as Daycare[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

// 어린이집 생성
export async function createDaycare(input: DaycareCreateInput): Promise<Daycare> {
  const { data, error } = await supabase
    .from('daycares')
    .insert({
      id: crypto.randomUUID(),
      email: input.email,
      name: input.name,
      representative: input.representative || null,
      contact_name: input.contact_name,
      contact_phone: input.contact_phone,
      business_number: input.business_number || null,
      license_number: input.license_number,
      license_file: input.license_file || '',
      address: input.address,
      address_detail: input.address_detail || null,
      zipcode: input.zipcode || null,
      tel: input.tel || null,
      capacity: input.capacity || null,
      status: 'requested',
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logCreate('daycare', data.id, data as Record<string, unknown>)

  return data as Daycare
}

// 어린이집 상세 조회
export async function getDaycare(id: string): Promise<Daycare> {
  const { data, error } = await supabase
    .from('daycares')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Daycare
}

// 어린이집 상태 변경
export async function updateDaycareStatus(
  id: string,
  status: Daycare['status'],
  options?: {
    rejectionReason?: string
    revisionReason?: string
  }
): Promise<void> {
  // 변경 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('daycares')
    .select('*')
    .eq('id', id)
    .single()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'approved') {
    updateData.approved_at = new Date().toISOString()
    updateData.rejection_reason = null
    updateData.revision_reason = null
  } else if (status === 'rejected') {
    updateData.rejection_reason = options?.rejectionReason || null
    updateData.approved_at = null
    updateData.revision_reason = null
  } else if (status === 'revision_required') {
    updateData.revision_reason = options?.revisionReason || null
    updateData.revision_requested_at = new Date().toISOString()
    updateData.revision_response = null
    updateData.revision_file = null
    updateData.revision_submitted_at = null
    updateData.approved_at = null
    updateData.rejection_reason = null
  }

  const { data: afterData, error } = await supabase
    .from('daycares')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 활동 로그 기록
  await logStatusChange(
    'daycare',
    id,
    beforeData as Record<string, unknown>,
    afterData as Record<string, unknown>
  )
}

// 어린이집 정보 수정
export async function updateDaycare(
  id: string,
  input: DaycareUpdateInput
): Promise<void> {
  // 변경 전 데이터 조회
  const { data: beforeData } = await supabase
    .from('daycares')
    .select('*')
    .eq('id', id)
    .single()

  const { data: afterData, error } = await supabase
    .from('daycares')
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
    'daycare',
    id,
    beforeData as Record<string, unknown>,
    afterData as Record<string, unknown>
  )
}

// 어린이집 메모 목록 조회
export async function getDaycareMemos(daycareId: string): Promise<DaycareMemo[]> {
  const { data, error } = await supabase
    .from('daycare_memos')
    .select(`
      *,
      admin:admins(name)
    `)
    .eq('daycare_id', daycareId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as DaycareMemo[]
}

// 어린이집 메모 추가
export async function addDaycareMemo(
  daycareId: string,
  adminId: string,
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('daycare_memos')
    .insert({
      daycare_id: daycareId,
      admin_id: adminId,
      content,
    })

  if (error) {
    throw new Error(error.message)
  }
}

// 어린이집 메모 삭제
export async function deleteDaycareMemo(memoId: string): Promise<void> {
  const { error } = await supabase
    .from('daycare_memos')
    .delete()
    .eq('id', memoId)

  if (error) {
    throw new Error(error.message)
  }
}
