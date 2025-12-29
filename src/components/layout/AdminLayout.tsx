import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme, Button, Avatar, Dropdown, type MenuProps } from 'antd'
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
  PrinterOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useUIStore } from '@/stores/uiStore'

const { Header, Sider, Content } = Layout

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
    key: '/print-service',
    icon: <PrinterOutlined />,
    label: '행정서비스',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '설정',
  },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

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
      // TODO: 로그아웃 처리
      navigate('/login')
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: sidebarCollapsed ? 16 : 20,
            fontWeight: 700,
            color: '#1890ff',
          }}>
            {sidebarCollapsed ? '담' : '담다 Admin'}
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/content']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
          />
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>관리자</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
