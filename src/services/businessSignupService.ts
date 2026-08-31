import { supabase } from '@/lib/supabase'

// The signup request table and approval RPC are introduced by the matching
// migration and are not present in the checked-in generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const signupSchema = supabase as any

export type BusinessSignupStatus = 'pending' | 'approved' | 'rejected' | 'on_hold'

export interface BusinessSignupRequest {
  id: string
  auth_user_id: string
  email: string
  business_name: string
  business_number: string
  representative: string
  contact_name: string
  contact_phone: string
  bank_name: string | null
  bank_holder: string | null
  bank_account: string | null
  business_registration_storage_bucket: string | null
  business_registration_storage_path: string | null
  business_registration_file_name: string | null
  business_registration_file_size: number | null
  business_registration_mime_type: string | null
  bank_account_copy_storage_bucket: string | null
  bank_account_copy_storage_path: string | null
  bank_account_copy_file_name: string | null
  bank_account_copy_file_size: number | null
  bank_account_copy_mime_type: string | null
  status: BusinessSignupStatus
  matched_business_owner_id: string | null
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

export async function getBusinessSignupDocumentUrl(bucket: string, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300)
  if (error || !data?.signedUrl) throw new Error('첨부 서류를 열 수 없습니다.')
  return data.signedUrl
}

export async function getBusinessSignupRequests(): Promise<BusinessSignupRequest[]> {
  const { data, error } = await signupSchema
    .from('business_owner_signup_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as BusinessSignupRequest[]
}

export async function getBusinessSignupRequestsByEmail(email: string): Promise<BusinessSignupRequest[]> {
  const { data, error } = await signupSchema
    .from('business_owner_signup_requests')
    .select('*')
    .ilike('email', email.trim())
    .in('status', ['pending', 'on_hold'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as BusinessSignupRequest[]
}

export async function approveBusinessSignup(requestId: string, businessOwnerId: string): Promise<void> {
  const { data, error } = await signupSchema.rpc('approve_business_owner_signup', {
    p_request_id: requestId,
    p_business_owner_id: businessOwnerId,
  })

  if (error) {
    if (error.message.includes('BUSINESS_OWNER_EMAIL_MISMATCH')) {
      throw new Error('가입 이메일과 선택한 사업주의 이메일이 일치하지 않습니다.')
    }
    throw new Error(error.message)
  }
  if (!data?.success) throw new Error('가입 신청 승인에 실패했습니다.')
}

export async function rejectBusinessSignup(requestId: string): Promise<void> {
  const { error } = await signupSchema
    .from('business_owner_signup_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
}

export async function reviewBusinessSignup({
  requestId,
  status,
  reviewNote,
  businessOwnerId,
}: {
  requestId: string
  status: Exclude<BusinessSignupStatus, 'pending'>
  reviewNote: string
  businessOwnerId?: string
}): Promise<void> {
  const { data, error } = await signupSchema.rpc('review_business_owner_signup', {
    p_request_id: requestId,
    p_status: status,
    p_review_note: reviewNote.trim() || null,
    p_business_owner_id: businessOwnerId || null,
  })

  if (error) {
    if (error.message.includes('BUSINESS_OWNER_REQUIRED')) throw new Error('승인완료 처리할 등록 사업자를 선택해주세요.')
    if (error.message.includes('BUSINESS_OWNER_EMAIL_MISMATCH')) throw new Error('가입 이메일과 선택한 사업주의 이메일이 일치하지 않습니다.')
    throw new Error(error.message)
  }
  if (!data?.success) throw new Error('가입 신청 상태 변경에 실패했습니다.')
}
