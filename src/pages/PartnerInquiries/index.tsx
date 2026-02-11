import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag, message, Popconfirm, Space, Dropdown } from 'antd'
import { SearchOutlined, DeleteOutlined, CheckOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'

import {
  getPartnerInquiries,
  getAllPartnerInquiries,
  deletePartnerInquiries,
  bulkUpdatePartnerInquiryStatus,
} from '@/services/partnerInquiryService'
import { useAuthStore } from '@/stores/authStore'
import { formatPhoneNumber } from '@/utils/format'
import {
  downloadExcel,
  PARTNER_INQUIRY_EXCEL_COLUMNS,
  formatPartnerInquiriesForExcel,
} from '@/utils/excel'
import { PARTNER_INQUIRY_STATUS_LABEL, PARTNER_INQUIRY_STATUS_COLOR, DEFAULT_PAGE_SIZE, DATE_FORMAT } from '@/constants'
import type { PartnerInquiry, PartnerInquiryStatus } from '@/types'

export function PartnerInquiriesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { admin } = useAuthStore()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<PartnerInquiryStatus | 'all'>('all')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

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

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deletePartnerInquiries(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-inquiries'] })
      message.success(`${selectedRowKeys.length}건이 삭제되었습니다`)
      setSelectedRowKeys([])
    },
    onError: () => {
      message.error('삭제에 실패했습니다')
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: PartnerInquiryStatus }) =>
      bulkUpdatePartnerInquiryStatus(ids, status, admin?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-inquiries'] })
      message.success(`${selectedRowKeys.length}건의 상태가 변경되었습니다`)
      setSelectedRowKeys([])
    },
    onError: () => {
      message.error('상태 변경에 실패했습니다')
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

  // 엑셀 다운로드 (전체)
  const handleDownloadAll = async () => {
    try {
      message.loading({ content: '다운로드 준비 중...', key: 'download' })
      const allData = await getAllPartnerInquiries()
      const formatted = formatPartnerInquiriesForExcel(allData)
      downloadExcel(formatted, PARTNER_INQUIRY_EXCEL_COLUMNS, '입점문의_전체목록')
      message.success({ content: `엑셀 다운로드 완료 (${allData.length}건)`, key: 'download' })
    } catch {
      message.error({ content: '다운로드에 실패했습니다', key: 'download' })
    }
  }

  // 엑셀 다운로드 (현재 목록)
  const handleDownloadCurrent = () => {
    if (!data?.data.length) {
      message.warning('다운로드할 데이터가 없습니다')
      return
    }
    const formatted = formatPartnerInquiriesForExcel(data.data)
    downloadExcel(formatted, PARTNER_INQUIRY_EXCEL_COLUMNS, '입점문의_목록')
    message.success('엑셀 다운로드가 완료되었습니다')
  }

  const downloadMenuItems: MenuProps['items'] = [
    {
      key: 'current',
      label: '현재 목록 다운로드',
      icon: <DownloadOutlined />,
      onClick: handleDownloadCurrent,
    },
    {
      key: 'all',
      label: '전체 목록 다운로드',
      icon: <DownloadOutlined />,
      onClick: handleDownloadAll,
    },
  ]

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

  const hasSelected = selectedRowKeys.length > 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>입점문의 관리</h2>
        <Dropdown menu={{ items: downloadMenuItems }} placement="bottomRight">
          <Button icon={<DownloadOutlined />}>엑셀 다운로드</Button>
        </Dropdown>
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

        {hasSelected && (
          <Space style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: 13, color: '#666' }}>{selectedRowKeys.length}건 선택</span>
            <Popconfirm
              title="상태 변경"
              description="선택한 항목을 처리완료로 변경하시겠습니까?"
              onConfirm={() => statusMutation.mutate({ ids: selectedRowKeys as string[], status: 'approved' })}
              okText="변경"
              cancelText="취소"
            >
              <Button
                icon={<CheckOutlined />}
                loading={statusMutation.isPending}
              >
                처리완료
              </Button>
            </Popconfirm>
            <Popconfirm
              title="입점문의 삭제"
              description={`선택한 ${selectedRowKeys.length}건을 삭제하시겠습니까?`}
              onConfirm={() => deleteMutation.mutate(selectedRowKeys as string[])}
              okText="삭제"
              cancelText="취소"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              >
                삭제
              </Button>
            </Popconfirm>
          </Space>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        size="small"
        bordered
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
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
