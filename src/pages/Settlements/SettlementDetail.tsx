import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, message, Popconfirm, Space } from 'antd'
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getSettlement, completeSettlement, deleteSettlement } from '@/services/settlementService'
import { DATE_FORMAT } from '@/constants'

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

      <Divider />

      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/settlements')}>
        목록으로
      </Button>
    </div>
  )
}
