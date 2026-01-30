import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { login } from '@/services/authService'
import { logLogin } from '@/services/adminLogService'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

interface LoginFormValues {
  loginId: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true)
    try {
      const result = await login(values)

      if (!result.success || !result.data) {
        message.error(result.error || '로그인에 실패했습니다')
        return
      }

      // Supabase Auth 세션 설정
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.data.session.access_token,
        refresh_token: result.data.session.refresh_token,
      })

      if (sessionError) {
        console.error('Session error:', sessionError)
        message.error('세션 설정에 실패했습니다')
        return
      }

      setAuth(result.data.admin, result.data.session)

      // 로그인 활동 로그 기록
      await logLogin(result.data.admin.id)

      message.success(`${result.data.admin.name}님, 환영합니다!`)
      navigate('/dashboard')
    } catch (err) {
      message.error('로그인 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      style={{
        width: 400,
        background: '#3d3d3d',
        border: '1px solid #4a4a4a',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img
          src="/logo-white.svg"
          alt="담다"
          style={{ height: 48, marginBottom: 12 }}
        />
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 14 }}>
          관리자 로그인
        </p>
      </div>

      <Form
        name="login"
        onFinish={handleLogin}
        autoComplete="off"
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="loginId"
          rules={[{ required: true, message: '아이디를 입력해주세요' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="아이디" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            로그인
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
