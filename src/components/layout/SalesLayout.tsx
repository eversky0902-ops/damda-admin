import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button, Layout, Menu, Spin, Typography } from 'antd'
import { FileAddOutlined, LogoutOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons'
import { getCurrentSalesAgent, logoutSalesAgent, type SalesAgent } from '@/services/salesAgentService'

const { Header, Content } = Layout

export function SalesLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [agent, setAgent] = useState<SalesAgent | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    getCurrentSalesAgent().then((current) => {
      if (!current) navigate('/sales/login', { replace: true })
      else setAgent(current)
    }).finally(() => setChecking(false))
  }, [navigate])

  if (checking) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><Spin size="large" /></div>
  if (!agent) return null

  const selectedKey = location.pathname.includes('/new') ? '/sales/onboardings/new' : '/sales/onboardings'

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7f8' }}>
      <Header style={{ height: 64, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 16, background: '#123b3a' }}>
        <img src="/logo-white.svg" alt="담다" style={{ height: 30 }} />
        <Typography.Text style={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>영업 파트너</Typography.Text>
        <div style={{ flex: 1 }} />
        <Typography.Text style={{ color: 'rgba(255,255,255,.82)' }}><UserOutlined /> {agent.name}</Typography.Text>
        <Button
          type="text"
          icon={<LogoutOutlined style={{ color: '#fff' }} />}
          aria-label="로그아웃"
          onClick={async () => { await logoutSalesAgent(); navigate('/sales/login', { replace: true }) }}
        />
      </Header>
      <Menu
        mode="horizontal"
        selectedKeys={[selectedKey]}
        items={[
          { key: '/sales/onboardings', icon: <UnorderedListOutlined />, label: '내 입점 신청' },
          { key: '/sales/onboardings/new', icon: <FileAddOutlined />, label: '신규 현장 접수' },
        ]}
        onClick={({ key }) => navigate(key)}
        style={{ position: 'sticky', top: 0, zIndex: 30, paddingInline: 8 }}
      />
      <Content style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '16px 12px 88px' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
