import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

import { getPartnerInquiries } from '@/services/partnerInquiryService'
import { formatPhoneNumber } from '@/utils/format'
import { PARTNER_INQUIRY_STATUS_LABEL, PARTNER_INQUIRY_STATUS_COLOR, DEFAULT_PAGE_SIZE, DATE_FORMAT } from '@/constants'
import type { PartnerInquiry, PartnerInquiryStatus } from '@/types'

export function PartnerInquiriesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<PartnerInquiryStatus | 'all'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['partner-inquiries', page, pageSize, search, statusFilter],
    queryFn: () =>
      getPartnerInquiries({
        page,
        pageSize,
        search,
        status: statusFilter,
      }),
  })

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1)
    setPageSize(pagination.pageSize || DEFAULT_PAGE_SIZE)
  }

  const columns: ColumnsType<PartnerInquiry> = [
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PartnerInquiryStatus) => (
        <Tag color={PARTNER_INQUIRY_STATUS_COLOR[status]}>
          {PARTNER_INQUIRY_STATUS_LABEL[status]}
        </Tag>
      ),
    },
    {
      title: '업체명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <a onClick={(e) => { e.stopPropagation(); navigate(`/partner-inquiries/${record.id}`); }}>
          {name}
        </a>
      ),
    },
    {
      title: '사업자번호',
      dataIndex: 'business_number',
      key: 'business_number',
      width: 150,
    },
    {
      title: '담당자',
      dataIndex: 'contact_name',
      key: 'contact_name',
      width: 120,
    },
    {
      title: '연락처',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      width: 150,
      render: (phone: string) => formatPhoneNumber(phone),
    },
    {
      title: '등록일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>입점문의 관리</h2>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 12,
        padding: 12,
        background: '#fafafa',
        borderRadius: 6,
      }}>
        <Input
          placeholder="업체명 검색"
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
            { value: 'approved', label: '처리완료' },
          ]}
        />
        <Button type="primary" onClick={handleSearch}>
          검색
        </Button>
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
          onClick: () => navigate(`/partner-inquiries/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
