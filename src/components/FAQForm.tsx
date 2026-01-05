import { Form, Input, Select, Switch, Button, Card, InputNumber, Typography } from 'antd'
import { ArrowLeftOutlined, QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { FAQ_CATEGORY_OPTIONS } from '@/constants'
import type { FAQ } from '@/types'

const { Text } = Typography
const { TextArea } = Input

interface FAQFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<FAQ>
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18, color: '#1677ff' }}>{icon}</span>
        <Text strong style={{ fontSize: 16 }}>{title}</Text>
      </div>
      <Text type="secondary" style={{ fontSize: 13 }}>{description}</Text>
    </div>
  )
}

export function FAQForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: FAQFormProps) {
  const [form] = Form.useForm()

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values)
    })
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        category: 'general',
        sort_order: 0,
        is_visible: true,
        ...initialValues,
      }}
      className="compact-form"
    >
      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<QuestionCircleOutlined />}
          title="FAQ 내용"
          description="자주 묻는 질문과 답변을 입력합니다"
        />

        <Form.Item
          name="category"
          label="카테고리"
          rules={[{ required: true, message: '카테고리를 선택해주세요' }]}
        >
          <Select
            placeholder="카테고리 선택"
            style={{ width: 200 }}
            options={FAQ_CATEGORY_OPTIONS}
          />
        </Form.Item>

        <Form.Item
          name="question"
          label="질문"
          rules={[{ required: true, message: '질문을 입력해주세요' }]}
        >
          <Input placeholder="자주 묻는 질문을 입력해주세요" style={{ width: '100%', maxWidth: 600 }} />
        </Form.Item>

        <Form.Item
          name="answer"
          label="답변"
          rules={[{ required: true, message: '답변을 입력해주세요' }]}
        >
          <TextArea
            placeholder="답변 내용을 입력해주세요"
            rows={8}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<SettingOutlined />}
          title="게시 설정"
          description="FAQ의 노출 설정을 관리합니다"
        />

        <div style={{ display: 'flex', gap: 48 }}>
          <Form.Item
            name="sort_order"
            label="정렬 순서"
            extra="낮은 숫자가 먼저 표시됩니다"
          >
            <InputNumber min={0} style={{ width: 120 }} />
          </Form.Item>

          <Form.Item
            name="is_visible"
            label="공개 여부"
            valuePropName="checked"
            extra="비공개 시 사용자에게 노출되지 않습니다"
          >
            <Switch />
          </Form.Item>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onCancel}>
          취소
        </Button>
        <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
          {mode === 'edit' ? '저장' : '등록'}
        </Button>
      </div>
    </Form>
  )
}
