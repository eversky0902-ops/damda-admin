import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

import { getInquiries } from '@/services/inquiryService'
import { INQUIRY_STATUS_LABEL, INQUIRY_STATUS_COLOR, INQUIRY_CATEGORY_OPTIONS, INQUIRY_CATEGORY_LABEL, DEFAULT_PAGE_SIZE, DATE_FORMAT } from '@/constants'
import type { Inquiry, InquiryStatus } from '@/types'

export function InquiriesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['inquiries', page, pageSize, search, statusFilter, categoryFilter],
    queryFn: () =>
      getInquiries({
        page,
        pageSize,
        search,
        status: statusFilter,
        category: categoryFilter,
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

  const columns: ColumnsType<Inquiry> = [
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: InquiryStatus) => (
        <Tag color={INQUIRY_STATUS_COLOR[status]}>
          {INQUIRY_STATUS_LABEL[status]}
        </Tag>
      ),
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag>{INQUIRY_CATEGORY_LABEL[category] || category}</Tag>
      ),
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <a onClick={(e) => { e.stopPropagation(); navigate(`/content/inquiries/${record.id}`); }}>
          {title}
        </a>
      ),
    },
    {
      title: '작성자',
      key: 'daycare',
      width: 150,
      render: (_, record) => record.daycare?.name || '-',
    },
    {
      title: '등록일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
    {
      title: '답변일',
      dataIndex: 'answered_at',
      key: 'answered_at',
      width: 120,
      render: (date: string | null) => date ? dayjs(date).format(DATE_FORMAT) : '-',
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>1:1 문의 관리</h2>
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
          placeholder="제목 또는 내용 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 240 }}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        />
        <Select
          value={categoryFilter}
          onChange={(value) => {
            setCategoryFilter(value)
            setPage(1)
          }}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '전체 카테고리' },
            ...INQUIRY_CATEGORY_OPTIONS,
          ]}
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
            { value: 'pending', label: '답변대기' },
            { value: 'answered', label: '답변완료' },
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
          onClick: () => navigate(`/content/inquiries/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
