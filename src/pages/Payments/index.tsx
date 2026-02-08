import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Input, Select, Tag, DatePicker, Card, Statistic, Row, Col, Button, Dropdown, message } from 'antd'
import { SearchOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'

import { getPayments, getPaymentStats, getAllPayments, type PaymentWithDetails } from '@/services/paymentService'
import { downloadExcel, formatPaymentsForExcel, PAYMENT_EXCEL_COLUMNS } from '@/utils/excel'
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
  const [searchType, setSearchType] = useState<'daycare' | 'product'>('daycare')
  const [statusFilter, setStatusFilter] = useState<PaymentStatusType | 'all'>('all')
  const [methodFilter, setMethodFilter] = useState<string | 'all'>('all')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, pageSize, search, searchType, statusFilter, methodFilter, dateRange],
    queryFn: () =>
      getPayments({
        page,
        pageSize,
        search,
        search_type: searchType,
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

  // 엑셀 다운로드 (현재 검색 조건)
  const handleDownloadCurrent = () => {
    if (!data?.data || data.data.length === 0) {
      message.warning('다운로드할 데이터가 없습니다.')
      return
    }
    const formatted = formatPaymentsForExcel(data.data)
    downloadExcel(formatted, PAYMENT_EXCEL_COLUMNS, '결제_목록')
    message.success('엑셀 다운로드가 완료되었습니다.')
  }

  // 엑셀 다운로드 (전체 또는 필터 적용)
  const handleDownloadAll = async () => {
    try {
      message.loading({ content: '데이터를 가져오는 중...', key: 'download' })
      const allPayments = await getAllPayments({
        status: statusFilter,
        payment_method: methodFilter,
        date_from: dateRange?.[0]?.format(DATE_FORMAT),
        date_to: dateRange?.[1]?.format(DATE_FORMAT),
      })
      if (allPayments.length === 0) {
        message.warning({ content: '다운로드할 데이터가 없습니다.', key: 'download' })
        return
      }
      const formatted = formatPaymentsForExcel(allPayments)
      downloadExcel(formatted, PAYMENT_EXCEL_COLUMNS, '결제_전체목록')
      message.success({ content: `엑셀 다운로드 완료 (${allPayments.length}건)`, key: 'download' })
    } catch (error) {
      message.error({ content: '다운로드 중 오류가 발생했습니다.', key: 'download' })
    }
  }

  // 다운로드 메뉴
  const downloadMenuItems: MenuProps['items'] = [
    {
      key: 'current',
      label: '현재 페이지 다운로드',
      icon: <DownloadOutlined />,
      onClick: handleDownloadCurrent,
    },
    {
      key: 'all',
      label: '전체 목록 다운로드',
      icon: <DownloadOutlined />,
      onClick: handleDownloadAll,
    },
  ]

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
        <Dropdown menu={{ items: downloadMenuItems }} placement="bottomRight">
          <Button icon={<DownloadOutlined />}>엑셀 다운로드</Button>
        </Dropdown>
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
        <Select
          value={searchType}
          onChange={(value) => {
            setSearchType(value)
            setSearchInput('')
            setSearch('')
            setPage(1)
          }}
          style={{ width: 120 }}
          options={[
            { value: 'daycare', label: '어린이집명' },
            { value: 'product', label: '상품명' },
          ]}
        />
        <Input
          placeholder={searchType === 'daycare' ? '어린이집명 검색' : '상품명 검색'}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 240 }}
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
