import { Button, Card, Col, Form, Input, InputNumber, Row, Space, Typography, Upload, message } from 'antd'
import { BankOutlined, CameraOutlined, DeleteOutlined, FileImageOutlined, SaveOutlined, ShopOutlined, SwapOutlined } from '@ant-design/icons'
import type { PartnerOnboarding, PartnerOnboardingInput } from '@/services/partnerOnboardingService'

export type OnboardingDocumentType = 'business_registration' | 'bank_account'
export type OnboardingDocumentFiles = Partial<Record<OnboardingDocumentType, File>>

interface Props {
  initialValues?: Partial<PartnerOnboarding>
  submitLabel?: string
  submitting?: boolean
  onSubmit: (values: PartnerOnboardingInput) => void
  onCancel?: () => void
  disabled?: boolean
  documentFiles?: OnboardingDocumentFiles
  onDocumentsChange?: (files: OnboardingDocumentFiles) => void
  requireDocuments?: boolean
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Typography.Text strong style={{ fontSize: 16 }}>{title}</Typography.Text>
      <div><Typography.Text type="secondary">{description}</Typography.Text></div>
    </div>
  )
}

export function PartnerOnboardingBaseForm({
  initialValues,
  submitLabel = '저장하고 계속',
  submitting,
  onSubmit,
  onCancel,
  disabled = false,
  documentFiles,
  onDocumentsChange,
  requireDocuments = false,
}: Props) {
  const [form] = Form.useForm<PartnerOnboardingInput>()

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ commission_rate: 10, ...initialValues }}
      onFinish={onSubmit}
      requiredMark="optional"
      disabled={disabled}
      className="partner-onboarding-form"
    >
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle title="사업주 기본정보" description="계약서와 사업주 등록에 사용할 정보를 입력합니다." />
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12} lg={8}>
            <Form.Item name="business_name" label="상호명" rules={[{ required: true, message: '상호명을 입력해주세요.' }]}>
              <Input prefix={<ShopOutlined />} placeholder="담다 체험농장" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item
              name="business_number"
              label="사업자등록번호"
              normalize={(value: string) => value?.replace(/\D/g, '')}
              rules={[
                { required: true, message: '사업자등록번호를 입력해주세요.' },
                { pattern: /^\d{10}$/, message: '숫자 10자리를 입력해주세요.' },
              ]}
            >
              <Input inputMode="numeric" maxLength={10} placeholder="숫자 10자리" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item name="representative" label="대표자" rules={[{ required: true, message: '대표자명을 입력해주세요.' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item name="contact_name" label="담당자" rules={[{ required: true, message: '담당자명을 입력해주세요.' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item
              name="contact_phone"
              label="담당자 연락처"
              normalize={(value: string) => value?.replace(/\D/g, '')}
              rules={[{ required: true, message: '연락처를 입력해주세요.' }]}
            >
              <Input inputMode="tel" placeholder="숫자만 입력" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item name="email" label="계약 수신 이메일" rules={[{ required: true }, { type: 'email' }]}>
              <Input type="email" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item name="sales_manager_name" label="담당 영업사원">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Form.Item name="commission_rate" label="수수료율" rules={[{ required: true }]}>
              <InputNumber min={5} max={15} step={0.5} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="address" label="사업장 주소" rules={[{ required: true, message: '주소를 입력해주세요.' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="zipcode" label="우편번호"><Input /></Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item name="address_detail" label="상세주소"><Input /></Form.Item>
          </Col>
        </Row>

        {onDocumentsChange && (
          <>
            <div style={{ borderTop: '1px solid #f0f0f0', margin: '8px 0 20px' }} />
            <SectionTitle title="필수 증빙서류" description="파일 선택창에서 사업자등록증과 통장사본을 함께 선택해주세요. 첫 번째 파일은 사업자등록증, 두 번째 파일은 통장사본으로 등록됩니다." />
            <Card size="small" style={{ background: '#fafafa' }}>
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <Upload
                  accept="image/*,.pdf,.heic,.heif"
                  multiple
                  showUploadList={false}
                  beforeUpload={(nextFile, selectedFiles) => {
                    if (nextFile.uid === selectedFiles[0]?.uid) {
                      if (selectedFiles.length > 2) message.warning('필수서류는 한 번에 2개까지 선택할 수 있습니다.')
                      const selected = selectedFiles.slice(0, 2)
                      if (selected.length === 1 && documentFiles?.business_registration && !documentFiles.bank_account) {
                        onDocumentsChange({ ...documentFiles, bank_account: selected[0] })
                      } else if (selected.length === 1 && !documentFiles?.business_registration && documentFiles?.bank_account) {
                        onDocumentsChange({ ...documentFiles, business_registration: selected[0] })
                      } else {
                        onDocumentsChange({ business_registration: selected[0], bank_account: selected[1] })
                      }
                    }
                    return false
                  }}
                >
                  <Button type="primary" icon={<CameraOutlined />}>
                    {documentFiles?.business_registration && documentFiles?.bank_account ? '서류 전체 다시 선택' : '필요 서류 한 번에 선택'}
                  </Button>
                </Upload>

                {([
                  ['business_registration', '사업자등록증'],
                  ['bank_account', '통장사본'],
                ] as const).map(([type, title]) => {
                  const file = documentFiles?.[type]
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: file ? '#f0fbfa' : '#fff', border: `1px solid ${file ? '#9bd8d4' : '#e5e7eb'}` }}>
                      <FileImageOutlined style={{ color: file ? '#178f89' : '#a8a8a8', fontSize: 22 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Typography.Text strong>{title}{requireDocuments && <Typography.Text type="danger"> *</Typography.Text>}</Typography.Text>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Typography.Text type="secondary">{file?.name || '선택된 파일이 없습니다.'}</Typography.Text>
                        </div>
                      </div>
                      {file && <Button danger type="text" icon={<DeleteOutlined />} aria-label={`${title} 삭제`} onClick={() => onDocumentsChange({ ...documentFiles, [type]: undefined })} />}
                    </div>
                  )
                })}

                {documentFiles?.business_registration && documentFiles?.bank_account && (
                  <Button
                    icon={<SwapOutlined />}
                    onClick={() => onDocumentsChange({
                      business_registration: documentFiles.bank_account,
                      bank_account: documentFiles.business_registration,
                    })}
                  >서류 구분 서로 바꾸기</Button>
                )}
              </Space>
            </Card>
          </>
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle title="정산정보" description="통장사본과 동일한 계좌정보를 입력합니다." />
        <Row gutter={[16, 0]}>
          <Col xs={24} md={8}>
            <Form.Item name="bank_name" label="은행명" rules={[{ required: true }]}>
              <Input prefix={<BankOutlined />} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="bank_holder" label="예금주" rules={[{ required: true }]}><Input /></Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="bank_account"
              label="계좌번호"
              normalize={(value: string) => value?.replace(/\D/g, '')}
              rules={[{ required: true }]}
            >
              <Input inputMode="numeric" placeholder="숫자만 입력" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="tax_email" label="세금계산서 이메일" rules={[{ type: 'email' }]}>
              <Input type="email" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
        {onCancel && <Button onClick={onCancel}>취소</Button>}
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting} disabled={disabled}>
          {submitLabel}
        </Button>
      </Space>
    </Form>
  )
}
