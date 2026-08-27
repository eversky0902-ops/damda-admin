import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { LOCAL_TEST_EMAIL, LOCAL_TEST_PASSWORD, loginSalesAgent } from '@/services/salesAgentService'
import { useAuthStore } from '@/stores/authStore'

interface LoginValues { email: string; password: string }

export function SalesLoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (values: LoginValues) => {
    setLoading(true)
    setError('')
    try {
      useAuthStore.getState().logout()
      await loginSalesAgent(values.email.trim(), values.password)
      navigate('/sales/onboardings', { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'linear-gradient(145deg, #123b3a, #1f6865)' }}>
      <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 18px 55px rgba(0,0,0,.22)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.svg" alt="담다" style={{ height: 48, marginBottom: 16 }} />
          <Typography.Title level={3} style={{ marginBottom: 4 }}>영업 파트너 로그인</Typography.Title>
          <Typography.Text type="secondary">승인된 영업사원만 이용할 수 있습니다.</Typography.Text>
        </div>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        {import.meta.env.DEV && (
          <Alert
            type="info"
            showIcon
            message="개발용 테스트 계정"
            description={`${LOCAL_TEST_EMAIL} / ${LOCAL_TEST_PASSWORD}`}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form<LoginValues>
          layout="vertical"
          onFinish={handleLogin}
          requiredMark={false}
          initialValues={import.meta.env.DEV ? { email: LOCAL_TEST_EMAIL, password: LOCAL_TEST_PASSWORD } : undefined}
        >
          <Form.Item name="email" label="이메일" rules={[{ required: true }, { type: 'email' }]}>
            <Input size="large" prefix={<MailOutlined />} autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="비밀번호" rules={[{ required: true }]}>
            <Input.Password size="large" prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>로그인</Button>
        </Form>
      </Card>
    </div>
  )
}
