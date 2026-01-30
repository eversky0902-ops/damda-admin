import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, Spin } from 'antd'
import koKR from 'antd/locale/ko_KR'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

import { router } from '@/router'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

// dayjs 한국어 설정
dayjs.locale('ko')

function App() {
  const [isInitialized, setIsInitialized] = useState(false)
  const { session, logout } = useAuthStore()

  useEffect(() => {
    const initSession = async () => {
      // authStore에 세션이 있으면 supabase 클라이언트에 설정
      if (session?.access_token && session?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })

        if (error) {
          console.error('Session restore failed:', error)
          logout() // 세션 복원 실패 시 로그아웃
        }
      }
      setIsInitialized(true)
    }

    initSession()

    // Supabase auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, supabaseSession) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (!supabaseSession) {
          logout()
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [session, logout])

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={koKR}
        theme={{
          token: {
            colorPrimary: '#F8B737',
            colorLink: '#34B7B1',
            colorInfo: '#34B7B1',
            borderRadius: 6,
            fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          components: {
            Menu: {
              darkItemSelectedBg: 'rgba(248, 183, 55, 0.2)',
              darkItemSelectedColor: '#F8B737',
              fontWeightStrong: 600,
              itemMarginInline: 8,
            },
            Button: {
              primaryShadow: '0 2px 0 rgba(248, 183, 55, 0.1)',
              colorLink: '#34B7B1',
              colorLinkHover: '#5CC9C4',
              fontWeight: 600,
            },
            Table: {
              headerBg: '#fafafa',
              rowHoverBg: 'rgba(52, 183, 177, 0.06)',
            },
            Tag: {
              defaultBg: 'rgba(52, 183, 177, 0.1)',
              defaultColor: '#34B7B1',
            },
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </QueryClientProvider>
  )
}

export default App
