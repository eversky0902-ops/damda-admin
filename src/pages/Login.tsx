import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

interface LoginFormValues {
  email: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((state) => state.setUser)

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        message.error('로그인에 실패했습니다: ' + error.message)
        return
      }

      if (data.user) {
        setUser(data.user)
        message.success('로그인 성공!')
        navigate('/dashboard')
      }
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
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1890ff', margin: 0 }}>
          담다 Admin
        </h1>
        <p style={{ color: '#888', marginTop: 8 }}>관리자 로그인</p>
      </div>

      <Form
        name="login"
        onFinish={handleLogin}
        autoComplete="off"
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: '이메일을 입력해주세요' },
            { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="이메일" />
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
