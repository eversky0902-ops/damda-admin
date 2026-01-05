import { useState } from 'react'
import { Form, Input, InputNumber, Button, Card, Typography, Row, Col, Modal } from 'antd'
import { ArrowLeftOutlined, ShopOutlined, BankOutlined, SearchOutlined } from '@ant-design/icons'
import { DaumPostcodeEmbed, type Address } from 'react-daum-postcode'

import { LogoUpload } from '@/components/LogoUpload'
import type { BusinessOwner } from '@/types'

const { Text } = Typography

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

interface VendorFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<BusinessOwner>
  vendorId?: string
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function VendorForm({
  mode,
  initialValues,
  vendorId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: VendorFormProps) {
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
        initialValues={initialValues ?? { commission_rate: 10 }}
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
            icon={<ShopOutlined />}
            title="기본 정보"
            description="사업주의 기본 정보를 입력해주세요. 로고는 고객에게 노출됩니다."
          />

          <Form.Item name="logo_url" label="로고">
            <LogoUpload vendorId={vendorId} />
          </Form.Item>

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
                label="사업자명"
                extra="고객에게 노출되는 상호명입니다"
                rules={[{ required: true, message: '사업자명을 입력하세요' }]}
              >
                <Input placeholder="예: 담다 플라워샵" style={{ width: 280 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="business_number"
                label="사업자번호"
                rules={isEdit ? undefined : [{ required: true, message: '사업자번호를 입력하세요' }]}
              >
                <Input
                  placeholder="000-00-00000"
                  style={{ width: 180 }}
                  disabled={isEdit}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col>
              <Form.Item
                name="representative"
                label="대표자"
                rules={[{ required: true, message: '대표자를 입력하세요' }]}
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
                rules={[{ required: true, message: '연락처를 입력하세요' }]}
              >
                <Input placeholder="010-0000-0000" style={{ width: 180 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="주소"
            extra="사업장 소재지 주소"
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
            icon={<BankOutlined />}
            title="정산 정보"
            description="정산금 입금에 사용될 계좌 정보를 입력해주세요. 추후 변경 가능합니다."
          />

          <Row gutter={24}>
            <Col>
              <Form.Item name="bank_name" label="은행명">
                <Input placeholder="국민은행" style={{ width: 140 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="bank_holder" label="예금주">
                <Input placeholder="홍길동" style={{ width: 160 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="bank_account"
                label="계좌번호"
                extra="- 없이 숫자만 입력"
              >
                <Input placeholder="1234567890123" style={{ width: 200 }} />
              </Form.Item>
            </Col>
          </Row>

          {!isEdit && (
            <Form.Item
              name="commission_rate"
              label="수수료율"
              extra="판매 금액에서 차감되는 플랫폼 수수료입니다 (기본 10%)"
              rules={[
                { required: true, message: '수수료율을 입력하세요' },
                {
                  type: 'number',
                  min: 5,
                  max: 15,
                  message: '수수료율은 5~15% 사이여야 합니다',
                },
              ]}
            >
              <InputNumber
                min={5}
                max={15}
                step={0.5}
                style={{ width: 120 }}
                addonAfter="%"
              />
            </Form.Item>
          )}
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
