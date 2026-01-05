import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Input, Select, Tag, DatePicker, Card, Statistic, Row, Col } from 'antd'
import { SearchOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

import { getPayments, getPaymentStats, type PaymentWithDetails } from '@/services/paymentService'
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
  PAYMENT_METHOD_LABEL,
  DEFAULT_PAGE_SIZE,
  DATE_FORMAT,
  DATETIME_FORMAT,
} from '@/constants'
import type { PaymentStatusType } from '@/types'

const { RangePicker } = DatePicker

export function PaymentsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatusType | 'all'>('all')
  const [methodFilter, setMethodFilter] = useState<string | 'all'>('all')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, pageSize, search, statusFilter, methodFilter, dateRange],
    queryFn: () =>
      getPayments({
        page,
        pageSize,
        search,
        status: statusFilter,
        payment_method: methodFilter,
        date_from: dateRange?.[0]?.format(DATE_FORMAT),
        date_to: dateRange?.[1]?.format(DATE_FORMAT),
      }),
  })

  const { data: stats } = useQuery({
    queryKey: ['paymentStats'],
    queryFn: getPaymentStats,
  })

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1)
    setPageSize(pagination.pageSize || DEFAULT_PAGE_SIZE)
  }

  const columns: ColumnsType<PaymentWithDetails> = [
    {
      title: '결제일시',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format(DATETIME_FORMAT),
    },
    {
      title: '예약번호',
      key: 'reservation_number',
      width: 140,
      render: (_, record) => (
        <a onClick={(e) => { e.stopPropagation(); navigate(`/reservations/${record.reservation?.id}`); }}>
          {record.reservation?.reservation_number}
        </a>
      ),
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
      title: '결제수단',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (method: string) => PAYMENT_METHOD_LABEL[method] || method,
    },
    {
      title: 'PG사',
      dataIndex: 'pg_provider',
      key: 'pg_provider',
      width: 100,
    },
    {
      title: '결제금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => `${amount.toLocaleString()}원`,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PaymentStatusType) => (
        <Tag color={PAYMENT_STATUS_COLOR[status]}>
          {PAYMENT_STATUS_LABEL[status]}
        </Tag>
      ),
    },
    {
      title: 'TID',
      dataIndex: 'pg_tid',
      key: 'pg_tid',
      width: 180,
      ellipsis: true,
      render: (tid: string | null) => tid || '-',
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>결제 관리</h2>
      </div>

      {/* 통계 카드 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="오늘 결제금액"
              value={stats?.todayAmount || 0}
              suffix="원"
              prefix={<DollarOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="결제완료"
              value={stats?.paid || 0}
              suffix="건"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="결제대기"
              value={stats?.pending || 0}
              suffix="건"
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="취소/환불"
              value={(stats?.cancelled || 0) + (stats?.failed || 0)}
              suffix="건"
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 검색/필터 영역 */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 12,
        padding: 12,
        background: '#fafafa',
        borderRadius: 6,
        flexWrap: 'wrap',
      }}>
        <Input
          placeholder="PG TID 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 200 }}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        />
        <Select
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '전체 상태' },
            { value: 'pending', label: '대기중' },
            { value: 'paid', label: '결제완료' },
            { value: 'failed', label: '실패' },
            { value: 'cancelled', label: '취소됨' },
          ]}
        />
        <Select
          value={methodFilter}
          onChange={(value) => {
            setMethodFilter(value)
            setPage(1)
          }}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '전체 수단' },
            { value: 'card', label: '카드' },
            { value: 'bank', label: '계좌이체' },
            { value: 'virtual', label: '가상계좌' },
            { value: 'phone', label: '휴대폰' },
          ]}
        />
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            setDateRange(dates)
            setPage(1)
          }}
          style={{ width: 240 }}
          placeholder={['시작일', '종료일']}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        size="small"
        bordered
        pagination={{
          current: page,
          pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
          size: 'small',
        }}
        onChange={handleTableChange}
        onRow={(record) => ({
          onClick: () => navigate(`/payments/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
