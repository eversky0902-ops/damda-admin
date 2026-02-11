import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Button, Card, Typography, Row, Col, Modal, Upload, List, Space, Popconfirm, message, Spin } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, FileTextOutlined, SearchOutlined, UploadOutlined, DeleteOutlined, FileOutlined, FilePdfOutlined, FileImageOutlined } from '@ant-design/icons'
import { DaumPostcodeEmbed, type Address } from 'react-daum-postcode'
import type { RcFile } from 'antd/es/upload'

import { uploadDaycareDocument, deleteDaycareDocument } from '@/services/storageService'
import { getDaycareDocuments, addDaycareDocument, deleteDaycareDocumentRecord } from '@/services/daycareService'
import type { Daycare, DaycareDocument } from '@/types'

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

interface DaycareFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<Daycare>
  daycareId?: string
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

function getFileIcon(mimeType?: string | null) {
  if (!mimeType) return <FileOutlined />
  if (mimeType.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />
  if (mimeType.includes('image')) return <FileImageOutlined style={{ color: '#1890ff' }} />
  return <FileOutlined />
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DaycareForm({
  mode,
  initialValues,
  daycareId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DaycareFormProps) {
  const [form] = Form.useForm()
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false)
  const [documents, setDocuments] = useState<DaycareDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const isEdit = mode === 'edit'

  // 문서 목록 로드
  useEffect(() => {
    if (isEdit && daycareId) {
      loadDocuments()
    }
  }, [isEdit, daycareId])

  const loadDocuments = async () => {
    if (!daycareId) return
    setDocumentsLoading(true)
    try {
      const docs = await getDaycareDocuments(daycareId)
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setDocumentsLoading(false)
    }
  }

  const handleDocumentUpload = async (file: RcFile) => {
    if (!daycareId) {
      message.error('먼저 저장 후 파일을 업로드해주세요')
      return false
    }

    // 파일 검증
    const isAllowedType = file.name.match(/\.(jpg|jpeg|png|gif|pdf)$/i)
    if (!isAllowedType) {
      message.error('JPG, PNG, GIF, PDF 파일만 업로드 가능합니다')
      return false
    }
    const isLt20M = file.size / 1024 / 1024 < 20
    if (!isLt20M) {
      message.error('파일 크기는 20MB 이하여야 합니다')
      return false
    }

    setUploading(true)
    try {
      const result = await uploadDaycareDocument(file, daycareId, 'license')
      await addDaycareDocument({
        daycare_id: daycareId,
        document_type: 'license',
        file_name: result.fileName,
        file_url: result.url,
        file_size: result.fileSize,
        mime_type: result.mimeType,
      })
      message.success('파일이 업로드되었습니다')
      await loadDocuments()
    } catch (error) {
      message.error('업로드에 실패했습니다')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleDocumentDelete = async (doc: DaycareDocument) => {
    try {
      await deleteDaycareDocument(doc.file_url)
      await deleteDaycareDocumentRecord(doc.id)
      message.success('파일이 삭제되었습니다')
      await loadDocuments()
    } catch (error) {
      message.error('삭제에 실패했습니다')
    }
  }

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
            rules={[
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
                extra="숫자만 입력"
              >
                <Input
                  placeholder="숫자만 입력"
                  style={{ width: 180 }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    form.setFieldValue('business_number', val)
                  }}
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
                name="tel"
                label="대표 전화번호"
              >
                <Input
                  placeholder="숫자만 입력"
                  style={{ width: 180 }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    form.setFieldValue('tel', val)
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
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
                <Input
                  placeholder="숫자만 입력"
                  style={{ width: 180 }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    form.setFieldValue('contact_phone', val)
                  }}
                />
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
                extra="숫자만 입력"
                rules={[{ required: true, message: '인가번호를 입력하세요' }]}
              >
                <Input
                  placeholder="숫자만 입력"
                  style={{ width: 200 }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    form.setFieldValue('license_number', val)
                  }}
                />
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

          {isEdit && daycareId ? (
            <div style={{ marginTop: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>인가증 파일</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                어린이집 인가증 사본을 업로드해주세요. 여러 파일 업로드 가능합니다.
              </Text>

              {documentsLoading ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <Spin />
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <Upload
                      showUploadList={false}
                      beforeUpload={handleDocumentUpload}
                      accept=".jpg,.jpeg,.png,.gif,.pdf"
                      disabled={uploading}
                    >
                      <Button icon={<UploadOutlined />} loading={uploading}>
                        파일 업로드
                      </Button>
                    </Upload>
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                      JPG, PNG, GIF, PDF (최대 20MB)
                    </Text>
                  </div>

                  {documents.length > 0 ? (
                    <List
                      size="small"
                      bordered
                      dataSource={documents}
                      renderItem={(doc) => (
                        <List.Item
                          actions={[
                            <Popconfirm
                              key="delete"
                              title="파일을 삭제하시겠습니까?"
                              onConfirm={() => handleDocumentDelete(doc)}
                              okText="삭제"
                              cancelText="취소"
                            >
                              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>,
                          ]}
                        >
                          <Space>
                            {getFileIcon(doc.mime_type)}
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              {doc.file_name}
                            </a>
                            {doc.file_size && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ({formatFileSize(doc.file_size)})
                              </Text>
                            )}
                          </Space>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', background: '#fafafa', borderRadius: 6 }}>
                      <Text type="secondary">등록된 파일이 없습니다</Text>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 6 }}>
              <Text type="secondary">
                인가증 파일은 어린이집 등록 완료 후 수정 화면에서 업로드할 수 있습니다.
              </Text>
            </div>
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
          scriptUrl="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          onComplete={handlePostcodeComplete}
          style={{ height: 450 }}
        />
      </Modal>
    </>
  )
}
