import { supabase } from '@/lib/supabase'
import { uploadProductImage } from '@/services/storageService'
import { isLocalSalesTestSession } from '@/services/salesAgentService'

// The onboarding tables are introduced by a new migration and are intentionally
// accessed through an untyped client until generated Supabase types are refreshed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onboardingSchema = supabase as any
const LOCAL_ONBOARDINGS_KEY = 'damda.sales.test-onboardings'
const LOCAL_HISTORY_KEY = 'damda.sales.test-onboarding-history'

function readLocalOnboardings(): PartnerOnboarding[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_ONBOARDINGS_KEY) || '[]') as PartnerOnboarding[] }
  catch { return [] }
}

function writeLocalOnboardings(items: PartnerOnboarding[]) {
  localStorage.setItem(LOCAL_ONBOARDINGS_KEY, JSON.stringify(items))
}

function updateLocalOnboarding(id: string, mutate: (item: PartnerOnboarding) => PartnerOnboarding) {
  const items = readLocalOnboardings()
  const index = items.findIndex((item) => item.id === id)
  if (index < 0) throw new Error('테스트 입점 신청을 찾을 수 없습니다.')
  items[index] = mutate(items[index])
  writeLocalOnboardings(items)
}

function addLocalHistory(onboardingId: string, action: string, note?: string) {
  const history = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]') as Array<PartnerOnboardingHistory & { onboarding_id: string }>
  history.unshift({ id: crypto.randomUUID(), onboarding_id: onboardingId, action, note: note || null, created_at: new Date().toISOString() })
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history))
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'))
    reader.readAsDataURL(file)
  })
}

export type PartnerOnboardingStatus =
  | 'draft'
  | 'submitted'
  | 'contract_pending'
  | 'contract_in_progress'
  | 'under_review'
  | 'revision_requested'
  | 'ready_for_approval'
  | 'approving'
  | 'approved'
  | 'rejected'
  | 'failed'

export type PartnerContractStatus =
  | 'not_sent'
  | 'send_requested'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'failed'

export interface PartnerOnboarding {
  id: string
  status: PartnerOnboardingStatus
  contract_status: PartnerContractStatus
  contract_external_id: string | null
  contract_sent_at: string | null
  contract_completed_at: string | null
  signup_request_id: string | null
  business_owner_id: string | null
  owner_code: string
  business_name: string
  business_number: string
  representative: string
  contact_name: string
  contact_phone: string
  email: string
  address: string
  address_detail: string | null
  zipcode: string | null
  bank_name: string | null
  bank_account: string | null
  bank_holder: string | null
  tax_email: string | null
  commission_rate: number
  sales_manager_name: string | null
  sales_agent_id: string | null
  review_note: string | null
  revision_note: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  products?: PartnerOnboardingProduct[]
  documents?: PartnerOnboardingDocument[]
  signup_request?: PartnerSignupCandidate | null
}

export interface PartnerOnboardingInput {
  business_name: string
  business_number: string
  representative: string
  contact_name: string
  contact_phone: string
  email: string
  address: string
  address_detail?: string
  zipcode?: string
  bank_name?: string
  bank_account?: string
  bank_holder?: string
  tax_email?: string
  commission_rate?: number
  sales_manager_name?: string
}

export interface PartnerOnboardingDocument {
  id: string
  onboarding_id: string
  document_type: 'business_registration' | 'bank_account'
  storage_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  created_at: string
  preview_url?: string
}

export interface PartnerProductOption {
  name: string
  price: number
  is_required?: boolean
  sort_order?: number
}

export interface PartnerOnboardingProduct {
  id: string
  onboarding_id: string
  category_id: string | null
  name: string
  summary: string | null
  description: string | null
  thumbnail: string
  image_urls: string[]
  original_price: number
  sale_price: number
  min_participants: number
  max_participants: number
  duration_minutes: number | null
  address: string | null
  address_detail: string | null
  region: string | null
  options: PartnerProductOption[]
  sort_order: number
  created_at: string
}

export type PartnerOnboardingProductInput = Omit<
  PartnerOnboardingProduct,
  'id' | 'onboarding_id' | 'created_at'
>

export interface PartnerSignupCandidate {
  id: string
  auth_user_id: string
  email: string
  business_name: string
  business_number: string
  representative: string
  contact_name: string
  contact_phone: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface PartnerOnboardingHistory {
  id: string
  action: string
  note: string | null
  created_at: string
}

function normalizeInput(input: PartnerOnboardingInput) {
  return {
    ...input,
    business_number: input.business_number.replace(/\D/g, ''),
    contact_phone: input.contact_phone.replace(/\D/g, ''),
    bank_account: input.bank_account?.replace(/\D/g, '') || null,
    address_detail: input.address_detail || null,
    zipcode: input.zipcode || null,
    bank_name: input.bank_name || null,
    bank_holder: input.bank_holder || null,
    tax_email: input.tax_email || null,
    sales_manager_name: input.sales_manager_name || null,
    commission_rate: input.commission_rate ?? 10,
  }
}

export async function getPartnerOnboardings(filters?: {
  search?: string
  status?: PartnerOnboardingStatus | 'all'
}): Promise<PartnerOnboarding[]> {
  if (isLocalSalesTestSession()) {
    const keyword = filters?.search?.trim().toLowerCase()
    return readLocalOnboardings().filter((item) =>
      (!filters?.status || filters.status === 'all' || item.status === filters.status) &&
      (!keyword || [item.business_name, item.business_number, item.contact_name].some((value) => value.toLowerCase().includes(keyword)))
    )
  }
  let query = onboardingSchema
    .from('partner_onboardings')
    .select('*, products:partner_onboarding_products(id), documents:partner_onboarding_documents(id, document_type)')
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters?.search?.trim()) {
    const keyword = filters.search.trim()
    query = query.or(`business_name.ilike.%${keyword}%,business_number.ilike.%${keyword}%,contact_name.ilike.%${keyword}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as PartnerOnboarding[]
}

export async function getPartnerOnboarding(id: string): Promise<PartnerOnboarding> {
  if (isLocalSalesTestSession()) {
    const item = readLocalOnboardings().find((candidate) => candidate.id === id)
    if (!item) throw new Error('테스트 입점 신청을 찾을 수 없습니다.')
    return item
  }
  const { data, error } = await onboardingSchema
    .from('partner_onboardings')
    .select(`
      *,
      products:partner_onboarding_products(*),
      documents:partner_onboarding_documents(*),
      signup_request:business_owner_signup_requests(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  const result = data as PartnerOnboarding
  if (result.documents?.length) {
    result.documents = await Promise.all(result.documents.map(async (document) => {
      const { data: signed } = await supabase.storage
        .from('partner-onboarding-documents')
        .createSignedUrl(document.storage_path, 3600)
      return { ...document, preview_url: signed?.signedUrl }
    }))
  }
  return result
}

export async function createPartnerOnboarding(input: PartnerOnboardingInput): Promise<PartnerOnboarding> {
  if (isLocalSalesTestSession()) {
    const now = new Date().toISOString()
    const item: PartnerOnboarding = {
      ...normalizeInput(input), id: crypto.randomUUID(), status: 'draft', contract_status: 'not_sent',
      contract_external_id: null, contract_sent_at: null, contract_completed_at: null, signup_request_id: null,
      business_owner_id: null, owner_code: `TEST-${Date.now().toString().slice(-6)}`, sales_agent_id: 'local-sales-test',
      review_note: null, revision_note: null, approved_at: null, created_at: now, updated_at: now,
      products: [], documents: [], signup_request: null,
    }
    writeLocalOnboardings([item, ...readLocalOnboardings()])
    addLocalHistory(item.id, 'created', '개발용 테스트 신청 생성')
    return item
  }
  const { data: { user } } = await supabase.auth.getUser()
  const { data: salesAgent } = user
    ? await onboardingSchema.from('sales_agents').select('id').eq('id', user.id).maybeSingle()
    : { data: null }
  const { data, error } = await onboardingSchema
    .from('partner_onboardings')
    .insert({
      ...normalizeInput(input),
      created_by: salesAgent ? null : user?.id || null,
      sales_agent_id: salesAgent ? user?.id : null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PartnerOnboarding
}

export async function updatePartnerOnboarding(
  id: string,
  input: Partial<PartnerOnboardingInput> & Partial<Pick<PartnerOnboarding, 'status' | 'contract_status' | 'review_note' | 'revision_note' | 'signup_request_id'>>,
): Promise<void> {
  if (isLocalSalesTestSession()) {
    updateLocalOnboarding(id, (item) => ({ ...item, ...input, updated_at: new Date().toISOString() }))
    addLocalHistory(id, 'updated', '기본정보 또는 상태 변경')
    return
  }
  const payload: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() }
  if (input.business_number) payload.business_number = input.business_number.replace(/\D/g, '')
  if (input.contact_phone) payload.contact_phone = input.contact_phone.replace(/\D/g, '')
  if (input.bank_account) payload.bank_account = input.bank_account.replace(/\D/g, '')
  const { error } = await onboardingSchema.from('partner_onboardings').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadPartnerDocument(
  onboardingId: string,
  documentType: PartnerOnboardingDocument['document_type'],
  file: File,
): Promise<void> {
  if (isLocalSalesTestSession()) {
    const previewUrl = await fileToDataUrl(file)
    updateLocalOnboarding(onboardingId, (item) => ({
      ...item,
      documents: [
        ...(item.documents || []).filter((document) => document.document_type !== documentType),
        { id: crypto.randomUUID(), onboarding_id: onboardingId, document_type: documentType, storage_path: previewUrl, file_name: file.name, file_size: file.size, mime_type: file.type, created_at: new Date().toISOString(), preview_url: previewUrl },
      ],
      updated_at: new Date().toISOString(),
    }))
    addLocalHistory(onboardingId, 'document_uploaded', file.name)
    return
  }
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const storagePath = `${onboardingId}/${documentType}-${Date.now()}.${extension}`
  const { error: uploadError } = await supabase.storage
    .from('partner-onboarding-documents')
    .upload(storagePath, file, { upsert: true, contentType: file.type })
  if (uploadError) throw new Error(uploadError.message)

  const { data: previous } = await onboardingSchema
    .from('partner_onboarding_documents')
    .select('storage_path')
    .eq('onboarding_id', onboardingId)
    .eq('document_type', documentType)
    .maybeSingle()

  const { error } = await onboardingSchema.from('partner_onboarding_documents').upsert({
    onboarding_id: onboardingId,
    document_type: documentType,
    storage_path: storagePath,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
  }, { onConflict: 'onboarding_id,document_type' })

  if (error) {
    await supabase.storage.from('partner-onboarding-documents').remove([storagePath])
    throw new Error(error.message)
  }
  if (previous?.storage_path && previous.storage_path !== storagePath) {
    await supabase.storage.from('partner-onboarding-documents').remove([previous.storage_path])
  }
}

export async function addPartnerProduct(
  onboardingId: string,
  input: PartnerOnboardingProductInput,
): Promise<void> {
  if (isLocalSalesTestSession()) {
    updateLocalOnboarding(onboardingId, (item) => ({ ...item, products: [...(item.products || []), { ...input, id: crypto.randomUUID(), onboarding_id: onboardingId, created_at: new Date().toISOString() }], updated_at: new Date().toISOString() }))
    addLocalHistory(onboardingId, 'product_added', input.name)
    return
  }
  const { error } = await onboardingSchema.from('partner_onboarding_products').insert({
    ...input,
    onboarding_id: onboardingId,
  })
  if (error) throw new Error(error.message)
}

export async function updatePartnerProduct(id: string, input: PartnerOnboardingProductInput): Promise<void> {
  if (isLocalSalesTestSession()) {
    const items = readLocalOnboardings()
    const owner = items.find((item) => item.products?.some((product) => product.id === id))
    if (!owner) throw new Error('테스트 상품을 찾을 수 없습니다.')
    updateLocalOnboarding(owner.id, (item) => ({ ...item, products: item.products?.map((product) => product.id === id ? { ...product, ...input } : product) }))
    return
  }
  const { error } = await onboardingSchema
    .from('partner_onboarding_products')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deletePartnerProduct(id: string): Promise<void> {
  if (isLocalSalesTestSession()) {
    const owner = readLocalOnboardings().find((item) => item.products?.some((product) => product.id === id))
    if (!owner) return
    updateLocalOnboarding(owner.id, (item) => ({ ...item, products: item.products?.filter((product) => product.id !== id) }))
    return
  }
  const { error } = await onboardingSchema.from('partner_onboarding_products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadPartnerProductImage(file: File): Promise<string> {
  if (isLocalSalesTestSession()) return fileToDataUrl(file)
  return uploadProductImage(file)
}

export async function getSignupCandidates(businessNumber: string, ownerCode: string): Promise<PartnerSignupCandidate[]> {
  if (isLocalSalesTestSession()) return []
  const normalized = businessNumber.replace(/\D/g, '')
  if (normalized.length !== 10) return []
  const { data, error } = await onboardingSchema
    .from('business_owner_signup_requests')
    .select('*')
    .eq('business_number', normalized)
    .eq('owner_code', ownerCode)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []) as PartnerSignupCandidate[]
}

export async function linkSignupRequest(onboardingId: string, requestId: string): Promise<void> {
  await updatePartnerOnboarding(onboardingId, { signup_request_id: requestId })
}

export async function requestPartnerContract(onboardingId: string): Promise<void> {
  if (isLocalSalesTestSession()) {
    updateLocalOnboarding(onboardingId, (item) => ({ ...item, contract_status: 'send_requested', status: 'contract_pending', updated_at: new Date().toISOString() }))
    addLocalHistory(onboardingId, 'contract_send_requested', '싸인오케이 API 연동 대기')
    return
  }
  const { error } = await onboardingSchema.from('partner_onboardings').update({
    contract_status: 'send_requested',
    status: 'contract_pending',
    updated_at: new Date().toISOString(),
  }).eq('id', onboardingId)
  if (error) throw new Error(error.message)

  const { data: { user } } = await supabase.auth.getUser()
  await onboardingSchema.from('partner_onboarding_history').insert({
    onboarding_id: onboardingId,
    action: 'contract_send_requested',
    note: '싸인오케이 API 연동 대기',
    actor_id: user?.id || null,
  })
}

export async function requestPartnerRevision(onboardingId: string, note: string): Promise<void> {
  await updatePartnerOnboarding(onboardingId, {
    status: 'revision_requested',
    revision_note: note,
  })
}

export async function markPartnerReady(onboardingId: string, reviewNote?: string): Promise<void> {
  await updatePartnerOnboarding(onboardingId, {
    status: 'ready_for_approval',
    review_note: reviewNote || null,
  })
}

export async function approvePartnerOnboarding(onboardingId: string): Promise<string> {
  if (isLocalSalesTestSession()) {
    const ownerId = `test-owner-${Date.now()}`
    updateLocalOnboarding(onboardingId, (item) => ({ ...item, status: 'approved', business_owner_id: ownerId, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }))
    addLocalHistory(onboardingId, 'approved', '개발용 승인 처리')
    return ownerId
  }
  const { data, error } = await onboardingSchema.rpc('approve_partner_onboarding', {
    p_onboarding_id: onboardingId,
  })
  if (error) throw new Error(error.message)
  if (!data?.success) throw new Error('입점 승인 처리에 실패했습니다.')
  return data.business_owner_id as string
}

export async function getPartnerOnboardingHistory(id: string): Promise<PartnerOnboardingHistory[]> {
  if (isLocalSalesTestSession()) {
    const history = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]') as Array<PartnerOnboardingHistory & { onboarding_id: string }>
    return history.filter((item) => item.onboarding_id === id)
  }
  const { data, error } = await onboardingSchema
    .from('partner_onboarding_history')
    .select('*')
    .eq('onboarding_id', id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []) as PartnerOnboardingHistory[]
}
