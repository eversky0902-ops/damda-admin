import { Form, Input, Switch, Button, Card, Typography } from 'antd'
import { ArrowLeftOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons'
import type { Notice } from '@/types'

const { Text } = Typography
const { TextArea } = Input

interface NoticeFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<Notice>
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

export function NoticeForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: NoticeFormProps) {
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
        is_pinned: false,
        is_visible: true,
        ...initialValues,
      }}
      className="compact-form"
    >
      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<FileTextOutlined />}
          title="공지사항 내용"
          description="공지사항 제목과 내용을 입력합니다"
        />

        <Form.Item
          name="title"
          label="제목"
          rules={[{ required: true, message: '제목을 입력해주세요' }]}
        >
          <Input placeholder="공지사항 제목" style={{ width: '100%', maxWidth: 600 }} />
        </Form.Item>

        <Form.Item
          name="content"
          label="내용"
          rules={[{ required: true, message: '내용을 입력해주세요' }]}
        >
          <TextArea
            placeholder="공지사항 내용을 입력해주세요"
            rows={12}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<SettingOutlined />}
          title="게시 설정"
          description="공지사항의 노출 설정을 관리합니다"
        />

        <div style={{ display: 'flex', gap: 48 }}>
          <Form.Item
            name="is_pinned"
            label="상단 고정"
            valuePropName="checked"
            extra="활성화하면 목록 상단에 고정됩니다"
          >
            <Switch />
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
