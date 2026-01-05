import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme, Avatar, Dropdown, type MenuProps } from 'antd'
import {
  DashboardOutlined,
  ShopOutlined,
  UserOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  StarOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'

const { Sider, Content } = Layout

// 메뉴 아이템 정의
const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '대시보드',
  },
  {
    key: '/vendors',
    icon: <ShopOutlined />,
    label: '사업주 관리',
  },
  {
    key: '/members',
    icon: <UserOutlined />,
    label: '회원 관리',
  },
  {
    key: '/products',
    icon: <ShoppingOutlined />,
    label: '상품 관리',
  },
  {
    key: '/categories',
    icon: <AppstoreOutlined />,
    label: '카테고리 관리',
  },
  {
    key: '/reviews',
    icon: <StarOutlined />,
    label: '리뷰 관리',
  },
  {
    key: '/reservations',
    icon: <CalendarOutlined />,
    label: '예약 관리',
  },
  {
    key: '/payments',
    icon: <CreditCardOutlined />,
    label: '결제 관리',
  },
  {
    key: '/content',
    icon: <FileTextOutlined />,
    label: '컨텐츠 관리',
    children: [
      { key: '/content/notices', label: '공지사항' },
      { key: '/content/faqs', label: 'FAQ' },
      { key: '/content/banners', label: '배너 관리' },
      { key: '/content/popups', label: '팝업 관리' },
      { key: '/content/inquiries', label: '1:1 문의' },
    ],
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '설정',
    children: [
      { key: '/settings/service', label: '서비스 설정' },
      { key: '/settings/logs', label: '활동 로그' },
    ],
  },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed } = useUIStore()
  const { admin, isAuthenticated, isSessionValid, logout } = useAuthStore()
  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  // 인증 가드
  useEffect(() => {
    if (!isAuthenticated || !isSessionValid()) {
      logout()
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, isSessionValid, logout, navigate])

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '프로필',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      danger: true,
    },
  ]

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    }
  }

  // 인증되지 않은 경우 렌더링 방지
  if (!isAuthenticated) {
    return null
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        theme="dark"
        style={{
          overflow: 'hidden',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          <div style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0,
          }}>
            <img
              src="/logo-white.svg"
              alt="담다"
              style={{
                height: sidebarCollapsed ? 28 : 36,
                transition: 'height 0.2s',
              }}
            />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Menu
              mode="inline"
              theme="dark"
              selectedKeys={[location.pathname]}
              defaultOpenKeys={['/content']}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ borderRight: 0 }}
            />
          </div>
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: sidebarCollapsed ? '12px 8px' : '12px 16px',
            flexShrink: 0,
          }}>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="topRight" trigger={['click']}>
              <div style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px',
                borderRadius: 6,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar size={sidebarCollapsed ? 32 : 36} icon={<UserOutlined />} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && (
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {admin?.name || '관리자'}
                    </div>
                    {admin?.role === 'super_admin' && (
                      <div style={{ fontSize: 12, color: '#F8B737' }}>최고관리자</div>
                    )}
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </div>
      </Sider>
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 200, transition: 'all 0.2s', background: '#f5f5f5' }}>
        <Content
          style={{
            margin: 16,
            padding: 16,
            minHeight: 'calc(100vh - 32px)',
            background: '#fff',
            borderRadius: borderRadiusLG,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
