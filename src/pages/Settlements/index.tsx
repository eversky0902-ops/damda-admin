import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Tag, Select, DatePicker, Input, message, Popconfirm } from 'antd'

const { RangePicker } = DatePicker
import { PlusOutlined, SearchOutlined, CheckOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import { getSettlements, bulkCompleteSettlements, type SettlementWithVendor } from '@/services/settlementService'
import { DATE_FORMAT, DEFAULT_PAGE_SIZE } from '@/constants'
import type { SettlementStatus } from '@/types'

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '대기중' },
  { value: 'completed', label: '정산완료' },
]

export function SettlementsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [status, setStatus] = useState<SettlementStatus | 'all'>('all')
  const [vendorSearch, setVendorSearch] = useState<string>('')
  const [vendorSearchInput, setVendorSearchInput] = useState<string>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 정산 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['settlements', page, pageSize, status, vendorSearch, dateRange],
    queryFn: () =>
      getSettlements({
        page,
        pageSize,
        status,
        vendor_search: vendorSearch,
        date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
        date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
      }),
  })

  const bulkCompleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkCompleteSettlements(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      message.success(`${selectedRowKeys.length}건의 정산이 완료 처리되었습니다`)
      setSelectedRowKeys([])
    },
    onError: (error: Error) => {
      message.error(error.message || '처리에 실패했습니다')
    },
  })

  // 선택된 항목 중 대기중인 것만 필터
  const selectedPendingCount = (data?.data || []).filter(
    (s) => selectedRowKeys.includes(s.id) && s.status === 'pending'
  ).length

  const handleVendorSearch = () => {
    setVendorSearch(vendorSearchInput)
    setPage(1)
  }

  const columns: ColumnsType<SettlementWithVendor> = [
    {
      title: '사업주',
      key: 'business_owner',
      render: (_, record) => record.business_owner?.name || '-',
    },
    {
      title: '정산 기간',
      key: 'period',
      render: (_, record) =>
        `${dayjs(record.settlement_period_start).format(DATE_FORMAT)} ~ ${dayjs(record.settlement_period_end).format(DATE_FORMAT)}`,
    },
    {
      title: '총 매출',
      dataIndex: 'total_sales',
      key: 'total_sales',
      align: 'right',
      render: (v: number) => `${v.toLocaleString()}원`,
    },
    {
      title: '수수료',
      key: 'commission',
      align: 'right',
      render: (_, record) =>
        `${record.commission_amount.toLocaleString()}원 (${record.commission_rate}%)`,
    },
    {
      title: '환불',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      align: 'right',
      render: (v: number) => `${v.toLocaleString()}원`,
    },
    {
      title: '정산금',
      dataIndex: 'settlement_amount',
      key: 'settlement_amount',
      align: 'right',
      render: (v: number) => <strong>{v.toLocaleString()}원</strong>,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (s: SettlementStatus) => (
        <Tag color={s === 'completed' ? 'green' : 'orange'}>
          {s === 'completed' ? '정산완료' : '대기중'}
        </Tag>
      ),
    },
    {
      title: '정산일',
      dataIndex: 'settled_at',
      key: 'settled_at',
      render: (date: string | null) => (date ? dayjs(date).format(DATE_FORMAT) : '-'),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>정산 관리</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/settlements/new')}>
          정산 등록
        </Button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
          padding: 12,
          background: '#fafafa',
          borderRadius: 6,
          flexWrap: 'wrap',
        }}
      >
        <Input
          placeholder="사업주명 검색"
          value={vendorSearchInput}
          onChange={(e) => setVendorSearchInput(e.target.value)}
          onPressEnter={handleVendorSearch}
          style={{ width: 180 }}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        />
        <Select
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
          style={{ width: 120 }}
          options={STATUS_OPTIONS}
        />
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            setDateRange(dates)
            setPage(1)
          }}
          style={{ width: 240 }}
          placeholder={['시작일', '종료일']}
          popupClassName="single-calendar-range"
        />
        <Button type="primary" onClick={handleVendorSearch}>
          검색
        </Button>
        <Button
          onClick={() => {
            setStatus('all')
            setVendorSearch('')
            setVendorSearchInput('')
            setDateRange(null)
            setPage(1)
          }}
        >
          초기화
        </Button>
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{selectedRowKeys.length}건 선택됨</span>
          <Popconfirm
            title="일괄 정산 완료"
            description={`선택한 ${selectedPendingCount}건을 정산 완료 처리하시겠습니까?`}
            onConfirm={() => {
              const pendingIds = (data?.data || [])
                .filter((s) => selectedRowKeys.includes(s.id) && s.status === 'pending')
                .map((s) => s.id)
              if (pendingIds.length === 0) {
                message.warning('대기중인 정산이 없습니다')
                return
              }
              bulkCompleteMutation.mutate(pendingIds)
            }}
            okText="완료 처리"
            cancelText="취소"
          >
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled={selectedPendingCount === 0}
              loading={bulkCompleteMutation.isPending}
            >
              정산 완료 ({selectedPendingCount})
            </Button>
          </Popconfirm>
          <Button size="small" onClick={() => setSelectedRowKeys([])}>선택 해제</Button>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        size="small"
        bordered
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        pagination={{
          current: page,
          pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
          size: 'small',
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/settlements/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
