import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const navigate = useNavigate()
  const { user, isAuthenticated, setUser, logout } = useAuthStore()

  useEffect(() => {
    // 초기 세션 체크
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  const signOut = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/login')
  }

  return {
    user,
    isAuthenticated,
    signOut,
  }
}
