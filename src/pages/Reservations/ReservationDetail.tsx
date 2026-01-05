import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tabs,
  Descriptions,
  Button,
  Tag,
  Table,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Spin,
  Divider,
  Card,
  Timeline,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import {
  getReservation,
  getPayment,
  getRefunds,
  updateReservationStatus,
  updateReservationMemo,
  processRefund,
} from '@/services/reservationService'
import { useAuthStore } from '@/stores/authStore'
import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_COLOR,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
  PAYMENT_METHOD_LABEL,
  REFUND_STATUS_LABEL,
  REFUND_STATUS_COLOR,
  DATE_FORMAT,
  DATETIME_FORMAT,
} from '@/constants'
import type { ReservationOption, Refund, ReservationStatusType } from '@/types'

const { Text, Title } = Typography
const { TextArea } = Input

export function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { admin } = useAuthStore()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false)

  const [cancelForm] = Form.useForm()
  const [refundForm] = Form.useForm()
  const [memoForm] = Form.useForm()

  // 예약 정보 조회
  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => getReservation(id!),
    enabled: !!id,
  })

  // 결제 정보 조회
  const { data: payment } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => getPayment(id!),
    enabled: !!id,
  })

  // 환불 내역 조회
  const { data: refunds } = useQuery({
    queryKey: ['refunds', id],
    queryFn: () => getRefunds(id!),
    enabled: !!id,
  })

  // 상태 변경
  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: ReservationStatusType; reason?: string }) =>
      updateReservationStatus(id!, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['reservationStats'] })
      message.success('상태가 변경되었습니다')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  // 메모 수정
  const memoMutation = useMutation({
    mutationFn: (memo: string) => updateReservationMemo(id!, memo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] })
      setIsMemoModalOpen(false)
      message.success('메모가 저장되었습니다')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  // 환불 처리
  const refundMutation = useMutation({
    mutationFn: (values: { refund_amount: number; reason: string; admin_memo: string }) =>
      processRefund(id!, payment!.id, values.refund_amount, values.reason, values.admin_memo, admin!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] })
      queryClient.invalidateQueries({ queryKey: ['payment', id] })
      queryClient.invalidateQueries({ queryKey: ['refunds', id] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['reservationStats'] })
      setIsRefundModalOpen(false)
      refundForm.resetFields()
      message.success('환불이 처리되었습니다')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const handleConfirm = () => {
    Modal.confirm({
      title: '예약 확정',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: '이 예약을 확정하시겠습니까?',
      okText: '확정',
      cancelText: '취소',
      onOk: () => statusMutation.mutate({ status: 'confirmed' }),
    })
  }

  const handleComplete = () => {
    Modal.confirm({
      title: '이용 완료',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: '이 예약을 이용완료 처리하시겠습니까?',
      okText: '완료',
      cancelText: '취소',
      onOk: () => statusMutation.mutate({ status: 'completed' }),
    })
  }

  const handleCancelSubmit = async () => {
    try {
      const values = await cancelForm.validateFields()
      statusMutation.mutate(
        { status: 'cancelled', reason: values.reason },
        {
          onSuccess: () => {
            setIsCancelModalOpen(false)
            cancelForm.resetFields()
          },
        }
      )
    } catch {
      // validation error
    }
  }

  const handleRefundSubmit = async () => {
    try {
      const values = await refundForm.validateFields()
      refundMutation.mutate(values)
    } catch {
      // validation error
    }
  }

  const handleMemoSubmit = async () => {
    try {
      const values = await memoForm.validateFields()
      memoMutation.mutate(values.memo)
    } catch {
      // validation error
    }
  }

  const optionColumns: ColumnsType<ReservationOption> = [
    {
      title: '옵션명',
      key: 'name',
      render: (_, record) => record.product_option?.name || '-',
    },
    {
      title: '단가',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => `${price.toLocaleString()}원`,
    },
    {
      title: '수량',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty: number) => `${qty}개`,
    },
    {
      title: '소계',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (subtotal: number) => <strong>{subtotal.toLocaleString()}원</strong>,
    },
  ]

  const refundColumns: ColumnsType<Refund> = [
    {
      title: '처리일시',
      dataIndex: 'refunded_at',
      key: 'refunded_at',
      render: (date: string | null) => (date ? dayjs(date).format(DATETIME_FORMAT) : '-'),
    },
    {
      title: '원금액',
      dataIndex: 'original_amount',
      key: 'original_amount',
      render: (amount: number) => `${amount.toLocaleString()}원`,
    },
    {
      title: '환불금액',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      render: (amount: number) => <strong style={{ color: '#ff4d4f' }}>-{amount.toLocaleString()}원</strong>,
    },
    {
      title: '사유',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string | null) => reason || '-',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={REFUND_STATUS_COLOR[status]}>{REFUND_STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: '처리자',
      key: 'admin',
      render: (_, record) => record.admin?.name || '-',
    },
  ]

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!reservation) {
    return <div>예약을 찾을 수 없습니다</div>
  }

  const canConfirm = reservation.status === 'paid'
  const canComplete = reservation.status === 'confirmed'
  const canCancel = ['pending', 'paid', 'confirmed'].includes(reservation.status)
  const canRefund = payment && payment.status === 'paid' && !['cancelled', 'refunded'].includes(reservation.status)

  const tabItems = [
    {
      key: 'info',
      label: '예약 정보',
      children: (
        <>
          {/* 액션 버튼 */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {canConfirm && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirm}
                loading={statusMutation.isPending}
              >
                예약 확정
              </Button>
            )}
            {canComplete && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleComplete}
                loading={statusMutation.isPending}
                style={{ backgroundColor: '#52c41a' }}
              >
                이용 완료
              </Button>
            )}
            {canCancel && (
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setIsCancelModalOpen(true)}
              >
                예약 취소
              </Button>
            )}
            {canRefund && (
              <Button
                icon={<DollarOutlined />}
                onClick={() => {
                  refundForm.setFieldsValue({ refund_amount: payment.amount })
                  setIsRefundModalOpen(true)
                }}
              >
                환불 처리
              </Button>
            )}
          </div>

          {/* 기본 정보 */}
          <Card title="기본 정보" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="예약번호">
                <Text strong>{reservation.reservation_number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="상태">
                <Tag color={RESERVATION_STATUS_COLOR[reservation.status]}>
                  {RESERVATION_STATUS_LABEL[reservation.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="예약일">
                {dayjs(reservation.reserved_date).format(DATE_FORMAT)}
              </Descriptions.Item>
              <Descriptions.Item label="예약시간">
                {reservation.reserved_time || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="인원">{reservation.participant_count}명</Descriptions.Item>
              <Descriptions.Item label="결제금액">
                <Text strong style={{ color: '#1890ff' }}>
                  {reservation.total_amount.toLocaleString()}원
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="예약신청일" span={2}>
                {dayjs(reservation.created_at).format(DATETIME_FORMAT)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 상품 정보 */}
          <Card title="상품 정보" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="상품명" span={2}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {reservation.product?.thumbnail && (
                    <img
                      src={reservation.product.thumbnail}
                      alt=""
                      style={{ width: 60, height: 60, borderRadius: 4, objectFit: 'cover' }}
                    />
                  )}
                  <span>{reservation.product?.name || '-'}</span>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="사업주">
                {reservation.business_owner?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="연락처">
                {reservation.business_owner?.contact_phone || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 예약자 정보 */}
          <Card title="예약자 정보 (어린이집)" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="어린이집명">{reservation.daycare?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="담당자">{reservation.daycare?.contact_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="연락처">{reservation.daycare?.contact_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="이메일">{reservation.daycare?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="주소" span={2}>
                {reservation.daycare?.address || '-'}
                {reservation.daycare?.address_detail && ` ${reservation.daycare.address_detail}`}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 옵션 정보 */}
          {reservation.options && reservation.options.length > 0 && (
            <Card title="옵션 상세" size="small" style={{ marginBottom: 16 }}>
              <Table
                columns={optionColumns}
                dataSource={reservation.options}
                rowKey="id"
                size="small"
                bordered
                pagination={false}
              />
            </Card>
          )}

          {/* 메모 */}
          <Card
            title="관리자 메모"
            size="small"
            extra={
              <Button size="small" onClick={() => {
                memoForm.setFieldsValue({ memo: reservation.memo || '' })
                setIsMemoModalOpen(true)
              }}>
                수정
              </Button>
            }
          >
            <Text type={reservation.memo ? undefined : 'secondary'}>
              {reservation.memo || '등록된 메모가 없습니다'}
            </Text>
          </Card>

          {/* 취소 정보 */}
          {reservation.cancel_reason && (
            <Card
              title="취소 정보"
              size="small"
              style={{ marginTop: 16, borderColor: '#ff4d4f' }}
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="취소일시">
                  {reservation.cancelled_at ? dayjs(reservation.cancelled_at).format(DATETIME_FORMAT) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="취소사유">{reservation.cancel_reason}</Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </>
      ),
    },
    {
      key: 'payment',
      label: '결제 정보',
      children: (
        <>
          {payment ? (
            <Card title="결제 내역" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="결제상태">
                  <Tag color={PAYMENT_STATUS_COLOR[payment.status]}>
                    {PAYMENT_STATUS_LABEL[payment.status]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="결제수단">
                  {PAYMENT_METHOD_LABEL[payment.payment_method] || payment.payment_method}
                </Descriptions.Item>
                <Descriptions.Item label="결제금액">
                  <Text strong>{payment.amount.toLocaleString()}원</Text>
                </Descriptions.Item>
                <Descriptions.Item label="결제일시">
                  {payment.paid_at ? dayjs(payment.paid_at).format(DATETIME_FORMAT) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="PG사">{payment.pg_provider}</Descriptions.Item>
                <Descriptions.Item label="거래번호">{payment.pg_tid || '-'}</Descriptions.Item>
                {payment.receipt_url && (
                  <Descriptions.Item label="영수증" span={2}>
                    <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                      영수증 보기
                    </a>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          ) : (
            <Card size="small">
              <Text type="secondary">결제 정보가 없습니다</Text>
            </Card>
          )}

          {/* 환불 내역 */}
          {refunds && refunds.length > 0 && (
            <Card title="환불 내역" size="small">
              <Table
                columns={refundColumns}
                dataSource={refunds}
                rowKey="id"
                size="small"
                bordered
                pagination={false}
              />
            </Card>
          )}
        </>
      ),
    },
    {
      key: 'history',
      label: '변경 이력',
      children: (
        <Card size="small">
          <Timeline
            items={[
              {
                color: 'green',
                children: (
                  <div>
                    <Text strong>예약 생성</Text>
                    <br />
                    <Text type="secondary">{dayjs(reservation.created_at).format(DATETIME_FORMAT)}</Text>
                  </div>
                ),
              },
              ...(reservation.cancelled_at
                ? [
                    {
                      color: 'red',
                      children: (
                        <div>
                          <Text strong>예약 취소</Text>
                          <br />
                          <Text type="secondary">{dayjs(reservation.cancelled_at).format(DATETIME_FORMAT)}</Text>
                          {reservation.cancel_reason && (
                            <>
                              <br />
                              <Text>사유: {reservation.cancel_reason}</Text>
                            </>
                          )}
                        </div>
                      ),
                    },
                  ]
                : []),
              {
                color: 'blue',
                children: (
                  <div>
                    <Text strong>마지막 수정</Text>
                    <br />
                    <Text type="secondary">{dayjs(reservation.updated_at).format(DATETIME_FORMAT)}</Text>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          예약 상세
        </Title>
        <Tag color={RESERVATION_STATUS_COLOR[reservation.status]} style={{ marginLeft: 8 }}>
          {RESERVATION_STATUS_LABEL[reservation.status]}
        </Tag>
      </div>

      <Tabs items={tabItems} />

      <Divider />

      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reservations')}>
        목록으로
      </Button>

      {/* 취소 모달 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            예약 취소
          </Space>
        }
        open={isCancelModalOpen}
        onOk={handleCancelSubmit}
        onCancel={() => {
          setIsCancelModalOpen(false)
          cancelForm.resetFields()
        }}
        confirmLoading={statusMutation.isPending}
        okText="취소 처리"
        okButtonProps={{ danger: true }}
        cancelText="닫기"
      >
        <Form form={cancelForm} layout="vertical">
          <Form.Item
            name="reason"
            label="취소 사유"
            rules={[{ required: true, message: '취소 사유를 입력하세요' }]}
          >
            <TextArea rows={3} placeholder="취소 사유를 입력하세요" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 환불 모달 */}
      <Modal
        title="환불 처리"
        open={isRefundModalOpen}
        onOk={handleRefundSubmit}
        onCancel={() => {
          setIsRefundModalOpen(false)
          refundForm.resetFields()
        }}
        confirmLoading={refundMutation.isPending}
        okText="환불 처리"
        cancelText="취소"
      >
        <Form form={refundForm} layout="vertical">
          <Form.Item label="결제 금액">
            <Text strong>{payment?.amount.toLocaleString()}원</Text>
          </Form.Item>
          <Form.Item
            name="refund_amount"
            label="환불 금액"
            rules={[
              { required: true, message: '환불 금액을 입력하세요' },
              {
                type: 'number',
                min: 1,
                max: payment?.amount || 0,
                message: `1 ~ ${payment?.amount.toLocaleString()}원 사이여야 합니다`,
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0)}
              addonAfter="원"
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="환불 사유"
            rules={[{ required: true, message: '환불 사유를 입력하세요' }]}
          >
            <TextArea rows={2} placeholder="환불 사유를 입력하세요" />
          </Form.Item>
          <Form.Item name="admin_memo" label="관리자 메모">
            <TextArea rows={2} placeholder="내부 참고용 메모" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 메모 모달 */}
      <Modal
        title="메모 수정"
        open={isMemoModalOpen}
        onOk={handleMemoSubmit}
        onCancel={() => {
          setIsMemoModalOpen(false)
          memoForm.resetFields()
        }}
        confirmLoading={memoMutation.isPending}
        okText="저장"
        cancelText="취소"
      >
        <Form form={memoForm} layout="vertical">
          <Form.Item name="memo" label="메모">
            <TextArea rows={4} placeholder="관리자 메모를 입력하세요" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
