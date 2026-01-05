import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Input, Select, Tag, DatePicker, Space, Card, Statistic, Row, Col } from 'antd'
import { SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

import { getReservations, getBusinessOwnersForFilter, getReservationStats } from '@/services/reservationService'
import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_COLOR,
  DEFAULT_PAGE_SIZE,
  DATE_FORMAT,
} from '@/constants'
import type { Reservation, ReservationStatusType } from '@/types'

const { RangePicker } = DatePicker

export function ReservationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReservationStatusType | 'all'>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  // 예약 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['reservations', page, pageSize, search, statusFilter, vendorFilter, dateRange],
    queryFn: () =>
      getReservations({
        page,
        pageSize,
        search,
        status: statusFilter,
        business_owner_id: vendorFilter !== 'all' ? vendorFilter : undefined,
        date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
        date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
      }),
  })

  // 예약 통계 조회
  const { data: stats } = useQuery({
    queryKey: ['reservationStats'],
    queryFn: getReservationStats,
  })

  // 사업주 목록 조회 (필터용)
  const { data: vendors } = useQuery({
    queryKey: ['vendorsForFilter'],
    queryFn: getBusinessOwnersForFilter,
  })

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1)
    setPageSize(pagination.pageSize || DEFAULT_PAGE_SIZE)
  }

  const columns: ColumnsType<Reservation> = [
    {
      title: '예약번호',
      dataIndex: 'reservation_number',
      key: 'reservation_number',
      width: 140,
      render: (number: string, record) => (
        <a
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/reservations/${record.id}`)
          }}
        >
          {number}
        </a>
      ),
    },
    {
      title: '상품명',
      key: 'product',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {record.product?.thumbnail && (
            <img
              src={record.product.thumbnail}
              alt=""
              style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }}
            />
          )}
          <span>{record.product?.name || '-'}</span>
        </div>
      ),
    },
    {
      title: '예약자 (어린이집)',
      key: 'daycare',
      render: (_, record) => (
        <div>
          <div>{record.daycare?.name || '-'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.daycare?.contact_phone}</div>
        </div>
      ),
    },
    {
      title: '사업주',
      key: 'business_owner',
      render: (_, record) => record.business_owner?.name || '-',
    },
    {
      title: '예약일시',
      key: 'reserved_datetime',
      width: 140,
      render: (_, record) => (
        <div>
          <div>{dayjs(record.reserved_date).format(DATE_FORMAT)}</div>
          {record.reserved_time && (
            <div style={{ fontSize: 12, color: '#888' }}>{record.reserved_time}</div>
          )}
        </div>
      ),
    },
    {
      title: '인원',
      dataIndex: 'participant_count',
      key: 'participant_count',
      width: 70,
      render: (count: number) => `${count}명`,
    },
    {
      title: '결제금액',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 110,
      render: (amount: number) => `${amount.toLocaleString()}원`,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: ReservationStatusType) => (
        <Tag color={RESERVATION_STATUS_COLOR[status]}>
          {RESERVATION_STATUS_LABEL[status]}
        </Tag>
      ),
    },
    {
      title: '예약일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>예약 관리</h2>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="전체"
                value={stats.total}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="결제대기"
                value={stats.pending}
                valueStyle={{ fontSize: 20, color: '#8c8c8c' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="결제완료"
                value={stats.paid}
                valueStyle={{ fontSize: 20, color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="확정"
                value={stats.confirmed}
                valueStyle={{ fontSize: 20, color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="이용완료"
                value={stats.completed}
                valueStyle={{ fontSize: 20, color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="취소/환불"
                value={stats.cancelled + stats.refunded}
                valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 필터 영역 */}
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
          placeholder="예약번호 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 180 }}
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
            { value: 'pending', label: '결제대기' },
            { value: 'paid', label: '결제완료' },
            { value: 'confirmed', label: '확정' },
            { value: 'completed', label: '이용완료' },
            { value: 'cancelled', label: '취소됨' },
            { value: 'refunded', label: '환불됨' },
          ]}
        />
        <Select
          value={vendorFilter}
          onChange={(value) => {
            setVendorFilter(value)
            setPage(1)
          }}
          style={{ width: 160 }}
          showSearch
          optionFilterProp="label"
          options={[
            { value: 'all', label: '전체 사업주' },
            ...(vendors?.map((v) => ({ value: v.id, label: v.name })) || []),
          ]}
        />
        <Space>
          <CalendarOutlined style={{ color: '#bfbfbf' }} />
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates)
              setPage(1)
            }}
            style={{ width: 240 }}
            placeholder={['시작일', '종료일']}
          />
        </Space>
      </div>

      {/* 테이블 */}
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
          onClick: () => navigate(`/reservations/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
