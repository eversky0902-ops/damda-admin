import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag, Rate, Image, Space } from 'antd'
import { SearchOutlined, StarFilled } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

import { getReviews } from '@/services/reviewService'
import {
  DEFAULT_PAGE_SIZE,
  DATE_FORMAT,
  REVIEW_VISIBILITY_LABEL,
  REVIEW_VISIBILITY_COLOR,
  RATING_OPTIONS,
} from '@/constants'
import type { Review, ReviewSearchType } from '@/types'

export function ReviewsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchType, setSearchType] = useState<ReviewSearchType>('content')
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all')
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'normal'>('all')
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page, pageSize, search, searchType, statusFilter, featuredFilter, ratingFilter],
    queryFn: () =>
      getReviews({
        page,
        pageSize,
        search,
        search_type: searchType,
        status: statusFilter,
        featured: featuredFilter,
        rating: ratingFilter,
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

  const columns: ColumnsType<Review> = [
    {
      title: '상품',
      key: 'product',
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image
            src={record.product?.thumbnail}
            width={48}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={false}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwYAAuUB8gKWjPEAAAAASUVORK5CYII="
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.product?.name || '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '작성자',
      key: 'daycare',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.daycare?.name || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.daycare?.contact_name || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '별점',
      dataIndex: 'rating',
      key: 'rating',
      width: 140,
      render: (rating: number) => (
        <Space size={4}>
          <Rate disabled value={rating} style={{ fontSize: 14 }} />
          <span style={{ color: '#faad14' }}>{rating}</span>
        </Space>
      ),
    },
    {
      title: '리뷰 내용',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string, record) => (
        <div>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 300,
            }}
          >
            {content}
          </div>
          {record.images && record.images.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <Tag color="blue" style={{ fontSize: 11 }}>
                이미지 {record.images.length}장
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '베스트',
      dataIndex: 'is_featured',
      key: 'is_featured',
      width: 80,
      align: 'center',
      render: (isFeatured: boolean) =>
        isFeatured ? (
          <StarFilled style={{ color: '#faad14', fontSize: 18 }} />
        ) : (
          <span style={{ color: '#d9d9d9' }}>-</span>
        ),
    },
    {
      title: '상태',
      dataIndex: 'is_visible',
      key: 'is_visible',
      width: 80,
      render: (isVisible: boolean) => {
        const status = isVisible ? 'visible' : 'hidden'
        return (
          <Tag color={REVIEW_VISIBILITY_COLOR[status]}>
            {REVIEW_VISIBILITY_LABEL[status]}
          </Tag>
        )
      },
    },
    {
      title: '작성일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>리뷰 관리</h2>
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
            { value: 'content', label: '리뷰 내용' },
            { value: 'vendor', label: '업체명' },
            { value: 'daycare', label: '어린이집명' },
          ]}
        />
        <Input
          placeholder={searchType === 'vendor' ? '업체명 검색' : searchType === 'daycare' ? '어린이집명 검색' : '리뷰 내용 검색'}
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
            { value: 'visible', label: '공개' },
            { value: 'hidden', label: '비공개' },
          ]}
        />
        <Select
          value={featuredFilter}
          onChange={(value) => {
            setFeaturedFilter(value)
            setPage(1)
          }}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '전체' },
            { value: 'featured', label: '베스트' },
            { value: 'normal', label: '일반' },
          ]}
        />
        <Select
          value={ratingFilter}
          onChange={(value) => {
            setRatingFilter(value)
            setPage(1)
          }}
          style={{ width: 120 }}
          options={RATING_OPTIONS}
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
          onClick: () => navigate(`/reviews/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
