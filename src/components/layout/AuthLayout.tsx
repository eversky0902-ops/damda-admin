import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'

const { Content } = Layout

export function AuthLayout() {
  return (
    <Layout style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1f1f1f 100%)',
    }}>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  )
}
