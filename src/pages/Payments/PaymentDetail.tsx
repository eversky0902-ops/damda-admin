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
  DollarOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import { getPayment, processRefund } from '@/services/paymentService'
import { useAuthStore } from '@/stores/authStore'
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
  PAYMENT_METHOD_LABEL,
  REFUND_STATUS_LABEL,
  REFUND_STATUS_COLOR,
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_COLOR,
  DATE_FORMAT,
  DATETIME_FORMAT,
} from '@/constants'
import type { Refund, ReservationOption } from '@/types'

const { Text, Title } = Typography
const { TextArea } = Input

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { admin } = useAuthStore()

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [refundForm] = Form.useForm()

  // 결제 정보 조회
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => getPayment(id!),
    enabled: !!id,
  })

  // 환불 처리
  const refundMutation = useMutation({
    mutationFn: (values: { refund_amount: number; reason: string; admin_memo: string }) =>
      processRefund(
        id!,
        payment!.reservation!.id,
        values.refund_amount,
        values.reason,
        values.admin_memo,
        admin!.id
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['paymentStats'] })
      setIsRefundModalOpen(false)
      refundForm.resetFields()
      message.success('환불이 처리되었습니다')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const handleRefundSubmit = async () => {
    try {
      const values = await refundForm.validateFields()
      refundMutation.mutate(values)
    } catch {
      // validation error
    }
  }

  const refundColumns: ColumnsType<Refund> = [
    {
      title: '처리일시',
      dataIndex: 'refunded_at',
      key: 'refunded_at',
      width: 160,
      render: (date: string | null) => (date ? dayjs(date).format(DATETIME_FORMAT) : '-'),
    },
    {
      title: '원금액',
      dataIndex: 'original_amount',
      key: 'original_amount',
      width: 120,
      align: 'right',
      render: (amount: number) => `${amount.toLocaleString()}원`,
    },
    {
      title: '환불금액',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      width: 120,
      align: 'right',
      render: (amount: number) => <strong style={{ color: '#ff4d4f' }}>-{amount.toLocaleString()}원</strong>,
    },
    {
      title: '사유',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string | null) => reason || '-',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={REFUND_STATUS_COLOR[status]}>{REFUND_STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: '처리자',
      key: 'admin',
      width: 100,
      render: (_, record) => record.admin?.name || '-',
    },
    {
      title: '관리자 메모',
      dataIndex: 'admin_memo',
      key: 'admin_memo',
      ellipsis: true,
      render: (memo: string | null) => memo || '-',
    },
  ]

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
      width: 100,
      align: 'right',
      render: (price: number) => `${price.toLocaleString()}원`,
    },
    {
      title: '수량',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
      render: (qty: number) => `${qty}개`,
    },
    {
      title: '소계',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (subtotal: number) => <strong>{subtotal.toLocaleString()}원</strong>,
    },
  ]

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!payment) {
    return <div>결제 정보를 찾을 수 없습니다</div>
  }

  const reservation = payment.reservation
  const canRefund = payment.status === 'paid' && reservation && !['cancelled', 'refunded'].includes(reservation.status)
  const totalRefunded = payment.refunds?.reduce((sum, r) => sum + r.refund_amount, 0) || 0
  const remainingAmount = payment.amount - totalRefunded

  const tabItems = [
    {
      key: 'info',
      label: '결제 정보',
      children: (
        <>
          {/* 액션 버튼 */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {canRefund && remainingAmount > 0 && (
              <Button
                icon={<DollarOutlined />}
                onClick={() => {
                  refundForm.setFieldsValue({ refund_amount: remainingAmount })
                  setIsRefundModalOpen(true)
                }}
              >
                환불 처리
              </Button>
            )}
            {payment.receipt_url && (
              <Button
                icon={<LinkOutlined />}
                href={payment.receipt_url}
                target="_blank"
              >
                영수증 보기
              </Button>
            )}
          </div>

          {/* 결제 정보 */}
          <Card title="결제 상세" size="small" style={{ marginBottom: 16 }}>
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
                <Text strong style={{ fontSize: 16, color: '#1677ff' }}>
                  {payment.amount.toLocaleString()}원
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="환불금액">
                {totalRefunded > 0 ? (
                  <Text strong style={{ color: '#ff4d4f' }}>
                    -{totalRefunded.toLocaleString()}원
                  </Text>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="결제일시">
                {payment.paid_at ? dayjs(payment.paid_at).format(DATETIME_FORMAT) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="결제요청일">
                {dayjs(payment.created_at).format(DATETIME_FORMAT)}
              </Descriptions.Item>
              <Descriptions.Item label="PG사">{payment.pg_provider}</Descriptions.Item>
              <Descriptions.Item label="거래번호(TID)">{payment.pg_tid || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 예약 정보 */}
          {reservation && (
            <Card
              title="연결된 예약"
              size="small"
              style={{ marginBottom: 16 }}
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(`/reservations/${reservation.id}`)}
                >
                  예약 상세 보기
                </Button>
              }
            >
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="예약번호">
                  <Text strong>{reservation.reservation_number}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="예약상태">
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
                <Descriptions.Item label="예약금액">
                  {reservation.total_amount.toLocaleString()}원
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* 상품 정보 */}
          {reservation?.product && (
            <Card title="상품 정보" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="상품명" span={2}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {reservation.product.thumbnail && (
                      <img
                        src={reservation.product.thumbnail}
                        alt=""
                        style={{ width: 60, height: 60, borderRadius: 4, objectFit: 'cover' }}
                      />
                    )}
                    <a onClick={() => navigate(`/products/${reservation.product?.id}`)}>
                      {reservation.product.name}
                    </a>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="사업주">
                  <a onClick={() => navigate(`/vendors/${reservation.business_owner?.id}`)}>
                    {reservation.business_owner?.name || '-'}
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="연락처">
                  {reservation.business_owner?.contact_phone || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* 구매자 정보 */}
          {reservation?.daycare && (
            <Card title="구매자 정보 (어린이집)" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="어린이집명">
                  <a onClick={() => navigate(`/members/${reservation.daycare?.id}`)}>
                    {reservation.daycare.name}
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="담당자">{reservation.daycare.contact_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="연락처">{reservation.daycare.contact_phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="이메일">{reservation.daycare.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="주소" span={2}>
                  {reservation.daycare.address || '-'}
                  {reservation.daycare.address_detail && ` ${reservation.daycare.address_detail}`}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* 옵션 정보 */}
          {reservation?.options && reservation.options.length > 0 && (
            <Card title="결제 옵션 상세" size="small">
              <Table
                columns={optionColumns}
                dataSource={reservation.options}
                rowKey="id"
                size="small"
                bordered
                pagination={false}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <strong>합계</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong style={{ color: '#1677ff' }}>
                        {reservation.options!.reduce((sum, opt) => sum + opt.subtotal, 0).toLocaleString()}원
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>
          )}
        </>
      ),
    },
    {
      key: 'refunds',
      label: `환불 내역 (${payment.refunds?.length || 0})`,
      children: (
        <>
          {payment.refunds && payment.refunds.length > 0 ? (
            <>
              {/* 환불 요약 */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={3} size="small">
                  <Descriptions.Item label="원결제금액">
                    {payment.amount.toLocaleString()}원
                  </Descriptions.Item>
                  <Descriptions.Item label="총 환불금액">
                    <Text type="danger">-{totalRefunded.toLocaleString()}원</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="잔여금액">
                    <Text strong>{remainingAmount.toLocaleString()}원</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 환불 내역 */}
              <Card title="환불 상세 내역" size="small">
                <Table
                  columns={refundColumns}
                  dataSource={payment.refunds}
                  rowKey="id"
                  size="small"
                  bordered
                  pagination={false}
                />
              </Card>
            </>
          ) : (
            <Card size="small">
              <Text type="secondary">환불 내역이 없습니다</Text>
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
                color: 'blue',
                children: (
                  <div>
                    <Text strong>결제 요청</Text>
                    <br />
                    <Text type="secondary">{dayjs(payment.created_at).format(DATETIME_FORMAT)}</Text>
                  </div>
                ),
              },
              ...(payment.paid_at
                ? [
                    {
                      color: 'green',
                      children: (
                        <div>
                          <Text strong>결제 완료</Text>
                          <br />
                          <Text type="secondary">{dayjs(payment.paid_at).format(DATETIME_FORMAT)}</Text>
                          <br />
                          <Text>금액: {payment.amount.toLocaleString()}원</Text>
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(payment.refunds || []).map((refund) => ({
                color: 'orange' as const,
                children: (
                  <div>
                    <Text strong>환불 처리</Text>
                    <br />
                    <Text type="secondary">
                      {refund.refunded_at ? dayjs(refund.refunded_at).format(DATETIME_FORMAT) : '-'}
                    </Text>
                    <br />
                    <Text>환불금액: -{refund.refund_amount.toLocaleString()}원</Text>
                    {refund.reason && (
                      <>
                        <br />
                        <Text>사유: {refund.reason}</Text>
                      </>
                    )}
                    {refund.admin?.name && (
                      <>
                        <br />
                        <Text type="secondary">처리자: {refund.admin.name}</Text>
                      </>
                    )}
                  </div>
                ),
              })),
              {
                color: 'gray',
                children: (
                  <div>
                    <Text strong>마지막 수정</Text>
                    <br />
                    <Text type="secondary">{dayjs(payment.updated_at).format(DATETIME_FORMAT)}</Text>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'raw',
      label: 'PG 응답 데이터',
      children: (
        <Card size="small">
          {payment.raw_data ? (
            <pre style={{
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 6,
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 400,
            }}>
              {JSON.stringify(payment.raw_data, null, 2)}
            </pre>
          ) : (
            <Text type="secondary">PG 응답 데이터가 없습니다</Text>
          )}
        </Card>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          결제 상세
        </Title>
        <Tag color={PAYMENT_STATUS_COLOR[payment.status]} style={{ marginLeft: 8 }}>
          {PAYMENT_STATUS_LABEL[payment.status]}
        </Tag>
        <Text type="secondary" style={{ marginLeft: 'auto' }}>
          {payment.pg_tid && `TID: ${payment.pg_tid}`}
        </Text>
      </div>

      <Tabs items={tabItems} />

      <Divider />

      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payments')}>
        목록으로
      </Button>

      {/* 환불 모달 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            환불 처리
          </Space>
        }
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
            <Text strong>{payment.amount.toLocaleString()}원</Text>
          </Form.Item>
          {totalRefunded > 0 && (
            <Form.Item label="기 환불 금액">
              <Text type="danger">-{totalRefunded.toLocaleString()}원</Text>
            </Form.Item>
          )}
          <Form.Item label="환불 가능 금액">
            <Text strong style={{ color: '#1677ff' }}>{remainingAmount.toLocaleString()}원</Text>
          </Form.Item>
          <Form.Item
            name="refund_amount"
            label="환불 금액"
            rules={[
              { required: true, message: '환불 금액을 입력하세요' },
              {
                type: 'number',
                min: 1,
                max: remainingAmount,
                message: `1 ~ ${remainingAmount.toLocaleString()}원 사이여야 합니다`,
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
            <TextArea rows={2} placeholder="고객에게 안내될 환불 사유를 입력하세요" />
          </Form.Item>
          <Form.Item name="admin_memo" label="관리자 메모">
            <TextArea rows={2} placeholder="내부 참고용 메모 (고객에게 노출되지 않음)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
