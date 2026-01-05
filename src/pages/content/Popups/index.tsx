import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Select, Tag, Switch, message, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

import { getPopups, togglePopupVisibility, deletePopup } from '@/services/popupService'
import { POPUP_POSITION_LABEL, DEFAULT_PAGE_SIZE, DATE_FORMAT } from '@/constants'
import type { Popup, PopupPosition } from '@/types'

function getPopupStatus(popup: Popup): { label: string; color: string } {
  const now = dayjs()
  const start = dayjs(popup.start_date)
  const end = dayjs(popup.end_date)

  if (!popup.is_visible) {
    return { label: '비공개', color: 'default' }
  }
  if (now.isBefore(start)) {
    return { label: '예정', color: 'blue' }
  }
  if (now.isAfter(end)) {
    return { label: '종료', color: 'default' }
  }
  return { label: '진행중', color: 'green' }
}

export function PopupsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden' | 'active' | 'scheduled' | 'expired'>('all')
  const [positionFilter, setPositionFilter] = useState<PopupPosition | 'all'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['popups', page, pageSize, statusFilter, positionFilter],
    queryFn: () =>
      getPopups({
        page,
        pageSize,
        status: statusFilter,
        position: positionFilter,
      }),
  })

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      togglePopupVisibility(id, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups'] })
      message.success('공개 상태가 변경되었습니다')
    },
    onError: () => {
      message.error('상태 변경에 실패했습니다')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePopup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups'] })
      message.success('팝업이 삭제되었습니다')
    },
    onError: () => {
      message.error('삭제에 실패했습니다')
    },
  })

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1)
    setPageSize(pagination.pageSize || DEFAULT_PAGE_SIZE)
  }

  const columns: ColumnsType<Popup> = [
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <a onClick={(e) => { e.stopPropagation(); navigate(`/content/popups/${record.id}`); }}>
          {title}
        </a>
      ),
    },
    {
      title: '위치',
      dataIndex: 'position',
      key: 'position',
      width: 80,
      render: (position: PopupPosition) => (
        <Tag>{POPUP_POSITION_LABEL[position]}</Tag>
      ),
    },
    {
      title: '크기',
      key: 'size',
      width: 100,
      render: (_, record) => `${record.width || 400}x${record.height || 300}`,
    },
    {
      title: '노출기간',
      key: 'period',
      width: 200,
      render: (_, record) => {
        const start = dayjs(record.start_date).format(DATE_FORMAT)
        const end = dayjs(record.end_date).format(DATE_FORMAT)
        return `${start} ~ ${end}`
      },
    },
    {
      title: '상태',
      key: 'status',
      width: 80,
      render: (_, record) => {
        const status = getPopupStatus(record)
        return <Tag color={status.color}>{status.label}</Tag>
      },
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
          title="팝업 삭제"
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
        <h2 style={{ margin: 0 }}>팝업 관리</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/content/popups/new')}
        >
          팝업 등록
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
          value={positionFilter}
          onChange={(value) => {
            setPositionFilter(value)
            setPage(1)
          }}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '전체 위치' },
            { value: 'center', label: '중앙' },
            { value: 'bottom', label: '하단' },
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
            { value: 'active', label: '진행중' },
            { value: 'scheduled', label: '예정' },
            { value: 'expired', label: '종료' },
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
          onClick: () => navigate(`/content/popups/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
