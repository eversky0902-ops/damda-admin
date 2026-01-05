import { useState } from 'react'
import { Table, Select, Button, Tag, DatePicker, Tooltip, Modal } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  getAdminLogs,
  getAdmins,
  ACTION_LABELS,
  TARGET_TYPE_LABELS,
} from '@/services/adminLogService'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, DATETIME_FORMAT } from '@/constants'
import type { AdminLog, AdminLogAction, AdminLogTargetType } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { RangePicker } = DatePicker

export function AdminLogsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [adminId, setAdminId] = useState<string>('all')
  const [action, setAction] = useState<AdminLogAction | 'all'>('all')
  const [targetType, setTargetType] = useState<AdminLogTargetType | 'all'>('all')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [detailModal, setDetailModal] = useState<AdminLog | null>(null)

  // 관리자 목록 조회
  const { data: admins } = useQuery({
    queryKey: ['admins'],
    queryFn: getAdmins,
  })

  // 활동 로그 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: ['adminLogs', page, pageSize, adminId, action, targetType, dateRange],
    queryFn: () =>
      getAdminLogs({
        page,
        pageSize,
        admin_id: adminId,
        action,
        target_type: targetType,
        date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
        date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
      }),
  })

  const handleSearch = () => {
    setPage(1)
  }

  const columns: ColumnsType<AdminLog> = [
    {
      title: '일시',
      dataIndex: 'created_at',
      width: 160,
      render: (value) => dayjs(value).format(DATETIME_FORMAT),
    },
    {
      title: '관리자',
      dataIndex: 'admin',
      width: 120,
      render: (admin) => admin?.name || '-',
    },
    {
      title: '작업',
      dataIndex: 'action',
      width: 100,
      render: (value: AdminLogAction) => {
        const colorMap: Record<AdminLogAction, string> = {
          create: 'green',
          update: 'blue',
          delete: 'red',
          status_change: 'orange',
          login: 'cyan',
          logout: 'default',
        }
        return <Tag color={colorMap[value]}>{ACTION_LABELS[value]}</Tag>
      },
    },
    {
      title: '대상',
      dataIndex: 'target_type',
      width: 100,
      render: (value: AdminLogTargetType) => TARGET_TYPE_LABELS[value] || value,
    },
    {
      title: '대상 ID',
      dataIndex: 'target_id',
      width: 280,
      ellipsis: true,
      render: (value) => (
        <Tooltip title={value}>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{value}</span>
        </Tooltip>
      ),
    },
    {
      title: 'IP 주소',
      dataIndex: 'ip_address',
      width: 130,
      render: (value) => value || '-',
    },
    {
      title: '',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            setDetailModal(record)
          }}
        />
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>활동 로그</h2>
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
          style={{ width: 140 }}
          value={adminId}
          onChange={setAdminId}
          placeholder="관리자"
          options={[
            { value: 'all', label: '전체 관리자' },
            ...(admins?.map((a) => ({ value: a.id, label: a.name })) || []),
          ]}
        />
        <Select
          style={{ width: 120 }}
          value={action}
          onChange={setAction}
          placeholder="작업 유형"
          options={[
            { value: 'all', label: '전체 작업' },
            ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Select
          style={{ width: 130 }}
          value={targetType}
          onChange={setTargetType}
          placeholder="대상 유형"
          options={[
            { value: 'all', label: '전체 대상' },
            ...Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          style={{ width: 240 }}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
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
          pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
          showTotal: (total) => `총 ${total}개`,
          size: 'small',
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      {/* 상세 모달 */}
      <Modal
        title="활동 로그 상세"
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={null}
        width={700}
      >
        {detailModal && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ color: '#666', fontSize: 12 }}>일시</div>
                  <div>{dayjs(detailModal.created_at).format(DATETIME_FORMAT)}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: 12 }}>관리자</div>
                  <div>{detailModal.admin?.name || '-'}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: 12 }}>작업</div>
                  <div>
                    <Tag>{ACTION_LABELS[detailModal.action]}</Tag>
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: 12 }}>대상</div>
                  <div>{TARGET_TYPE_LABELS[detailModal.target_type]}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: '#666', fontSize: 12 }}>대상 ID</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {detailModal.target_id}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: 12 }}>IP 주소</div>
                  <div>{detailModal.ip_address || '-'}</div>
                </div>
              </div>
            </div>

            {(detailModal.before_data || detailModal.after_data) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>변경 전</div>
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: 12,
                      borderRadius: 6,
                      fontSize: 12,
                      maxHeight: 300,
                      overflow: 'auto',
                    }}
                  >
                    {detailModal.before_data
                      ? JSON.stringify(detailModal.before_data, null, 2)
                      : '(없음)'}
                  </pre>
                </div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>변경 후</div>
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: 12,
                      borderRadius: 6,
                      fontSize: 12,
                      maxHeight: 300,
                      overflow: 'auto',
                    }}
                  >
                    {detailModal.after_data
                      ? JSON.stringify(detailModal.after_data, null, 2)
                      : '(없음)'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
