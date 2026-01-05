import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag, Switch, message, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, PushpinOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

import { getNotices, toggleNoticeVisibility, toggleNoticePinned, deleteNotice } from '@/services/noticeService'
import { NOTICE_VISIBILITY_LABEL, NOTICE_VISIBILITY_COLOR, DEFAULT_PAGE_SIZE, DATE_FORMAT } from '@/constants'
import type { Notice } from '@/types'

export function NoticesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all')
  const [pinnedFilter, setPinnedFilter] = useState<'all' | 'pinned' | 'normal'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['notices', page, pageSize, search, statusFilter, pinnedFilter],
    queryFn: () =>
      getNotices({
        page,
        pageSize,
        search,
        status: statusFilter,
        pinned: pinnedFilter,
      }),
  })

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      toggleNoticeVisibility(id, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      message.success('공개 상태가 변경되었습니다')
    },
    onError: () => {
      message.error('상태 변경에 실패했습니다')
    },
  })

  const pinnedMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      toggleNoticePinned(id, isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      message.success('고정 상태가 변경되었습니다')
    },
    onError: () => {
      message.error('상태 변경에 실패했습니다')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      message.success('공지사항이 삭제되었습니다')
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

  const columns: ColumnsType<Notice> = [
    {
      title: '고정',
      dataIndex: 'is_pinned',
      key: 'is_pinned',
      width: 60,
      render: (isPinned: boolean, record) => (
        <Switch
          size="small"
          checked={isPinned}
          onChange={(checked) => pinnedMutation.mutate({ id: record.id, isPinned: checked })}
          onClick={(_, e) => e.stopPropagation()}
          checkedChildren={<PushpinOutlined />}
        />
      ),
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {record.is_pinned && <PushpinOutlined style={{ color: '#1677ff' }} />}
          <a onClick={(e) => { e.stopPropagation(); navigate(`/content/notices/${record.id}`); }}>{title}</a>
        </div>
      ),
    },
    {
      title: '작성자',
      key: 'admin',
      width: 100,
      render: (_, record) => record.admin?.name || '-',
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
          title="공지사항 삭제"
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
        <h2 style={{ margin: 0 }}>공지사항 관리</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/content/notices/new')}
        >
          공지사항 등록
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
          placeholder="제목 또는 내용 검색"
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
          value={pinnedFilter}
          onChange={(value) => {
            setPinnedFilter(value)
            setPage(1)
          }}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '전체' },
            { value: 'pinned', label: '고정됨' },
            { value: 'normal', label: '일반' },
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
          onClick: () => navigate(`/content/notices/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
