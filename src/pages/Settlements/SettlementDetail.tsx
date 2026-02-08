import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, message, Popconfirm, Space, Table } from 'antd'
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import { getSettlement, completeSettlement, deleteSettlement, getPaymentsForSettlement, type SettlementPayment } from '@/services/settlementService'
import { DATE_FORMAT } from '@/constants'
import { downloadExcel, formatSettlementPaymentsForExcel, SETTLEMENT_PAYMENT_EXCEL_COLUMNS } from '@/utils/excel'

export function SettlementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: settlement, isLoading } = useQuery({
    queryKey: ['settlement', id],
    queryFn: () => getSettlement(id!),
    enabled: !!id,
  })

  const completeMutation = useMutation({
    mutationFn: () => completeSettlement(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlement', id] })
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      message.success('정산이 완료 처리되었습니다')
    },
    onError: (error: Error) => {
      message.error(error.message || '처리에 실패했습니다')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSettlement(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      message.success('정산이 삭제되었습니다')
      navigate('/settlements')
    },
    onError: (error: Error) => {
      message.error(error.message || '삭제에 실패했습니다')
    },
  })

  const { data: paymentData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['paymentsForSettlement', settlement?.business_owner_id, settlement?.settlement_period_start, settlement?.settlement_period_end],
    queryFn: () => getPaymentsForSettlement(
      settlement!.business_owner_id,
      settlement!.settlement_period_start,
      settlement!.settlement_period_end
    ),
    enabled: !!settlement,
  })

  const paymentColumns: ColumnsType<SettlementPayment> = [
    {
      title: '예약번호',
      key: 'reservation_number',
      width: 120,
      render: (_, record) => record.reservation?.reservation_number || '-',
    },
    {
      title: '예약일',
      key: 'reserved_date',
      width: 100,
      render: (_, record) => record.reservation?.reserved_date ? dayjs(record.reservation.reserved_date).format(DATE_FORMAT) : '-',
    },
    {
      title: '어린이집',
      key: 'daycare',
      render: (_, record) => record.reservation?.daycare?.name || '-',
    },
    {
      title: '상품',
      key: 'product',
      render: (_, record) => record.reservation?.product?.name || '-',
    },
    {
      title: '결제금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right',
      render: (v: number) => `${v.toLocaleString()}원`,
    },
    {
      title: '결제상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'paid' ? 'green' : 'red'}>
          {status === 'paid' ? '완료' : '취소'}
        </Tag>
      ),
    },
    {
      title: '예약상태',
      key: 'reservation_status',
      width: 80,
      render: (_, record) => {
        const status = record.reservation?.status
        const colors: Record<string, string> = {
          confirmed: 'blue',
          completed: 'green',
          cancelled: 'default',
          refunded: 'red',
        }
        const labels: Record<string, string> = {
          confirmed: '확정',
          completed: '완료',
          cancelled: '취소',
          refunded: '환불',
        }
        return <Tag color={colors[status || ''] || 'default'}>{labels[status || ''] || status}</Tag>
      },
    },
    {
      title: '결제일시',
      dataIndex: 'paid_at',
      key: 'paid_at',
      width: 140,
      render: (date: string | null) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
  ]

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!settlement) {
    return <div>정산 정보를 찾을 수 없습니다</div>
  }

  const vendor = settlement.business_owner as {
    id: string
    name: string
    email: string
    bank_name?: string
    bank_account?: string
    bank_holder?: string
  } | undefined

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>정산 상세</h2>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            disabled={!paymentData?.payments.length}
            onClick={() => {
              if (!paymentData) return
              const formatted = formatSettlementPaymentsForExcel(paymentData.payments)
              const vendorName = vendor?.name || '정산'
              downloadExcel(formatted, SETTLEMENT_PAYMENT_EXCEL_COLUMNS, `정산_결제내역_${vendorName}`)
            }}
          >
            결제내역 다운로드
          </Button>
          {settlement.status === 'pending' && (
            <>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/settlements/${id}/edit`)}>
                수정
              </Button>
              <Popconfirm
                title="정산 완료 처리"
                description="정산을 완료 처리하시겠습니까?"
                onConfirm={() => completeMutation.mutate()}
                okText="완료"
                cancelText="취소"
              >
                <Button type="primary" icon={<CheckOutlined />} loading={completeMutation.isPending}>
                  정산 완료
                </Button>
              </Popconfirm>
            </>
          )}
          <Popconfirm
            title="정산 삭제"
            description="정산을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
            onConfirm={() => deleteMutation.mutate()}
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="사업주">
          <a onClick={() => navigate(`/vendors/${vendor?.id}`)} style={{ cursor: 'pointer' }}>
            {vendor?.name || '-'}
          </a>
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          <Tag color={settlement.status === 'completed' ? 'green' : 'orange'}>
            {settlement.status === 'completed' ? '정산완료' : '대기중'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="정산 기간" span={2}>
          {dayjs(settlement.settlement_period_start).format(DATE_FORMAT)} ~{' '}
          {dayjs(settlement.settlement_period_end).format(DATE_FORMAT)}
        </Descriptions.Item>
        <Descriptions.Item label="총 매출">
          <strong>{settlement.total_sales.toLocaleString()}원</strong>
        </Descriptions.Item>
        <Descriptions.Item label="수수료율">{settlement.commission_rate}%</Descriptions.Item>
        <Descriptions.Item label="수수료 금액">
          {settlement.commission_amount.toLocaleString()}원
        </Descriptions.Item>
        <Descriptions.Item label="환불 금액">
          {settlement.refund_amount.toLocaleString()}원
        </Descriptions.Item>
        <Descriptions.Item label="정산금" span={2}>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff' }}>
            {settlement.settlement_amount.toLocaleString()}원
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="정산일">
          {settlement.settled_at ? dayjs(settlement.settled_at).format(DATE_FORMAT) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="등록일">
          {dayjs(settlement.created_at).format(DATE_FORMAT)}
        </Descriptions.Item>
      </Descriptions>

      {vendor && (
        <>
          <h4 style={{ marginTop: 24, marginBottom: 12 }}>입금 계좌 정보</h4>
          <Descriptions column={3} bordered size="small">
            <Descriptions.Item label="은행명">{vendor.bank_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="계좌번호">{vendor.bank_account || '-'}</Descriptions.Item>
            <Descriptions.Item label="예금주">{vendor.bank_holder || '-'}</Descriptions.Item>
          </Descriptions>
        </>
      )}

      <h4 style={{ marginTop: 24, marginBottom: 12 }}>결제 내역</h4>
      {paymentsLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <>
          {paymentData && (
            <div style={{ marginBottom: 12, display: 'flex', gap: 16 }}>
              <Tag color="blue">
                결제 완료: {paymentData.paidCount}건 / {paymentData.totalSales.toLocaleString()}원
              </Tag>
              <Tag color="red">
                환불/취소: {paymentData.refundedCount}건 / {paymentData.refundAmount.toLocaleString()}원
              </Tag>
            </div>
          )}
          <Table
            columns={paymentColumns}
            dataSource={paymentData?.payments || []}
            rowKey="id"
            size="small"
            bordered
            pagination={{
              pageSize: 10,
              showTotal: (total) => `총 ${total}건`,
              size: 'small',
            }}
            scroll={{ x: 900 }}
          />
        </>
      )}

      <Divider />

      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/settlements')}>
        목록으로
      </Button>
    </div>
  )
}
