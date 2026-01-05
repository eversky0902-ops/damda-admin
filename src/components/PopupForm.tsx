import { useState } from 'react'
import { Form, Input, Select, Switch, Button, Card, InputNumber, DatePicker, Upload, Typography, Image } from 'antd'
import { ArrowLeftOutlined, AppstoreOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { uploadImage } from '@/services/storageService'
import type { Popup } from '@/types'

const { Text } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

interface PopupFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<Popup>
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

export function PopupForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: PopupFormProps) {
  const [form] = Form.useForm()
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>(initialValues?.image_url || '')

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const period = values.period
      if (!period || period.length !== 2) {
        return
      }
      const submitData = {
        ...values,
        image_url: imageUrl || null,
        start_date: period[0].toISOString(),
        end_date: period[1].toISOString(),
      }
      delete submitData.period
      onSubmit(submitData)
    })
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadImage(file, 'popups')
      setImageUrl(url)
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
        position: 'center',
        width: 400,
        height: 300,
        is_visible: true,
        ...initialValues,
        period: periodValue,
      }}
      className="compact-form"
    >
      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<AppstoreOutlined />}
          title="팝업 정보"
          description="팝업의 기본 정보를 입력합니다"
        />

        <Form.Item
          name="title"
          label="제목"
          rules={[{ required: true, message: '제목을 입력해주세요' }]}
        >
          <Input placeholder="팝업 제목" style={{ width: '100%', maxWidth: 400 }} />
        </Form.Item>

        <Form.Item
          name="content"
          label="내용"
        >
          <TextArea
            placeholder="팝업 내용 (선택)"
            rows={4}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="팝업 이미지"
          extra="이미지를 사용하는 경우 업로드해주세요"
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {imageUrl && (
              <Image
                src={imageUrl}
                width={150}
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
          extra="팝업 클릭 시 이동할 URL을 입력합니다"
        >
          <Input placeholder="https://..." style={{ width: '100%', maxWidth: 500 }} />
        </Form.Item>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<SettingOutlined />}
          title="게시 설정"
          description="팝업의 노출 설정을 관리합니다"
        />

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Form.Item
            name="position"
            label="위치"
            rules={[{ required: true, message: '위치를 선택해주세요' }]}
          >
            <Select
              style={{ width: 120 }}
              options={[
                { value: 'center', label: '중앙' },
                { value: 'bottom', label: '하단' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="width"
            label="너비 (px)"
          >
            <InputNumber min={200} max={800} style={{ width: 100 }} />
          </Form.Item>

          <Form.Item
            name="height"
            label="높이 (px)"
          >
            <InputNumber min={100} max={600} style={{ width: 100 }} />
          </Form.Item>
        </div>

        <Form.Item
          name="period"
          label="노출 기간"
          rules={[{ required: true, message: '노출 기간을 선택해주세요' }]}
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
