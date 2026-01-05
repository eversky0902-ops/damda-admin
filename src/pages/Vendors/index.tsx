import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag, Avatar } from 'antd'
import { PlusOutlined, SearchOutlined, ShopOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

import { getVendors } from '@/services/vendorService'
import { VENDOR_STATUS_LABEL, DEFAULT_PAGE_SIZE, DATE_FORMAT } from '@/constants'
import type { BusinessOwner, VendorStatus } from '@/types'

export function VendorsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'all'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', page, pageSize, search, statusFilter],
    queryFn: () =>
      getVendors({
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

  const columns: ColumnsType<BusinessOwner> = [
    {
      title: '사업자명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            src={record.logo_url}
            icon={!record.logo_url && <ShopOutlined />}
            size={32}
            style={{ backgroundColor: record.logo_url ? undefined : '#f0f0f0', color: '#999' }}
          />
          <a onClick={(e) => { e.stopPropagation(); navigate(`/vendors/${record.id}`); }}>{name}</a>
        </div>
      ),
    },
    {
      title: '사업자번호',
      dataIndex: 'business_number',
      key: 'business_number',
    },
    {
      title: '대표자',
      dataIndex: 'representative',
      key: 'representative',
    },
    {
      title: '담당자',
      dataIndex: 'contact_name',
      key: 'contact_name',
    },
    {
      title: '연락처',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
    },
    {
      title: '수수료율',
      dataIndex: 'commission_rate',
      key: 'commission_rate',
      render: (rate: number) => `${rate}%`,
      width: 100,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: VendorStatus) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {VENDOR_STATUS_LABEL[status]}
        </Tag>
      ),
    },
    {
      title: '가입일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>사업주 관리</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/vendors/new')}
        >
          사업주 등록
        </Button>
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
          placeholder="사업자명 또는 사업자번호"
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
            { value: 'active', label: '활성' },
            { value: 'inactive', label: '비활성' },
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
          onClick: () => navigate(`/vendors/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
