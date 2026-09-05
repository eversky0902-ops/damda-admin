import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Tabs,
  Tag,
  Timeline,
  Typography,
  Upload,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileImageOutlined,
  FileProtectOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  ShopOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { PartnerOnboardingBaseForm } from '@/components/PartnerOnboardingBaseForm'
import { getAllCategories } from '@/services/categoryService'
import {
  addPartnerProduct,
  approvePartnerOnboarding,
  deletePartnerProduct,
  getPartnerOnboarding,
  getPartnerOnboardingHistory,
  getSignupCandidates,
  linkSignupRequest,
  markPartnerReady,
  requestPartnerContract,
  requestPartnerRevision,
  updatePartnerOnboarding,
  updatePartnerProduct,
  uploadPartnerDocument,
  uploadPartnerProductImage,
  type PartnerOnboardingDocument,
  type PartnerOnboardingInput,
  type PartnerOnboardingProduct,
  type PartnerOnboardingProductInput,
} from '@/services/partnerOnboardingService'
import { CONTRACT_STATUS, ONBOARDING_STATUS } from './metadata'
import './partner-onboarding.css'

const documentMeta: Record<PartnerOnboardingDocument['document_type'], { title: string; description: string }> = {
  business_registration: { title: '사업자등록증', description: 'JPG, PNG, HEIC 또는 PDF · 최대 20MB' },
  bank_account: { title: '통장사본', description: '계좌번호와 예금주가 보이도록 촬영해주세요.' },
}

function ProductEditor({
  open,
  product,
  onboardingId,
  onClose,
  onSaved,
}: {
  open: boolean
  product: PartnerOnboardingProduct | null
  onboardingId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [form] = Form.useForm<PartnerOnboardingProductInput>()
  const [thumbnail, setThumbnail] = useState(product?.thumbnail || '')
  const [uploading, setUploading] = useState(false)
  const { data: categories = [] } = useQuery({ queryKey: ['categories', 'all'], queryFn: getAllCategories })

  const saveMutation = useMutation({
    mutationFn: async (values: PartnerOnboardingProductInput) => {
      if (!thumbnail) throw new Error('대표 이미지를 등록해주세요.')
      const payload: PartnerOnboardingProductInput = {
        ...values,
        thumbnail,
        image_urls: values.image_urls || [],
        options: values.options || [],
        category_id: values.category_id || null,
        summary: values.summary || null,
        description: values.description || null,
        duration_minutes: values.duration_minutes || null,
        address: values.address || null,
        address_detail: values.address_detail || null,
        region: values.region || null,
        sort_order: product?.sort_order ?? 0,
      }
      if (product) await updatePartnerProduct(product.id, payload)
      else await addPartnerProduct(onboardingId, payload)
    },
    onSuccess: () => {
      message.success(product ? '상품이 수정되었습니다.' : '상품이 추가되었습니다.')
      onSaved()
      onClose()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const uploadThumbnail = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadPartnerProductImage(file)
      setThumbnail(url)
      message.success('대표 이미지가 등록되었습니다.')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
    return false
  }

  return (
    <Modal
      title={product ? '상품 수정' : '상품 추가'}
      open={open}
      width={760}
      okText={product ? '수정' : '추가'}
      cancelText="취소"
      confirmLoading={saveMutation.isPending}
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={product || { original_price: 0, sale_price: 0, min_participants: 1, max_participants: 10, options: [] }}
        onFinish={(values) => saveMutation.mutate(values)}
      >
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="name" label="상품명" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="category_id" label="카테고리">
              <Select allowClear showSearch optionFilterProp="label" options={categories.map((item) => ({ value: item.id, label: item.name }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Typography.Text>대표 이미지</Typography.Text>
            <div style={{ marginTop: 8 }}>
              {thumbnail && <Image src={thumbnail} width="100%" height={110} style={{ objectFit: 'cover', borderRadius: 8 }} />}
              <Upload accept="image/*" showUploadList={false} beforeUpload={uploadThumbnail} capture={undefined}>
                <Button block icon={<CloudUploadOutlined />} loading={uploading} style={{ marginTop: 8 }}>촬영·업로드</Button>
              </Upload>
            </div>
          </Col>
        </Row>
        <Form.Item name="summary" label="한 줄 소개"><Input maxLength={100} showCount /></Form.Item>
        <Form.Item name="description" label="상세 설명"><Input.TextArea rows={4} /></Form.Item>
        <Row gutter={16}>
          <Col xs={12} md={6}><Form.Item name="original_price" label="정가" rules={[{ required: true }]}><InputNumber min={0} addonAfter="원" style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item name="sale_price" label="판매가" rules={[{ required: true }]}><InputNumber min={0} addonAfter="원" style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item name="min_participants" label="최소 인원" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item name="max_participants" label="최대 인원" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={8}><Form.Item name="duration_minutes" label="체험시간(분)"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="region" label="지역"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="address" label="진행 장소"><Input /></Form.Item></Col>
        </Row>
        <Divider titlePlacement="start">상품 옵션</Divider>
        <Form.List name="options">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} align="baseline" style={{ display: 'flex' }}>
                  <Form.Item {...field} name={[field.name, 'name']} rules={[{ required: true }]}><Input placeholder="옵션명" /></Form.Item>
                  <Form.Item {...field} name={[field.name, 'price']} rules={[{ required: true }]}><InputNumber min={0} placeholder="추가금액" /></Form.Item>
                  <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                </Space>
              ))}
              <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ name: '', price: 0 })}>옵션 추가</Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  )
}

export function PartnerOnboardingDetailPage({
  audience = 'admin',
  basePath = '/partner-onboardings',
}: {
  audience?: 'admin' | 'sales'
  basePath?: string
} = {}) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [productEditorOpen, setProductEditorOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<PartnerOnboardingProduct | null>(null)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')
  const isSales = audience === 'sales'

  const onboardingQuery = useQuery({
    queryKey: ['partner-onboarding', id],
    queryFn: () => getPartnerOnboarding(id),
    enabled: !!id,
  })
  const onboarding = onboardingQuery.data
  const historyQuery = useQuery({
    queryKey: ['partner-onboarding-history', id],
    queryFn: () => getPartnerOnboardingHistory(id),
    enabled: !!id,
  })
  const candidatesQuery = useQuery({
    queryKey: ['partner-signup-candidates', onboarding?.business_number, onboarding?.owner_code],
    queryFn: () => getSignupCandidates(onboarding?.business_number || '', onboarding?.owner_code || ''),
    enabled: !!onboarding?.business_number,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['partner-onboarding', id] })
    queryClient.invalidateQueries({ queryKey: ['partner-onboardings'] })
    queryClient.invalidateQueries({ queryKey: ['partner-onboarding-history', id] })
  }

  const actionMutation = useMutation({
    mutationFn: async ({ action, payload }: { action: string; payload?: string }) => {
      if (action === 'contract') return requestPartnerContract(id)
      if (action === 'revision') return requestPartnerRevision(id, payload || '')
      if (action === 'ready') return markPartnerReady(id)
      if (action === 'approve') return approvePartnerOnboarding(id)
      if (action === 'link') return linkSignupRequest(id, payload || '')
      throw new Error('지원하지 않는 작업입니다.')
    },
    onSuccess: (result, variables) => {
      const labels: Record<string, string> = {
        contract: '계약서 발송 요청을 접수했습니다.', revision: '수정 요청을 등록했습니다.',
        ready: '입점 승인 대기로 변경했습니다.', approve: '사업주와 상품이 생성되었습니다.',
        link: '담다 비즈니스센터 가입 계정을 연결했습니다.',
      }
      message.success(labels[variables.action])
      setRevisionOpen(false)
      setRevisionNote('')
      refresh()
      if (variables.action === 'approve' && typeof result === 'string') navigate(`/vendors/${result}`)
    },
    onError: (error: Error) => message.error(error.message),
  })

  const updateBaseMutation = useMutation({
    mutationFn: (values: PartnerOnboardingInput) => updatePartnerOnboarding(id, values),
    onSuccess: () => { message.success('기본정보가 저장되었습니다.'); refresh() },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteProductMutation = useMutation({
    mutationFn: deletePartnerProduct,
    onSuccess: () => { message.success('상품이 삭제되었습니다.'); refresh() },
    onError: (error: Error) => message.error(error.message),
  })

  const checks = useMemo(() => {
    if (!onboarding) return []
    const documents = onboarding.documents || []
    return [
      { label: '필수서류', complete: ['business_registration', 'bank_account'].every((type) => documents.some((doc) => doc.document_type === type)) },
      { label: '상품 등록', complete: (onboarding.products?.length || 0) > 0 },
      { label: '콘솔 가입', complete: !!onboarding.signup_request_id },
      { label: '전자계약', complete: onboarding.contract_status === 'completed' },
      { label: '승인 준비', complete: onboarding.status === 'ready_for_approval' || onboarding.status === 'approved' },
    ]
  }, [onboarding])
  const prerequisitesReady = checks.slice(0, 4).every((check) => check.complete)

  if (onboardingQuery.isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (onboardingQuery.error || !onboarding) {
    return <Result status="error" title="입점 신청을 불러오지 못했습니다." subTitle={(onboardingQuery.error as Error)?.message} extra={<Button onClick={() => navigate(basePath)}>목록으로</Button>} />
  }
  const readOnly = isSales && ['approving', 'approved', 'rejected'].includes(onboarding.status)
  const businessSiteBase = import.meta.env.VITE_BUSINESS_SITE_URL || (import.meta.env.DEV ? 'http://localhost:3002' : '')
  const businessSignupUrl = businessSiteBase
    ? `${businessSiteBase.replace(/\/$/, '')}/signup?ownerCode=${encodeURIComponent(onboarding.owner_code)}&businessNumber=${encodeURIComponent(onboarding.business_number)}`
    : ''

  const documentTab = (
    <div className="partner-document-grid">
      {(Object.keys(documentMeta) as PartnerOnboardingDocument['document_type'][]).map((type) => {
        const document = onboarding.documents?.find((item) => item.document_type === type)
        const meta = documentMeta[type]
        return (
          <div className="partner-document-card" key={type}>
            <div><Typography.Text strong>{meta.title}</Typography.Text><div className="muted">{meta.description}</div></div>
            <div className="partner-document-preview">
              {document?.preview_url && document.mime_type?.startsWith('image/') ? (
                <Image src={document.preview_url} alt={meta.title} />
              ) : document ? (
                <Space direction="vertical" align="center"><FileProtectOutlined style={{ fontSize: 40, color: '#34b7b1' }} /><span>{document.file_name}</span></Space>
              ) : (
                <Space direction="vertical" align="center"><FileImageOutlined style={{ fontSize: 40, color: '#bfbfbf' }} /><span className="muted">등록된 파일이 없습니다.</span></Space>
              )}
            </div>
            <Upload
              accept="image/*,.pdf,.heic"
              capture="environment"
              showUploadList={false}
              disabled={readOnly}
              beforeUpload={async (file) => {
                try {
                  await uploadPartnerDocument(id, type, file)
                  message.success(`${meta.title}이 등록되었습니다.`)
                  refresh()
                } catch (error) {
                  message.error(error instanceof Error ? error.message : '업로드에 실패했습니다.')
                }
                return false
              }}
            >
              <Button block icon={<CloudUploadOutlined />} disabled={readOnly}>{document ? '다시 촬영·교체' : '촬영·업로드'}</Button>
            </Upload>
          </div>
        )
      })}
    </div>
  )

  const productTab = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <div><Typography.Title level={4} style={{ margin: 0 }}>등록 예정 상품</Typography.Title><Typography.Text type="secondary">입점 승인 시 비노출 상태로 자동 생성됩니다.</Typography.Text></div>
        <Button type="primary" icon={<PlusOutlined />} disabled={readOnly || (onboarding.products?.length || 0) >= 10} onClick={() => { setEditingProduct(null); setProductEditorOpen(true) }}>상품 추가 ({onboarding.products?.length || 0}/10)</Button>
      </div>
      {!onboarding.products?.length ? <Empty description="등록된 상품이 없습니다." /> : (
        <div className="partner-product-list">
          {onboarding.products.map((product) => (
            <Card key={product.id} size="small">
              <div className="partner-product-card">
                <img src={product.thumbnail} alt={product.name} />
                <div className="partner-product-card-content">
                  <h4>{product.name}</h4>
                  <Typography.Text type="secondary">{product.sale_price.toLocaleString()}원 · {product.min_participants}~{product.max_participants}명</Typography.Text>
                  <div className="partner-product-card-actions">
                    <Button size="small" icon={<EditOutlined />} disabled={readOnly} onClick={() => { setEditingProduct(product); setProductEditorOpen(true) }}>수정</Button>
                    <Popconfirm title="상품을 삭제할까요?" onConfirm={() => deleteProductMutation.mutate(product.id)}>
                      <Button size="small" danger icon={<DeleteOutlined />} disabled={readOnly}>삭제</Button>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )

  const accountContractTab = (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title={<Space><UserAddOutlined />담다 비즈니스센터 가입 매칭</Space>}>
          <Alert type="info" showIcon style={{ marginBottom: 12 }} message={`사업주 코드: ${onboarding.owner_code}`} description="현장에서 담다 비즈니스센터 회원가입 시 이 코드와 동일한 사업자번호를 입력해주세요." />
          <Space wrap style={{ marginBottom: 12 }}>
            <Button onClick={() => navigator.clipboard.writeText(onboarding.owner_code)}>코드 복사</Button>
            {businessSignupUrl && <Button type="primary" href={businessSignupUrl} target="_blank" icon={<LinkOutlined />}>담다 비즈니스센터 가입 열기</Button>}
          </Space>
          {onboarding.signup_request ? (
            <Alert
              type="success"
              showIcon
              message="동일 사업자번호의 가입 계정이 연결되었습니다."
              description={`${onboarding.signup_request.email} · ${onboarding.signup_request.contact_name}`}
            />
          ) : (
            <>
              <Typography.Paragraph type="secondary">담다 비즈니스센터에서 회원가입하면 동일한 사업자번호의 가입 요청이 표시됩니다.</Typography.Paragraph>
              <Button icon={<ReloadOutlined />} onClick={() => candidatesQuery.refetch()} loading={candidatesQuery.isFetching}>가입 요청 다시 조회</Button>
              <List
                style={{ marginTop: 12 }}
                dataSource={candidatesQuery.data || []}
                locale={{ emptyText: '일치하는 가입 요청이 없습니다.' }}
                renderItem={(candidate) => (
                  <List.Item actions={[<Button key="link" type="primary" size="small" icon={<LinkOutlined />} onClick={() => actionMutation.mutate({ action: 'link', payload: candidate.id })}>연결</Button>]}>
                    <List.Item.Meta title={candidate.email} description={`${candidate.business_name} · ${candidate.contact_name} · ${candidate.business_number}`} />
                  </List.Item>
                )}
              />
            </>
          )}
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title={<Space><FileProtectOutlined />싸인오케이 계약</Space>}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="계약 상태"><Tag color={CONTRACT_STATUS[onboarding.contract_status].color}>{CONTRACT_STATUS[onboarding.contract_status].label}</Tag></Descriptions.Item>
            <Descriptions.Item label="계약 ID">{onboarding.contract_external_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="발송일">{onboarding.contract_sent_at ? dayjs(onboarding.contract_sent_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="완료일">{onboarding.contract_completed_at ? dayjs(onboarding.contract_completed_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
          </Descriptions>
          <Alert style={{ margin: '12px 0' }} type="info" showIcon message="현재는 API 연동 전 단계입니다." description="버튼을 누르면 발송 요청으로 저장되며, 싸인오케이 API 키 연결 후 자동 발송됩니다." />
          <Button
            type="primary"
            icon={<SendOutlined />}
            disabled={!['not_sent', 'failed', 'expired'].includes(onboarding.contract_status)}
            loading={actionMutation.isPending}
            onClick={() => actionMutation.mutate({ action: 'contract' })}
          >계약서 발송 요청</Button>
        </Card>
      </Col>
    </Row>
  )

  const reviewTab = (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card title="승인 조건">
          <div className="partner-progress">
            {checks.map((check) => <div key={check.label} className={`partner-progress-item ${check.complete ? 'complete' : ''}`}><CheckCircleOutlined /><strong>{check.label}</strong>{check.complete ? '완료' : '대기'}</div>)}
          </div>
          {!prerequisitesReady && <Alert type="warning" showIcon message="필수 조건이 남아 있습니다." description="서류, 상품, 콘솔 가입 연결, 전자계약 완료 후 입점 승인할 수 있습니다." />}
          <Space wrap style={{ marginTop: 16 }}>
            <Button danger onClick={() => setRevisionOpen(true)}>수정 요청</Button>
            <Button disabled={!prerequisitesReady || onboarding.status === 'ready_for_approval'} onClick={() => actionMutation.mutate({ action: 'ready' })}>검수 완료</Button>
            <Popconfirm title="사업주와 상품을 생성하고 입점을 승인할까요?" onConfirm={() => actionMutation.mutate({ action: 'approve' })}>
              <Button type="primary" icon={<CheckCircleOutlined />} disabled={onboarding.status !== 'ready_for_approval'} loading={actionMutation.isPending}>입점 승인</Button>
            </Popconfirm>
          </Space>
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card title="처리 이력">
          <Timeline items={(historyQuery.data || []).map((item) => ({ children: <div><b>{item.action}</b><div>{item.note || '-'}</div><span className="muted">{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span></div> }))} />
        </Card>
      </Col>
    </Row>
  )

  const salesStatusTab = (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card title="진행 상태">
          <div className="partner-progress">
            {checks.map((check) => <div key={check.label} className={`partner-progress-item ${check.complete ? 'complete' : ''}`}><CheckCircleOutlined /><strong>{check.label}</strong>{check.complete ? '완료' : '대기'}</div>)}
          </div>
          {onboarding.status === 'revision_requested' && (
            <Alert type="warning" showIcon message="관리자가 수정을 요청했습니다." description={onboarding.revision_note || '수정 요청 내용을 관리자에게 확인해주세요.'} />
          )}
          {onboarding.status === 'approved' && <Alert type="success" showIcon message="입점 승인이 완료되었습니다." description="사업주와 상품이 생성되었고 담다 비즈니스센터 로그인이 활성화되었습니다." />}
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card title="처리 이력">
          <Timeline items={(historyQuery.data || []).map((item) => ({ children: <div><b>{item.action}</b><div>{item.note || '-'}</div><span className="muted">{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span></div> }))} />
        </Card>
      </Col>
    </Row>
  )

  return (
    <div className="partner-page">
      <div className="partner-page-header">
        <div>
          <div className="partner-detail-title">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(basePath)} />
            <Typography.Title level={2}>{onboarding.business_name}</Typography.Title>
            <Tag color={ONBOARDING_STATUS[onboarding.status].color}>{ONBOARDING_STATUS[onboarding.status].label}</Tag>
          </div>
          <Typography.Text type="secondary">{onboarding.business_number} · {onboarding.contact_name} · 최근 저장 {dayjs(onboarding.updated_at).format('YYYY-MM-DD HH:mm')}</Typography.Text>
        </div>
        <div className="partner-detail-actions">
          <Button icon={<SendOutlined />} onClick={() => actionMutation.mutate({ action: 'contract' })} disabled={!['not_sent', 'failed', 'expired'].includes(onboarding.contract_status)}>계약 발송</Button>
          {!isSales && <Button type="primary" icon={<CheckCircleOutlined />} disabled={onboarding.status !== 'ready_for_approval'} onClick={() => actionMutation.mutate({ action: 'approve' })}>입점 승인</Button>}
        </div>
      </div>

      <div className="partner-progress">
        {checks.map((check) => <div key={check.label} className={`partner-progress-item ${check.complete ? 'complete' : ''}`}><CheckCircleOutlined /><strong>{check.label}</strong>{check.complete ? '완료' : '대기'}</div>)}
      </div>

      <Tabs
        items={[
          { key: 'basic', label: <Space><ShopOutlined />기본정보</Space>, children: <PartnerOnboardingBaseForm initialValues={onboarding} submitLabel="기본정보 저장" disabled={readOnly} submitting={updateBaseMutation.isPending} onSubmit={(values) => updateBaseMutation.mutate(values)} /> },
          { key: 'documents', label: `제출서류 ${onboarding.documents?.length || 0}/2`, children: documentTab },
          { key: 'products', label: `상품 ${onboarding.products?.length || 0}`, children: productTab },
          { key: 'account-contract', label: '가입·계약', children: accountContractTab },
          { key: 'review', label: isSales ? '진행 상태' : '검수·승인', children: isSales ? salesStatusTab : reviewTab },
        ]}
      />

      <ProductEditor
        key={editingProduct?.id || 'new'}
        open={productEditorOpen}
        product={editingProduct}
        onboardingId={id}
        onClose={() => setProductEditorOpen(false)}
        onSaved={refresh}
      />
      <Modal
        title="수정 요청"
        open={revisionOpen}
        okText="수정 요청 보내기"
        cancelText="취소"
        okButtonProps={{ danger: true, disabled: !revisionNote.trim() }}
        confirmLoading={actionMutation.isPending}
        onCancel={() => setRevisionOpen(false)}
        onOk={() => actionMutation.mutate({ action: 'revision', payload: revisionNote })}
      >
        <Input.TextArea rows={5} value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} placeholder="수정이 필요한 항목과 이유를 입력해주세요." />
      </Modal>
      {!isSales && <div className="partner-mobile-sticky">
        <Button type="primary" icon={<CheckCircleOutlined />} disabled={onboarding.status !== 'ready_for_approval'} onClick={() => actionMutation.mutate({ action: 'approve' })}>입점 승인</Button>
      </div>}
    </div>
  )
}
