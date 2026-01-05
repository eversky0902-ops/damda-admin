import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag, Switch, message, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

import { getFAQs, toggleFAQVisibility, deleteFAQ } from '@/services/faqService'
import { FAQ_CATEGORY_LABEL, FAQ_CATEGORY_OPTIONS, NOTICE_VISIBILITY_LABEL, NOTICE_VISIBILITY_COLOR, DEFAULT_PAGE_SIZE, DATE_FORMAT } from '@/constants'
import type { FAQ } from '@/types'

export function FAQsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['faqs', page, pageSize, search, statusFilter, categoryFilter],
    queryFn: () =>
      getFAQs({
        page,
        pageSize,
        search,
        status: statusFilter,
        category: categoryFilter,
      }),
  })

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      toggleFAQVisibility(id, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] })
      message.success('공개 상태가 변경되었습니다')
    },
    onError: () => {
      message.error('상태 변경에 실패했습니다')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] })
      message.success('FAQ가 삭제되었습니다')
    },
    onError: () => {
      message.error('삭제에 실패했습니다')
    },
  })

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1)
    setPageSize(pagination.pageSize || DEFAULT_PAGE_SIZE)
  }

  const columns: ColumnsType<FAQ> = [
    {
      title: '순서',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 60,
      align: 'center',
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag>{FAQ_CATEGORY_LABEL[category] || category}</Tag>
      ),
    },
    {
      title: '질문',
      dataIndex: 'question',
      key: 'question',
      render: (question: string, record) => (
        <a onClick={(e) => { e.stopPropagation(); navigate(`/content/faqs/${record.id}`); }}>
          {question}
        </a>
      ),
    },
    {
      title: '상태',
      dataIndex: 'is_visible',
      key: 'is_visible',
      width: 80,
      render: (isVisible: boolean) => (
        <Tag color={NOTICE_VISIBILITY_COLOR[isVisible ? 'visible' : 'hidden']}>
          {NOTICE_VISIBILITY_LABEL[isVisible ? 'visible' : 'hidden']}
        </Tag>
      ),
    },
    {
      title: '공개',
      dataIndex: 'is_visible',
      key: 'visibility_toggle',
      width: 60,
      render: (isVisible: boolean, record) => (
        <Switch
          size="small"
          checked={isVisible}
          onChange={(checked) => visibilityMutation.mutate({ id: record.id, isVisible: checked })}
          onClick={(_, e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '등록일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => dayjs(date).format(DATE_FORMAT),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="FAQ 삭제"
          description="정말 삭제하시겠습니까?"
          onConfirm={(e) => {
            e?.stopPropagation()
            deleteMutation.mutate(record.id)
          }}
          onCancel={(e) => e?.stopPropagation()}
          okText="삭제"
          cancelText="취소"
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>FAQ 관리</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/content/faqs/new')}
        >
          FAQ 등록
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
          placeholder="질문 또는 답변 검색"
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
            ...FAQ_CATEGORY_OPTIONS,
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
            { value: 'visible', label: '공개' },
            { value: 'hidden', label: '비공개' },
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
          onClick: () => navigate(`/content/faqs/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
