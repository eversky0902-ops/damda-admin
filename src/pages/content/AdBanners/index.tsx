import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Select, Tag, Switch, message, Popconfirm, Image } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

import { getAdBanners, toggleAdBannerVisibility, deleteAdBanner } from '@/services/adBannerService'
import { AD_BANNER_STATUS_LABEL, AD_BANNER_STATUS_COLOR, DEFAULT_PAGE_SIZE, DATE_FORMAT } from '@/constants'
import type { AdBanner } from '@/types'

export function AdBannersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['adBanners', page, pageSize, statusFilter],
    queryFn: () =>
      getAdBanners({
        page,
        pageSize,
        status: statusFilter,
      }),
  })

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      toggleAdBannerVisibility(id, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adBanners'] })
      message.success('공개 상태가 변경되었습니다')
    },
    onError: () => {
      message.error('상태 변경에 실패했습니다')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adBanners'] })
      message.success('광고 배너가 삭제되었습니다')
    },
    onError: () => {
      message.error('삭제에 실패했습니다')
    },
  })

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1)
    setPageSize(pagination.pageSize || DEFAULT_PAGE_SIZE)
  }

  const columns: ColumnsType<AdBanner> = [
    {
      title: '순서',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 60,
      align: 'center',
    },
    {
      title: '이미지',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 150,
      render: (url: string) => (
        <Image
          src={url}
          width={120}
          height={40}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={{ mask: '미리보기' }}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '광고주',
      dataIndex: 'advertiser_name',
      key: 'advertiser_name',
      width: 120,
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <a onClick={(e) => { e.stopPropagation(); navigate(`/content/ad-banners/${record.id}`); }}>
          {title}
        </a>
      ),
    },
    {
      title: '링크',
      dataIndex: 'link_url',
      key: 'link_url',
      width: 200,
      ellipsis: true,
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          {url}
        </a>
      ),
    },
    {
      title: '노출기간',
      key: 'period',
      width: 180,
      render: (_, record) => {
        if (!record.start_date && !record.end_date) return '상시'
        const start = record.start_date ? dayjs(record.start_date).format(DATE_FORMAT) : '-'
        const end = record.end_date ? dayjs(record.end_date).format(DATE_FORMAT) : '-'
        return `${start} ~ ${end}`
      },
    },
    {
      title: '상태',
      dataIndex: 'is_visible',
      key: 'is_visible',
      width: 80,
      render: (isVisible: boolean) => (
        <Tag color={AD_BANNER_STATUS_COLOR[isVisible ? 'visible' : 'hidden']}>
          {AD_BANNER_STATUS_LABEL[isVisible ? 'visible' : 'hidden']}
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
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="광고 배너 삭제"
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
        <h2 style={{ margin: 0 }}>광고 배너 관리</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/content/ad-banners/new')}
        >
          광고 배너 등록
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
          onClick: () => navigate(`/content/ad-banners/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
