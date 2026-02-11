import { useState } from 'react'
import { Form, Input, Switch, Button, Card, InputNumber, DatePicker, Upload, Typography, Image } from 'antd'
import { ArrowLeftOutlined, PictureOutlined, SettingOutlined, UploadOutlined, ShopOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { uploadImage } from '@/services/storageService'
import type { AdBanner } from '@/types'

const { Text } = Typography
const { RangePicker } = DatePicker

interface AdBannerFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<AdBanner>
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

export function AdBannerForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: AdBannerFormProps) {
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
      const url = await uploadImage(file, 'ad-banners')
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
        sort_order: 0,
        is_visible: true,
        ...initialValues,
        period: periodValue,
      }}
      className="compact-form"
    >
      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<ShopOutlined />}
          title="광고주 정보"
          description="광고주와 광고 내용을 입력합니다"
        />

        <Form.Item
          name="advertiser_name"
          label="광고주명"
          rules={[{ required: true, message: '광고주명을 입력해주세요' }]}
          extra="예: 담다도시락, 아이사랑 등"
        >
          <Input placeholder="광고주명 입력" style={{ width: '100%', maxWidth: 300 }} />
        </Form.Item>

        <Form.Item
          name="title"
          label="광고 제목"
          rules={[{ required: true, message: '광고 제목을 입력해주세요' }]}
        >
          <Input placeholder="광고 제목 입력" style={{ width: '100%', maxWidth: 400 }} />
        </Form.Item>

        <Form.Item
          name="link_url"
          label="외부 링크 URL"
          rules={[{ required: true, message: '링크 URL을 입력해주세요' }]}
          extra="배너 클릭 시 이동할 외부 URL을 입력합니다"
        >
          <Input placeholder="https://..." style={{ width: '100%', maxWidth: 500 }} />
        </Form.Item>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<PictureOutlined />}
          title="배너 이미지"
          description="광고 배너 이미지를 등록합니다"
        />

        <Form.Item
          label="배너 이미지"
          required
          extra="권장 사이즈: 1200x300px (가로형 배너)"
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {imageUrl && (
              <Image
                src={imageUrl}
                width={300}
                height={75}
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
          description="광고 배너의 노출 설정을 관리합니다"
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
              popupClassName="single-calendar-range"
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
