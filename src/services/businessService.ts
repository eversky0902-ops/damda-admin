import { supabase } from '@/lib/supabase'
import type { Business } from '@/types'

// Generated database types predate the additive businesses migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const businessDb = supabase as any

export interface BusinessInput {
  name: string
  business_number?: string
  representative?: string
  contact_name?: string
  contact_phone?: string
  email?: string
  address: string
  address_detail?: string
  zipcode?: string
  summary?: string
  introduction?: string
  parking_available?: boolean
  parking_notice?: string
  facilities?: string[]
  common_guide?: string
  common_precautions?: string
  latitude?: number | null
  longitude?: number | null
  directions?: string
  status?: 'active' | 'inactive'
}

export async function getBusinessesByOwner(ownerId: string): Promise<Business[]> {
  const { data, error } = await businessDb.from('businesses')
    .select('*, products(count), business_place_profiles(directions)')
    .eq('business_owner_id', ownerId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map((row: Business & { products?: Array<{ count: number }>; business_place_profiles?: { directions?: string | null } | null }) => ({
    ...row,
    product_count: row.products?.[0]?.count || 0,
    directions: row.business_place_profiles?.directions ?? null,
  }))
}

export async function getAllBusinesses(): Promise<Business[]> {
  const { data, error } = await businessDb.from('businesses').select('*').order('name')
  if (error) throw new Error(error.message)
  return (data || []) as Business[]
}

export async function createBusiness(ownerId: string, input: BusinessInput): Promise<Business> {
  const id = crypto.randomUUID()
  const { data, error } = await businessDb.from('businesses').insert({
    id,
    business_owner_id: ownerId,
    business_code: `DAMDA-B-${id.replaceAll('-', '').slice(0, 10).toUpperCase()}`,
    name: input.name.trim(),
    business_number: input.business_number?.replace(/\D/g, '') || null,
    representative: input.representative?.trim() || null,
    contact_name: input.contact_name?.trim() || null,
    contact_phone: input.contact_phone?.replace(/\D/g, '') || null,
    email: input.email?.trim() || null,
    address: input.address.trim(),
    address_detail: input.address_detail?.trim() || null,
    zipcode: input.zipcode?.replace(/\D/g, '') || null,
    summary: input.summary?.trim() || null,
    introduction: input.introduction?.trim() || null,
    parking_available: input.parking_available ?? false,
    parking_notice: input.parking_notice?.trim() || null,
    facilities: input.facilities || [],
    common_guide: input.common_guide?.trim() || null,
    common_precautions: input.common_precautions?.trim() || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    status: input.status || 'active',
    is_primary: false,
  }).select('*').single()
  if (error) throw new Error(error.message)
  const profileResult = await businessDb.from('business_place_profiles').upsert({ business_id: data.id, directions: input.directions?.trim() || null }, { onConflict: 'business_id' })
  if (profileResult.error) throw new Error(profileResult.error.message)
  return data as Business
}

export async function updateBusiness(id: string, ownerId: string, input: BusinessInput): Promise<void> {
  const { error } = await businessDb.from('businesses').update({
    name: input.name.trim(), business_number: input.business_number?.replace(/\D/g, '') || null,
    representative: input.representative?.trim() || null, contact_name: input.contact_name?.trim() || null,
    contact_phone: input.contact_phone?.replace(/\D/g, '') || null, email: input.email?.trim() || null,
    address: input.address.trim(), address_detail: input.address_detail?.trim() || null,
    zipcode: input.zipcode?.replace(/\D/g, '') || null, status: input.status || 'active',
    summary: input.summary?.trim() || null, introduction: input.introduction?.trim() || null,
    parking_available: input.parking_available ?? false, parking_notice: input.parking_notice?.trim() || null,
    facilities: input.facilities || [], common_guide: input.common_guide?.trim() || null,
    common_precautions: input.common_precautions?.trim() || null,
    latitude: input.latitude ?? null, longitude: input.longitude ?? null,
  }).eq('id', id).eq('business_owner_id', ownerId)
  if (error) throw new Error(error.message)
  const profileResult = await businessDb.from('business_place_profiles').upsert({ business_id: id, directions: input.directions?.trim() || null }, { onConflict: 'business_id' })
  if (profileResult.error) throw new Error(profileResult.error.message)
}

export async function deleteBusiness(id: string, name: string): Promise<void> {
  const { error } = await businessDb.rpc('delete_business_safely', { p_business_id: id, p_confirmation_name: name })
  if (error) {
    if (error.message.includes('BUSINESS_HAS_RELATED_DATA_OR_IS_PRIMARY')) throw new Error('기본 사업장이거나 상품·예약 데이터가 연결되어 있어 삭제할 수 없습니다.')
    throw new Error(error.message)
  }
}
