import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme, Avatar, Dropdown, Modal, Form, Input, message, Drawer, Grid, Button, type MenuProps } from 'antd'
import {
  DashboardOutlined,
  ShopOutlined,
  UserOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  StarOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  DollarOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  LockOutlined,
  FormOutlined,
  UserAddOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { logLogout } from '@/services/adminLogService'
import { changeAdminPassword } from '@/services/adminPasswordService'
import { supabase } from '@/lib/supabase'

const { Sider, Content } = Layout

interface PasswordChangeFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// 메뉴 아이템 정의
const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '대시보드',
  },
  {
    key: 'business-owners',
    icon: <ShopOutlined />,
    label: '사업주 관리',
    children: [
      { key: '/vendors', icon: <ShopOutlined />, label: '사업주 목록' },
      { key: '/business-signups', icon: <UserAddOutlined />, label: '사업주 가입 승인' },
    ],
  },
  {
    key: '/members',
    icon: <UserOutlined />,
    label: '회원 관리',
  },
  {
    key: '/partner-inquiries',
    icon: <FormOutlined />,
    label: '입점문의',
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
    key: '/settlements',
    icon: <DollarOutlined />,
    label: '정산 관리',
  },
  {
    key: '/stats',
    icon: <BarChartOutlined />,
    label: '통계',
    children: [
      { key: '/stats/regional', label: '지역별 월간통계' },
    ],
  },
  {
    key: '/content',
    icon: <FileTextOutlined />,
    label: '컨텐츠 관리',
    children: [
      { key: '/content/notices', label: '공지사항' },
      { key: '/content/faqs', label: 'FAQ' },
      { key: '/content/banners', label: '메인 이미지' },
      { key: '/content/popups', label: '팝업 관리' },
      { key: '/content/ad-banners', label: '광고 배너' },
      { key: '/content/legal-documents', label: '약관/정책 관리' },
      { key: '/content/analytics', label: '홈페이지 방문 통계' },
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

// 현재 경로에 맞는 메뉴 키 찾기
function getSelectedMenuKey(pathname: string): string {
  // 정확히 일치하는 경우
  const exactMatch = menuItems?.find(item => item && 'key' in item && item.key === pathname)
  if (exactMatch) return pathname

  // 하위 메뉴 확인
  for (const item of menuItems || []) {
    if (item && 'children' in item && item.children) {
      const childMatch = item.children.find(child => child && 'key' in child && child.key === pathname)
      if (childMatch && 'key' in childMatch) return childMatch.key as string
      // 하위 메뉴의 하위 경로 확인
      const childPrefixMatch = item.children.find(child =>
        child && 'key' in child && pathname.startsWith(child.key as string + '/')
      )
      if (childPrefixMatch && 'key' in childPrefixMatch) return childPrefixMatch.key as string
    }
  }

  // 상위 메뉴 prefix 매칭 (예: /members/123 → /members)
  const prefixMatch = menuItems?.find(item =>
    item && 'key' in item && typeof item.key === 'string' && pathname.startsWith(item.key + '/')
  )
  if (prefixMatch && 'key' in prefixMatch) return prefixMatch.key as string

  return pathname
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed } = useUIStore()
  const { admin, isAuthenticated, isSessionValid, logout } = useAuthStore()
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordForm] = Form.useForm<PasswordChangeFormValues>()
  const {
    token: { borderRadiusLG },
  } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  // 현재 경로에 맞는 선택된 메뉴 키
  const selectedKey = getSelectedMenuKey(location.pathname)

  // 인증 가드
  useEffect(() => {
    if (!isAuthenticated || !isSessionValid()) {
      logout()
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, isSessionValid, logout, navigate])

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
    setMobileMenuOpen(false)
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '프로필',
    },
    {
      key: 'change-password',
      icon: <LockOutlined />,
      label: '비밀번호 변경',
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

  const handleUserMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === 'change-password') {
      setPasswordModalOpen(true)
      return
    }

    if (key === 'logout') {
      // 로그아웃 활동 로그 기록 (로그아웃 전에 기록해야 adminId를 가져올 수 있음)
      await logLogout()
      logout()
      navigate('/login')
    }
  }

  const handlePasswordModalClose = () => {
    if (passwordChanging) return
    passwordForm.resetFields()
    setPasswordModalOpen(false)
  }

  const handlePasswordChange = async (values: PasswordChangeFormValues) => {
    setPasswordChanging(true)

    try {
      await changeAdminPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      message.success('비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해주세요.')
      passwordForm.resetFields()
      setPasswordModalOpen(false)
      await supabase.auth.signOut()
      logout()
      navigate('/login', { replace: true })
    } catch (error) {
      message.error(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setPasswordChanging(false)
    }
  }

  // 인증되지 않은 경우 렌더링 방지
  if (!isAuthenticated) {
    return null
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && <Sider
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
              selectedKeys={[selectedKey]}
              defaultOpenKeys={['business-owners', '/content']}
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
      </Sider>}
      <Drawer
        title={<img src="/logo.svg" alt="담다" style={{ height: 32 }} />}
        placement="left"
        width={280}
        open={isMobile && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        styles={{ body: { padding: 0, background: '#001529' } }}
      >
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['business-owners', '/content']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, minHeight: '100%' }}
        />
      </Drawer>
      <Layout style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 200), transition: 'all 0.2s', background: '#f5f5f5' }}>
        {isMobile && (
          <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', background: '#001529', position: 'sticky', top: 0, zIndex: 50 }}>
            <Button type="text" icon={<MenuOutlined style={{ color: '#fff', fontSize: 20 }} />} onClick={() => setMobileMenuOpen(true)} />
            <img src="/logo-white.svg" alt="담다" style={{ height: 28 }} />
          </div>
        )}
        <Content
          style={{
            margin: isMobile ? 8 : 16,
            padding: isMobile ? 12 : 16,
            minHeight: isMobile ? 'calc(100vh - 72px)' : 'calc(100vh - 32px)',
            background: '#fff',
            borderRadius: borderRadiusLG,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      <Modal
        title="비밀번호 변경"
        open={passwordModalOpen}
        okText="변경하기"
        cancelText="취소"
        confirmLoading={passwordChanging}
        onOk={() => passwordForm.submit()}
        onCancel={handlePasswordModalClose}
        destroyOnHidden
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          requiredMark={false}
        >
          <Form.Item
            name="currentPassword"
            label="현재 비밀번호"
            rules={[{ required: true, message: '현재 비밀번호를 입력해주세요.' }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="새 비밀번호"
            extra="8자 이상, 영문·숫자·특수문자를 모두 포함해주세요."
            rules={[
              { required: true, message: '새 비밀번호를 입력해주세요.' },
              { min: 8, message: '새 비밀번호는 8자 이상이어야 합니다.' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
                message: '영문, 숫자, 특수문자를 모두 포함해주세요.',
              },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="새 비밀번호 확인"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '새 비밀번호를 한 번 더 입력해주세요.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('새 비밀번호가 일치하지 않습니다.'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}
