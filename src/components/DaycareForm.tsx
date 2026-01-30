import { useState } from 'react'
import { Form, Input, InputNumber, Button, Card, Typography, Row, Col, Modal } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons'
import { DaumPostcodeEmbed, type Address } from 'react-daum-postcode'

import type { Daycare } from '@/types'

const { Text } = Typography

// 핸드폰 번호 포맷팅 (숫자만 추출 후 010-0000-0000 형식으로 변환)
function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/[^0-9]/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

// 핸드폰 번호 유효성 검사 (010으로 시작하는 11자리)
function isValidMobilePhone(value: string): boolean {
  const numbers = value.replace(/[^0-9]/g, '')
  return /^010\d{8}$/.test(numbers)
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

interface DaycareFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<Daycare>
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function DaycareForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DaycareFormProps) {
  const [form] = Form.useForm()
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false)

  const isEdit = mode === 'edit'

  const handlePostcodeComplete = (data: Address) => {
    form.setFieldsValue({
      address: data.roadAddress || data.jibunAddress,
      zipcode: data.zonecode,
    })
    setIsPostcodeOpen(false)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      onSubmit(values)
    } catch {
      // validation error
    }
  }

  return (
    <>
      <style>{`
        .compact-form .ant-form-item { margin-bottom: 16px; }
        .compact-form .ant-row > .ant-col .ant-form-item { margin-bottom: 0; }
        .compact-form .ant-row { margin-bottom: 12px; }
        .compact-form .ant-card-body > *:last-child { margin-bottom: 0; }
      `}</style>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        style={{ width: '100%' }}
        className="compact-form"
        requiredMark={(label, { required }) => (
          <>
            {label}
            {required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
          </>
        )}
      >
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<HomeOutlined />}
            title="기본 정보"
            description="어린이집의 기본 정보를 입력해주세요."
          />

          <Form.Item
            name="email"
            label="이메일"
            rules={isEdit ? undefined : [
              { required: true, message: '이메일을 입력하세요' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
            ]}
          >
            <Input
              placeholder="example@email.com"
              style={{ maxWidth: 320 }}
              disabled={isEdit}
            />
          </Form.Item>

          <Row gutter={24}>
            <Col>
              <Form.Item
                name="name"
                label="어린이집명"
                extra="고객에게 노출되는 어린이집 이름입니다"
                rules={[{ required: true, message: '어린이집명을 입력하세요' }]}
              >
                <Input placeholder="예: 해피 어린이집" style={{ width: 280 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="business_number"
                label="사업자번호"
              >
                <Input
                  placeholder="000-00-00000"
                  style={{ width: 180 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col>
              <Form.Item
                name="representative"
                label="대표자"
              >
                <Input placeholder="홍길동" style={{ width: 160 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="contact_name"
                label="담당자명"
                rules={[{ required: true, message: '담당자명을 입력하세요' }]}
              >
                <Input placeholder="김담당" style={{ width: 160 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="contact_phone"
                label="담당자 연락처"
                extra="휴대폰 번호만 입력 가능합니다"
                rules={[
                  { required: true, message: '연락처를 입력하세요' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve()
                      if (isValidMobilePhone(value)) return Promise.resolve()
                      return Promise.reject(new Error('010으로 시작하는 휴대폰 번호를 입력하세요'))
                    },
                  },
                ]}
                getValueFromEvent={(e) => formatPhoneNumber(e.target.value)}
              >
                <Input placeholder="010-0000-0000" style={{ width: 180 }} maxLength={13} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="주소"
            required
          >
            <Row gutter={8} align="middle" style={{ marginBottom: 8 }}>
              <Col>
                <Form.Item name="zipcode" noStyle>
                  <Input placeholder="우편번호" style={{ width: 100 }} readOnly />
                </Form.Item>
              </Col>
              <Col>
                <Button icon={<SearchOutlined />} onClick={() => setIsPostcodeOpen(true)}>
                  주소검색
                </Button>
              </Col>
            </Row>
            <div style={{ marginBottom: 8 }}>
              <Form.Item
                name="address"
                noStyle
                rules={[{ required: true, message: '주소를 입력하세요' }]}
              >
                <Input placeholder="주소검색을 통해 입력해주세요" style={{ width: 480 }} readOnly />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="address_detail" noStyle>
                <Input placeholder="상세주소" style={{ width: 480 }} />
              </Form.Item>
            </div>
          </Form.Item>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<FileTextOutlined />}
            title="어린이집 정보"
            description="어린이집 인가 관련 정보를 입력해주세요."
          />

          <Row gutter={24}>
            <Col>
              <Form.Item
                name="license_number"
                label="인가번호"
                rules={[{ required: true, message: '인가번호를 입력하세요' }]}
              >
                <Input placeholder="어린이집 인가번호" style={{ width: 200 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="tel"
                label="전화번호"
              >
                <Input placeholder="02-0000-0000" style={{ width: 180 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="capacity"
                label="정원"
              >
                <InputNumber
                  placeholder="0"
                  min={0}
                  style={{ width: 120 }}
                  addonAfter="명"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="license_file"
            label="인가증 파일"
            extra="인가증 파일 URL (이미지 또는 PDF)"
          >
            <Input placeholder="https://..." style={{ width: 480 }} />
          </Form.Item>
        </Card>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onCancel}>
            취소
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            {isEdit ? '저장' : '등록'}
          </Button>
        </div>
      </Form>

      <Modal
        title="주소검색"
        open={isPostcodeOpen}
        onCancel={() => setIsPostcodeOpen(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <DaumPostcodeEmbed
          onComplete={handlePostcodeComplete}
          style={{ height: 450 }}
        />
      </Modal>
    </>
  )
}
