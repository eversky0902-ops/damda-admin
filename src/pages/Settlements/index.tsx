import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Tag, Select, DatePicker, Input, message, Popconfirm, Modal } from 'antd'
import { PlusOutlined, SearchOutlined, CheckOutlined, ThunderboltOutlined, UnorderedListOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import { getSettlements, bulkCompleteSettlements, bulkGenerateSettlements, type SettlementWithVendor } from '@/services/settlementService'
import { downloadExcel, formatSettlementsForExcel, SETTLEMENT_LIST_EXCEL_COLUMNS } from '@/utils/excel'
import { DATE_FORMAT, DEFAULT_PAGE_SIZE } from '@/constants'
import type { SettlementStatus } from '@/types'

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '대기중' },
  { value: 'completed', label: '정산완료' },
]

export function SettlementsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<SettlementStatus | 'all'>('all')
  const [vendorSearch, setVendorSearch] = useState<string>('')
  const [vendorSearchInput, setVendorSearchInput] = useState<string>('')
  const [settlementMonth, setSettlementMonth] = useState<dayjs.Dayjs | null>(dayjs())
  const [viewAll, setViewAll] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 일괄 생성 모달
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [generateMonth, setGenerateMonth] = useState<dayjs.Dayjs | null>(dayjs())

  // 정산 목록 조회
  const { data, isLoading } = useQuery({
    queryKey: [
      'settlements',
      viewAll ? 'all' : settlementMonth?.format('YYYY-MM'),
      status,
      vendorSearch,
      viewAll ? page : null,
      viewAll ? pageSize : null,
    ],
    queryFn: () =>
      getSettlements({
        ...(viewAll ? { page, pageSize } : {}),
        status,
        vendor_search: vendorSearch,
        settlement_month: viewAll ? undefined : (settlementMonth?.format('YYYY-MM') || undefined),
      }),
  })

  // 합계 계산
  const summary = useMemo(() => {
    const items = data?.data || []
    return {
      totalSales: items.reduce((sum, s) => sum + s.total_sales, 0),
      totalCommission: items.reduce((sum, s) => sum + s.commission_amount, 0),
      totalRefund: items.reduce((sum, s) => sum + s.refund_amount, 0),
      totalSettlement: items.reduce((sum, s) => sum + s.settlement_amount, 0),
      count: items.length,
    }
  }, [data?.data])

  const bulkCompleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkCompleteSettlements(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      message.success(`${selectedRowKeys.length}건의 정산이 완료 처리되었습니다`)
      setSelectedRowKeys([])
    },
    onError: (error: Error) => {
      message.error(error.message || '처리에 실패했습니다')
    },
  })

  const bulkGenerateMutation = useMutation({
    mutationFn: (month: string) => bulkGenerateSettlements(month),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      setGenerateModalOpen(false)

      const parts: string[] = []
      if (result.created > 0) parts.push(`${result.created}건 생성`)
      if (result.skipped > 0) parts.push(`${result.skipped}건 스킵(이미 존재)`)
      if (result.errors.length > 0) parts.push(`${result.errors.length}건 오류`)

      if (result.errors.length > 0) {
        message.warning(`정산 일괄 생성: ${parts.join(', ')}`)
      } else {
        message.success(`정산 일괄 생성 완료: ${parts.join(', ')}`)
      }
    },
    onError: (error: Error) => {
      message.error(error.message || '일괄 생성에 실패했습니다')
    },
  })

  // 선택된 항목 중 대기중인 것만 필터
  const selectedPendingCount = (data?.data || []).filter(
    (s) => selectedRowKeys.includes(s.id) && s.status === 'pending'
  ).length

  const handleVendorSearch = () => {
    setVendorSearch(vendorSearchInput)
    setPage(1)
  }

  const handleBulkGenerate = () => {
    if (!generateMonth) {
      message.warning('정산월을 선택하세요')
      return
    }
    bulkGenerateMutation.mutate(generateMonth.format('YYYY-MM'))
  }

  const columns: ColumnsType<SettlementWithVendor> = [
    {
      title: '정산월',
      dataIndex: 'settlement_month',
      key: 'settlement_month',
      width: 100,
      render: (month: string | null) => {
        if (!month) return '-'
        const d = dayjs(month + '-01')
        return `${d.year()}년 ${d.month() + 1}월`
      },
    },
    {
      title: '사업주',
      key: 'business_owner',
      render: (_, record) => record.business_owner?.name || '-',
    },
    {
      title: '정산 기간',
      key: 'period',
      render: (_, record) =>
        `${dayjs(record.settlement_period_start).format(DATE_FORMAT)} ~ ${dayjs(record.settlement_period_end).format(DATE_FORMAT)}`,
    },
    {
      title: '총 매출',
      dataIndex: 'total_sales',
      key: 'total_sales',
      align: 'right',
      render: (v: number) => `${v.toLocaleString()}원`,
    },
    {
      title: '수수료',
      key: 'commission',
      align: 'right',
      render: (_, record) =>
        `${record.commission_amount.toLocaleString()}원 (${record.commission_rate}%)`,
    },
    {
      title: '환불',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      align: 'right',
      render: (v: number) => `${v.toLocaleString()}원`,
    },
    {
      title: '정산금',
      dataIndex: 'settlement_amount',
      key: 'settlement_amount',
      align: 'right',
      render: (v: number) => <strong>{v.toLocaleString()}원</strong>,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (s: SettlementStatus) => (
        <Tag color={s === 'completed' ? 'green' : 'orange'}>
          {s === 'completed' ? '정산완료' : '대기중'}
        </Tag>
      ),
    },
    {
      title: '정산일',
      dataIndex: 'settled_at',
      key: 'settled_at',
      render: (date: string | null) => (date ? dayjs(date).format(DATE_FORMAT) : '-'),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>정산 관리</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => setGenerateModalOpen(true)}
          >
            정산 일괄 생성
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/settlements/new')}>
            정산 등록
          </Button>
        </div>
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
          alignItems: 'center',
        }}
      >
        <Input
          placeholder="사업주명 검색"
          value={vendorSearchInput}
          onChange={(e) => setVendorSearchInput(e.target.value)}
          onPressEnter={handleVendorSearch}
          style={{ width: 180 }}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        />
        <Select
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
          style={{ width: 120 }}
          options={STATUS_OPTIONS}
        />
        {!viewAll && (
          <DatePicker
            picker="month"
            value={settlementMonth}
            onChange={(date) => {
              setSettlementMonth(date)
            }}
            style={{ width: 160 }}
            placeholder="정산월"
            format="YYYY년 MM월"
          />
        )}
        <Button type="primary" onClick={handleVendorSearch}>
          검색
        </Button>
        <Button
          icon={<UnorderedListOutlined />}
          type={viewAll ? 'primary' : 'default'}
          ghost={viewAll}
          onClick={() => {
            setViewAll(!viewAll)
            setPage(1)
            setSelectedRowKeys([])
          }}
        >
          전체 보기
        </Button>
        <Button
          onClick={() => {
            setStatus('all')
            setVendorSearch('')
            setVendorSearchInput('')
            setSettlementMonth(dayjs())
            setViewAll(false)
            setPage(1)
          }}
        >
          초기화
        </Button>
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{selectedRowKeys.length}건 선택됨</span>
          <Popconfirm
            title="일괄 정산 완료"
            description={`선택한 ${selectedPendingCount}건을 정산 완료 처리하시겠습니까?`}
            onConfirm={() => {
              const pendingIds = (data?.data || [])
                .filter((s) => selectedRowKeys.includes(s.id) && s.status === 'pending')
                .map((s) => s.id)
              if (pendingIds.length === 0) {
                message.warning('대기중인 정산이 없습니다')
                return
              }
              bulkCompleteMutation.mutate(pendingIds)
            }}
            okText="완료 처리"
            cancelText="취소"
          >
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled={selectedPendingCount === 0}
              loading={bulkCompleteMutation.isPending}
            >
              정산 완료 ({selectedPendingCount})
            </Button>
          </Popconfirm>
          <Button size="small" onClick={() => setSelectedRowKeys([])}>선택 해제</Button>
        </div>
      )}

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
        pagination={viewAll ? {
          current: page,
          pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
          size: 'small',
        } : false}
        onRow={(record) => ({
          onClick: () => navigate(`/settlements/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />

      {/* 합계 요약 + 엑셀 다운로드 */}
      {(data?.data?.length || 0) > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 12,
            padding: '10px 16px',
            background: '#f0f5ff',
            borderRadius: 6,
            alignItems: 'center',
            fontSize: 13,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <span>
              <strong>{summary.count}</strong>건
            </span>
            <span>
              총 매출 <strong>{summary.totalSales.toLocaleString()}</strong>원
            </span>
            <span>
              수수료 <strong>{summary.totalCommission.toLocaleString()}</strong>원
            </span>
            <span>
              환불 <strong>{summary.totalRefund.toLocaleString()}</strong>원
            </span>
            <span style={{ color: '#1677ff', fontSize: 14 }}>
              정산금 합계 <strong>{summary.totalSettlement.toLocaleString()}</strong>원
            </span>
          </div>
          <Button
            icon={<DownloadOutlined />}
            size="small"
            onClick={() => {
              const items = data?.data || []
              const formatted = formatSettlementsForExcel(items)
              const monthLabel = viewAll ? '전체' : (settlementMonth?.format('YYYY-MM') || '')
              downloadExcel(formatted, SETTLEMENT_LIST_EXCEL_COLUMNS, `정산목록_${monthLabel}`)
            }}
          >
            엑셀 다운로드
          </Button>
        </div>
      )}

      {/* 일괄 생성 모달 */}
      <Modal
        title="정산 일괄 생성"
        open={generateModalOpen}
        onCancel={() => setGenerateModalOpen(false)}
        onOk={handleBulkGenerate}
        okText="일괄 생성"
        cancelText="취소"
        confirmLoading={bulkGenerateMutation.isPending}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8, color: '#666' }}>
            정산월을 선택하면 해당 월의 <strong>전월 1일~말일</strong> 이용 완료 예약을 기준으로
            모든 활성 사업주에 대해 정산을 자동 생성합니다.
          </p>
          <p style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
            이미 해당 월에 정산이 존재하는 사업주는 자동으로 스킵됩니다.
          </p>
        </div>
        <div>
          <span style={{ marginRight: 8 }}>정산월:</span>
          <DatePicker
            picker="month"
            value={generateMonth}
            onChange={(date) => setGenerateMonth(date)}
            style={{ width: 200 }}
            format="YYYY년 MM월"
          />
          {generateMonth && (
            <div style={{ marginTop: 12, padding: 12, background: '#f0f5ff', borderRadius: 6, fontSize: 13 }}>
              <strong>정산 대상 기간:</strong>{' '}
              {generateMonth.subtract(1, 'month').startOf('month').format('YYYY.MM.DD')} ~{' '}
              {generateMonth.subtract(1, 'month').endOf('month').format('YYYY.MM.DD')}
              <br />
              <strong>정산일:</strong> {generateMonth.format('YYYY')}년 {generateMonth.format('MM')}월 10일
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
