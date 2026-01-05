import { useEffect } from 'react'
import { Form, Input, InputNumber, Select, Button, Card, Typography, Spin, message, Divider } from 'antd'
import { SaveOutlined, DollarOutlined, CalendarOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllSettings, updateSettings, settingsToObject } from '@/services/settingsService'
import { useAuthStore } from '@/stores/authStore'

const { Text } = Typography

interface SettingsFormValues {
  default_commission_rate: number
  commission_rate_min: number
  commission_rate_max: number
  settlement_cycle: 'weekly' | 'monthly'
  reservation_advance_days: number
  min_reservation_notice: number
  cancellation_d3: number
  cancellation_d2: number
  cancellation_d1: number
  cancellation_d0: number
  service_email: string
  service_phone: string
  business_hours_start: string
  business_hours_end: string
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18, color: '#1677ff' }}>{icon}</span>
        <Text strong style={{ fontSize: 16 }}>
          {title}
        </Text>
      </div>
      <Text type="secondary" style={{ fontSize: 13 }}>
        {description}
      </Text>
    </div>
  )
}

export function ServiceSettingsPage() {
  const [form] = Form.useForm<SettingsFormValues>()
  const queryClient = useQueryClient()
  const { admin } = useAuthStore()

  // 설정 조회
  const { data: settings, isLoading } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: getAllSettings,
  })

  // 폼 초기값 설정
  useEffect(() => {
    if (settings) {
      const obj = settingsToObject(settings)
      const cancellationPolicy = obj.cancellation_policy as Record<string, number> | undefined

      form.setFieldsValue({
        default_commission_rate: obj.default_commission_rate as number,
        commission_rate_min: obj.commission_rate_min as number,
        commission_rate_max: obj.commission_rate_max as number,
        settlement_cycle: obj.settlement_cycle as 'weekly' | 'monthly',
        reservation_advance_days: obj.reservation_advance_days as number,
        min_reservation_notice: obj.min_reservation_notice as number,
        cancellation_d3: cancellationPolicy?.d3 ?? 100,
        cancellation_d2: cancellationPolicy?.d2 ?? 70,
        cancellation_d1: cancellationPolicy?.d1 ?? 50,
        cancellation_d0: cancellationPolicy?.d0 ?? 0,
        service_email: obj.service_email as string,
        service_phone: obj.service_phone as string,
        business_hours_start: (obj.business_hours as { start: string })?.start || '09:00',
        business_hours_end: (obj.business_hours as { end: string })?.end || '18:00',
      })
    }
  }, [settings, form])

  // 설정 저장
  const mutation = useMutation({
    mutationFn: (values: SettingsFormValues) => {
      const settingsToUpdate = {
        default_commission_rate: values.default_commission_rate,
        commission_rate_min: values.commission_rate_min,
        commission_rate_max: values.commission_rate_max,
        settlement_cycle: values.settlement_cycle,
        reservation_advance_days: values.reservation_advance_days,
        min_reservation_notice: values.min_reservation_notice,
        cancellation_policy: {
          d3: values.cancellation_d3,
          d2: values.cancellation_d2,
          d1: values.cancellation_d1,
          d0: values.cancellation_d0,
        },
        service_email: values.service_email,
        service_phone: values.service_phone,
        business_hours: {
          start: values.business_hours_start,
          end: values.business_hours_end,
        },
      }
      return updateSettings(settingsToUpdate, admin?.id || '')
    },
    onSuccess: () => {
      message.success('설정이 저장되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] })
    },
    onError: (error: Error) => {
      message.error(`저장 실패: ${error.message}`)
    },
  })

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      mutation.mutate(values)
    })
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>서비스 설정</h2>
        <Text type="secondary">플랫폼 운영에 필요한 기본 설정을 관리합니다.</Text>
      </div>

      <Form form={form} layout="vertical" className="compact-form">
        {/* 수수료 설정 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<DollarOutlined />}
            title="수수료 설정"
            description="사업주에게 적용되는 수수료 관련 설정입니다."
          />

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Form.Item
              name="default_commission_rate"
              label="기본 수수료율"
              rules={[{ required: true, message: '기본 수수료율을 입력해주세요' }]}
            >
              <InputNumber
                style={{ width: 120 }}
                min={0}
                max={100}
                addonAfter="%"
                placeholder="10"
              />
            </Form.Item>

            <Form.Item
              name="commission_rate_min"
              label="최소 수수료율"
              rules={[{ required: true, message: '최소 수수료율을 입력해주세요' }]}
            >
              <InputNumber
                style={{ width: 120 }}
                min={0}
                max={100}
                addonAfter="%"
                placeholder="5"
              />
            </Form.Item>

            <Form.Item
              name="commission_rate_max"
              label="최대 수수료율"
              rules={[{ required: true, message: '최대 수수료율을 입력해주세요' }]}
            >
              <InputNumber
                style={{ width: 120 }}
                min={0}
                max={100}
                addonAfter="%"
                placeholder="15"
              />
            </Form.Item>

            <Form.Item
              name="settlement_cycle"
              label="정산 주기"
              rules={[{ required: true, message: '정산 주기를 선택해주세요' }]}
            >
              <Select
                style={{ width: 140 }}
                options={[
                  { value: 'weekly', label: '주간 정산' },
                  { value: 'monthly', label: '월간 정산' },
                ]}
              />
            </Form.Item>
          </div>
        </Card>

        {/* 예약 설정 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<CalendarOutlined />}
            title="예약 설정"
            description="예약 및 취소/환불 정책 설정입니다."
          />

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
            <Form.Item
              name="reservation_advance_days"
              label="예약 가능 기간"
              extra="오늘 기준 몇 일 후까지 예약 가능한지 설정"
            >
              <InputNumber style={{ width: 120 }} min={1} max={365} addonAfter="일" />
            </Form.Item>

            <Form.Item
              name="min_reservation_notice"
              label="최소 예약 사전 기간"
              extra="체험 시작 최소 며칠 전까지 예약 가능"
            >
              <InputNumber style={{ width: 120 }} min={0} max={30} addonAfter="일" />
            </Form.Item>
          </div>

          <Divider style={{ margin: '24px 0 16px' }}>
            취소/환불 정책
          </Divider>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
            체험일 기준 D-n일에 취소 시 환불되는 비율입니다.
          </Text>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Form.Item name="cancellation_d3" label="D-3 이전">
              <InputNumber style={{ width: 100 }} min={0} max={100} addonAfter="%" />
            </Form.Item>
            <Form.Item name="cancellation_d2" label="D-2">
              <InputNumber style={{ width: 100 }} min={0} max={100} addonAfter="%" />
            </Form.Item>
            <Form.Item name="cancellation_d1" label="D-1">
              <InputNumber style={{ width: 100 }} min={0} max={100} addonAfter="%" />
            </Form.Item>
            <Form.Item name="cancellation_d0" label="당일 (D-0)">
              <InputNumber style={{ width: 100 }} min={0} max={100} addonAfter="%" />
            </Form.Item>
          </div>
        </Card>

        {/* 고객센터 설정 */}
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<CustomerServiceOutlined />}
            title="고객센터 정보"
            description="고객에게 노출되는 고객센터 연락처 정보입니다."
          />

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Form.Item
              name="service_email"
              label="서비스 이메일"
              rules={[
                { required: true, message: '이메일을 입력해주세요' },
                { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
              ]}
            >
              <Input style={{ width: 280 }} placeholder="contact@damda.co.kr" />
            </Form.Item>

            <Form.Item
              name="service_phone"
              label="서비스 전화번호"
              rules={[{ required: true, message: '전화번호를 입력해주세요' }]}
            >
              <Input style={{ width: 180 }} placeholder="02-1234-5678" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Form.Item name="business_hours_start" label="운영 시작 시간">
              <Input style={{ width: 120 }} placeholder="09:00" />
            </Form.Item>
            <Form.Item name="business_hours_end" label="운영 종료 시간">
              <Input style={{ width: 120 }} placeholder="18:00" />
            </Form.Item>
          </div>
        </Card>

        {/* 저장 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={mutation.isPending}
            size="large"
          >
            설정 저장
          </Button>
        </div>
      </Form>
    </div>
  )
}
