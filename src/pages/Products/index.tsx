import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag, Image } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

import { getProducts, getBusinessOwners, getCategoriesFlat } from '@/services/productService'
import {
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_COLOR,
  DEFAULT_PAGE_SIZE,
  DATE_FORMAT,
} from '@/constants'
import type { Product, ProductFilter } from '@/types'

type ProductStatusFilter = ProductFilter['status']

function getProductStatus(product: Product): 'visible' | 'hidden' | 'sold_out' {
  if (product.is_sold_out) return 'sold_out'
  if (!product.is_visible) return 'hidden'
  return 'visible'
}

export function ProductsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('all')
  const [vendorFilter, setVendorFilter] = useState<string | undefined>(undefined)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)

  // 상품 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['products', page, pageSize, search, statusFilter, vendorFilter, categoryFilter],
    queryFn: () =>
      getProducts({
        page,
        pageSize,
        search,
        status: statusFilter,
        business_owner_id: vendorFilter,
        category_id: categoryFilter,
      }),
  })

  // 사업주 목록 조회 (필터용)
  const { data: vendors } = useQuery({
    queryKey: ['businessOwners'],
    queryFn: getBusinessOwners,
  })

  // 카테고리 목록 조회 (필터용)
  const { data: categories } = useQuery({
    queryKey: ['categoriesFlat'],
    queryFn: getCategoriesFlat,
  })

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1)
    setPageSize(pagination.pageSize || DEFAULT_PAGE_SIZE)
  }

  const columns: ColumnsType<Product> = [
    {
      title: '썸네일',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      width: 80,
      render: (thumbnail: string) => (
        <Image
          src={thumbnail}
          alt="상품 썸네일"
          width={60}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          preview={false}
        />
      ),
    },
    {
      title: '상품명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <a
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/products/${record.id}`)
            }}
          >
            {name}
          </a>
          {record.summary && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{record.summary}</div>
          )}
        </div>
      ),
    },
    {
      title: '사업주',
      key: 'business_owner',
      width: 140,
      render: (_, record) => record.business_owner?.name || '-',
    },
    {
      title: '카테고리',
      key: 'category',
      width: 120,
      render: (_, record) => record.category?.name || '-',
    },
    {
      title: '가격',
      key: 'price',
      width: 140,
      render: (_, record) => (
        <div>
          {record.original_price !== record.sale_price && (
            <div style={{ textDecoration: 'line-through', color: '#999', fontSize: 12 }}>
              {record.original_price.toLocaleString()}원
            </div>
          )}
          <div style={{ fontWeight: 500 }}>{record.sale_price.toLocaleString()}원</div>
        </div>
      ),
    },
    {
      title: '인원',
      key: 'participants',
      width: 100,
      render: (_, record) => `${record.min_participants}~${record.max_participants}명`,
    },
    {
      title: '조회수',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 80,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '상태',
      key: 'status',
      width: 80,
      render: (_, record) => {
        const status = getProductStatus(record)
        return <Tag color={PRODUCT_STATUS_COLOR[status]}>{PRODUCT_STATUS_LABEL[status]}</Tag>
      },
    },
    {
      title: '등록일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
  ]

  // 카테고리 옵션 (깊이별 들여쓰기)
  const categoryOptions = [
    { value: '', label: '전체 카테고리' },
    ...(categories?.map((cat) => ({
      value: cat.id,
      label: `${'　'.repeat(cat.depth - 1)}${cat.name}`,
    })) || []),
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>상품 관리</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/products/new')}
        >
          상품 등록
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
          placeholder="상품명 검색"
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
            { value: 'visible', label: '노출' },
            { value: 'hidden', label: '숨김' },
            { value: 'sold_out', label: '품절' },
          ]}
        />
        <Select
          value={vendorFilter || ''}
          onChange={(value) => {
            setVendorFilter(value || undefined)
            setPage(1)
          }}
          style={{ width: 160 }}
          showSearch
          optionFilterProp="label"
          options={[
            { value: '', label: '전체 사업주' },
            ...(vendors?.map((v) => ({ value: v.id, label: v.name })) || []),
          ]}
        />
        <Select
          value={categoryFilter || ''}
          onChange={(value) => {
            setCategoryFilter(value || undefined)
            setPage(1)
          }}
          style={{ width: 160 }}
          options={categoryOptions}
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
          onClick: () => navigate(`/products/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
