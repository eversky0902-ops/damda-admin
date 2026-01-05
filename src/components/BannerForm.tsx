import { useState } from 'react'
import { Form, Input, Select, Switch, Button, Card, InputNumber, DatePicker, Upload, Typography, Image } from 'antd'
import { ArrowLeftOutlined, PictureOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { uploadImage } from '@/services/storageService'
import type { Banner } from '@/types'

const { Text } = Typography
const { RangePicker } = DatePicker

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
      const period = values.period
      const submitData = {
        ...values,
        image_url: imageUrl,
        start_date: period?.[0]?.toISOString() || null,
        end_date: period?.[1]?.toISOString() || null,
      }
      delete submitData.period
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

  const periodValue = initialValues?.start_date && initialValues?.end_date
    ? [dayjs(initialValues.start_date), dayjs(initialValues.end_date)]
    : undefined

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        type: 'main',
        sort_order: 0,
        is_visible: true,
        ...initialValues,
        period: periodValue,
      }}
      className="compact-form"
    >
      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<PictureOutlined />}
          title="배너 정보"
          description="배너의 기본 정보를 입력합니다"
        />

        <Form.Item
          name="type"
          label="배너 타입"
          rules={[{ required: true, message: '배너 타입을 선택해주세요' }]}
        >
          <Select
            placeholder="배너 타입 선택"
            style={{ width: 200 }}
            options={[
              { value: 'main', label: '메인 배너' },
              { value: 'sub', label: '서브 배너' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="제목"
        >
          <Input placeholder="배너 제목 (선택)" style={{ width: '100%', maxWidth: 400 }} />
        </Form.Item>

        <Form.Item
          label="배너 이미지"
          required
          extra="권장 사이즈: 메인 배너 1200x400px, 서브 배너 600x200px"
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {imageUrl && (
              <Image
                src={imageUrl}
                width={200}
                height={100}
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

        <Form.Item
          name="link_url"
          label="링크 URL"
          extra="배너 클릭 시 이동할 URL을 입력합니다"
        >
          <Input placeholder="https://..." style={{ width: '100%', maxWidth: 500 }} />
        </Form.Item>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<SettingOutlined />}
          title="게시 설정"
          description="배너의 노출 설정을 관리합니다"
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
            name="period"
            label="노출 기간"
            extra="설정하지 않으면 상시 노출됩니다"
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder={['시작일', '종료일']}
            />
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
