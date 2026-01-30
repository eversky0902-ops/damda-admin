import { useState } from 'react'
import { Form, Input, Switch, Button, Card, InputNumber, Upload, Typography, Image } from 'antd'
import { ArrowLeftOutlined, PictureOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons'

import { uploadImage } from '@/services/storageService'
import type { Banner } from '@/types'

const { Text } = Typography

interface BannerFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<Banner>
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

export function BannerForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: BannerFormProps) {
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>(initialValues?.image_url || '')

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const submitData = {
        ...values,
        image_url: imageUrl,
      }
      onSubmit(submitData)
    })
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadImage(file, 'banners')
      setImageUrl(url)
      form.setFieldValue('image_url', url)
    } catch {
      // error handled
    } finally {
      setUploading(false)
    }
    return false
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        sort_order: 0,
        is_visible: true,
        ...initialValues,
      }}
      className="compact-form"
    >
      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<PictureOutlined />}
          title="이미지 정보"
          description="메인 화면에 표시될 이미지를 등록합니다"
        />

        <Form.Item
          name="title"
          label="제목"
          extra="관리용 제목입니다 (선택)"
        >
          <Input placeholder="이미지 제목" style={{ width: '100%', maxWidth: 400 }} />
        </Form.Item>

        <Form.Item
          label="메인 이미지"
          required
          extra="권장 사이즈: 1200x400px"
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {imageUrl && (
              <Image
                src={imageUrl}
                width={300}
                height={150}
                style={{ objectFit: 'cover', borderRadius: 4 }}
              />
            )}
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleUpload}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                이미지 업로드
              </Button>
            </Upload>
          </div>
        </Form.Item>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<SettingOutlined />}
          title="게시 설정"
          description="이미지의 노출 설정을 관리합니다"
        />

        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
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
          >
            <Switch />
          </Form.Item>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onCancel}>
          취소
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!imageUrl}
        >
          {mode === 'edit' ? '저장' : '등록'}
        </Button>
      </div>
    </Form>
  )
}
