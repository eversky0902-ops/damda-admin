import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import koKR from 'antd/locale/ko_KR'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

import { router } from '@/router'
import { queryClient } from '@/lib/queryClient'

// dayjs 한국어 설정
dayjs.locale('ko')

function App() {
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
