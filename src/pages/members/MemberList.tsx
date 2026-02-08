import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Table, Button, Input, Select, Tag, Dropdown, message } from 'antd'
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'

import { getDaycares, getAllDaycares } from '@/services/daycareService'
import { formatPhoneNumber } from '@/utils/format'
import { downloadExcel, formatDaycaresForExcel, DAYCARE_EXCEL_COLUMNS } from '@/utils/excel'
import { DAYCARE_STATUS_LABEL, DAYCARE_STATUS_COLOR, DEFAULT_PAGE_SIZE, DATE_FORMAT } from '@/constants'
import type { Daycare, DaycareStatus } from '@/types'

export function MemberListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<DaycareStatus | 'all'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['daycares', page, pageSize, search, statusFilter],
    queryFn: () =>
      getDaycares({
        page,
        pageSize,
        filter: { search, status: statusFilter },
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

  // 엑셀 다운로드 (현재 목록)
  const handleDownloadCurrent = () => {
    if (!data?.data.length) {
      message.warning('다운로드할 데이터가 없습니다')
      return
    }
    const formatted = formatDaycaresForExcel(data.data)
    downloadExcel(formatted, DAYCARE_EXCEL_COLUMNS, '회원_목록')
  }

  // 엑셀 다운로드 (전체)
  const handleDownloadAll = async () => {
    try {
      message.loading({ content: '전체 데이터를 가져오는 중...', key: 'download' })
      const allData = await getAllDaycares()
      if (allData.length === 0) {
        message.warning({ content: '다운로드할 데이터가 없습니다.', key: 'download' })
        return
      }
      const formatted = formatDaycaresForExcel(allData)
      downloadExcel(formatted, DAYCARE_EXCEL_COLUMNS, '회원_전체목록')
      message.success({ content: `엑셀 다운로드 완료 (${allData.length}건)`, key: 'download' })
    } catch {
      message.error({ content: '다운로드 중 오류가 발생했습니다.', key: 'download' })
    }
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

  const columns: ColumnsType<Daycare> = [
    {
      title: '어린이집명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <a onClick={(e) => { e.stopPropagation(); navigate(`/members/${record.id}`); }}>{name}</a>
      ),
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
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
      render: (phone: string) => formatPhoneNumber(phone),
    },
    {
      title: '정원',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 80,
      render: (capacity: number | null) => capacity ? `${capacity}명` : '-',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: DaycareStatus) => (
        <Tag color={DAYCARE_STATUS_COLOR[status]}>
          {DAYCARE_STATUS_LABEL[status]}
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
        <h2 style={{ margin: 0 }}>회원 관리</h2>
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
          placeholder="어린이집명, 이메일, 담당자"
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
            { value: 'pending', label: '가입대기' },
            { value: 'requested', label: '승인요청' },
            { value: 'approved', label: '승인완료' },
            { value: 'rejected', label: '승인거절' },
            { value: 'revision_required', label: '보완필요' },
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
          onClick: () => navigate(`/members/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
