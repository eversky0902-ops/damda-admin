import { supabase } from '@/lib/supabase'
import type {
  BusinessOwner,
  BusinessOwnerCreateInput,
  BusinessOwnerUpdateInput,
  Settlement,
  CommissionHistory,
  VendorFilter,
  PaginationParams,
} from '@/types'

// 사업주 목록 조회
export async function getVendors(
  params: PaginationParams & VendorFilter
): Promise<{ data: BusinessOwner[]; total: number }> {
  const { page, pageSize, status, search } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('business_owners')
    .select('*', { count: 'exact' })

  // 상태 필터
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // 검색 (사업자명, 사업자번호)
  if (search) {
    query = query.or(`name.ilike.%${search}%,business_number.ilike.%${search}%`)
  }

  // 정렬 및 페이지네이션
  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as BusinessOwner[]) || [],
    total: count || 0,
  }
}

// 사업주 상세 조회
export async function getVendor(id: string): Promise<BusinessOwner> {
  const { data, error } = await supabase
    .from('business_owners')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as BusinessOwner
}

// 사업주 생성
export async function createVendor(input: BusinessOwnerCreateInput): Promise<BusinessOwner> {
  // Supabase Auth로 사용자 생성 후 business_owners에 추가
  // 관리자가 생성하는 경우 임시 비밀번호 설정
  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) {
    throw new Error(authError.message)
  }

  // user_roles에 역할 추가
  const { error: roleError } = await supabase.from('user_roles').insert({
    id: authData.user.id,
    role: 'business_owner',
  })

  if (roleError) {
    // 롤백: auth 사용자 삭제
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw new Error(roleError.message)
  }

  // business_owners에 데이터 추가
  const { data, error } = await supabase
    .from('business_owners')
    .insert({
      id: authData.user.id,
      email: input.email,
      name: input.name,
      business_number: input.business_number,
      representative: input.representative,
      contact_name: input.contact_name,
      contact_phone: input.contact_phone,
      address: input.address,
      address_detail: input.address_detail || null,
      zipcode: input.zipcode || null,
      bank_name: input.bank_name || null,
      bank_account: input.bank_account || null,
      bank_holder: input.bank_holder || null,
      logo_url: input.logo_url || null,
      commission_rate: input.commission_rate ?? 10,
    })
    .select()
    .single()

  if (error) {
    // 롤백
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw new Error(error.message)
  }

  return data as BusinessOwner
}

// 사업주 수정
export async function updateVendor(
  id: string,
  input: BusinessOwnerUpdateInput
): Promise<BusinessOwner> {
  const { data, error } = await supabase
    .from('business_owners')
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

  return data as BusinessOwner
}

// 사업주 상태 변경
export async function updateVendorStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<BusinessOwner> {
  return updateVendor(id, { status })
}

// 정산 내역 조회
export async function getSettlements(
  vendorId: string,
  params?: PaginationParams
): Promise<{ data: Settlement[]; total: number }> {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('settlements')
    .select('*', { count: 'exact' })
    .eq('business_owner_id', vendorId)
    .order('settlement_period_end', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    data: (data as Settlement[]) || [],
    total: count || 0,
  }
}

// 수수료 변경 이력 조회
export async function getCommissionHistories(
  vendorId: string
): Promise<CommissionHistory[]> {
  const { data, error } = await supabase
    .from('commission_histories')
    .select(`
      *,
      admin:changed_by(name)
    `)
    .eq('business_owner_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as CommissionHistory[]) || []
}

// 수수료율 변경
export async function updateCommissionRate(
  vendorId: string,
  newRate: number,
  reason: string,
  adminId: string
): Promise<void> {
  // 현재 수수료율 조회
  const vendor = await getVendor(vendorId)
  const previousRate = vendor.commission_rate

  // 수수료 변경 이력 추가
  const { error: historyError } = await supabase.from('commission_histories').insert({
    business_owner_id: vendorId,
    previous_rate: previousRate,
    new_rate: newRate,
    effective_date: new Date().toISOString().split('T')[0],
    changed_by: adminId,
    reason,
  })

  if (historyError) {
    throw new Error(historyError.message)
  }

  // 사업주 수수료율 업데이트
  const { error: updateError } = await supabase
    .from('business_owners')
    .update({
      commission_rate: newRate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vendorId)

  if (updateError) {
    throw new Error(updateError.message)
  }
}

// 전체 사업주 목록 조회 (엑셀 다운로드용)
export async function getAllVendors(): Promise<BusinessOwner[]> {
  const { data, error } = await supabase
    .from('business_owners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as BusinessOwner[]) || []
}

// 사업주 대량 생성 (엑셀 업로드용)
export async function createVendorsBulk(
  inputs: BusinessOwnerCreateInput[]
): Promise<{ success: number; failed: { row: number; error: string }[] }> {
  const results = {
    success: 0,
    failed: [] as { row: number; error: string }[],
  }

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
    try {
      await createVendor(input)
      results.success++
    } catch (error) {
      results.failed.push({
        row: i + 2, // 엑셀에서 헤더가 1행이므로 데이터는 2행부터
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      })
    }
  }

  return results
}
