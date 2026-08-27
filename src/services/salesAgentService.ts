import { supabase } from '@/lib/supabase'

// Added by the partner-onboarding migration; generated DB types will be refreshed later.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const salesSchema = supabase as any

export interface SalesAgent {
  id: string
  name: string
  phone: string | null
  is_active: boolean
}

const LOCAL_TEST_SESSION_KEY = 'damda.sales.test-session'
export const LOCAL_TEST_EMAIL = 'sales.test@damda.local'
export const LOCAL_TEST_PASSWORD = 'DamdaTest!2026'

export function isLocalSalesTestSession(): boolean {
  return import.meta.env.DEV && localStorage.getItem(LOCAL_TEST_SESSION_KEY) === 'active'
}

export async function loginSalesAgent(email: string, password: string): Promise<SalesAgent> {
  if (import.meta.env.DEV && email === LOCAL_TEST_EMAIL && password === LOCAL_TEST_PASSWORD) {
    localStorage.setItem(LOCAL_TEST_SESSION_KEY, 'active')
    return { id: 'local-sales-test', name: '현장 테스트 영업사원', phone: '01000000000', is_active: true }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')

  const { data: agent, error: agentError } = await salesSchema
    .from('sales_agents')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (agentError || !agent?.is_active) {
    await supabase.auth.signOut()
    throw new Error('활성화된 영업사원 계정이 아닙니다.')
  }
  return agent as SalesAgent
}

export async function getCurrentSalesAgent(): Promise<SalesAgent | null> {
  if (isLocalSalesTestSession()) {
    return { id: 'local-sales-test', name: '현장 테스트 영업사원', phone: '01000000000', is_active: true }
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await salesSchema
    .from('sales_agents')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (error || !data?.is_active) return null
  return data as SalesAgent
}

export async function logoutSalesAgent(): Promise<void> {
  localStorage.removeItem(LOCAL_TEST_SESSION_KEY)
  await supabase.auth.signOut()
}
