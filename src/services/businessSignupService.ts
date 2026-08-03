import { supabase } from '@/lib/supabase'

// The signup request table and approval RPC are introduced by the matching
// migration and are not present in the checked-in generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const signupSchema = supabase as any

export type BusinessSignupStatus = 'pending' | 'approved' | 'rejected'

export interface BusinessSignupRequest {
  id: string
  auth_user_id: string
  owner_code: string | null
  email: string
  business_name: string
  business_number: string
  representative: string
  contact_name: string
  contact_phone: string
  status: BusinessSignupStatus
  matched_business_owner_id: string | null
  reviewed_at: string | null
  created_at: string
}

export async function getBusinessSignupRequests(): Promise<BusinessSignupRequest[]> {
  const { data, error } = await signupSchema
    .from('business_owner_signup_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as BusinessSignupRequest[]
}

export async function getBusinessSignupRequestsByOwnerCode(ownerCode: string): Promise<BusinessSignupRequest[]> {
  const { data, error } = await signupSchema
    .from('business_owner_signup_requests')
    .select('*')
    .eq('owner_code', ownerCode)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as BusinessSignupRequest[]
}

export async function approveBusinessSignup(requestId: string, businessOwnerId: string): Promise<void> {
  const { data, error } = await signupSchema.rpc('approve_business_owner_signup', {
    p_request_id: requestId,
    p_business_owner_id: businessOwnerId,
  })

  if (error) throw new Error(error.message)
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
