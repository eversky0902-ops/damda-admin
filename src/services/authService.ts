import type { LoginResponse } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface LoginParams {
  loginId: string
  password: string
}

interface LoginResult {
  success: boolean
  data?: LoginResponse
  error?: string
}

export async function login({ loginId, password }: LoginParams): Promise<LoginResult> {
  try {
    // 관리자 내부 ID는 이메일 앞부분으로 저장되어 있습니다.
    // 사용자가 이메일 전체를 입력해도 기존 계정과 동일하게 로그인합니다.
    const normalizedLoginId = loginId.trim().split('@')[0]
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ loginId: normalizedLoginId, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '로그인에 실패했습니다',
      }
    }

    return {
      success: true,
      data: data as LoginResponse,
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: '서버 연결에 실패했습니다',
    }
  }
}
