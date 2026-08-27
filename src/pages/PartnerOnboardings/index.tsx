import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Input, Select, Space, Table, Tag, Typography } from 'antd'
import { FileAddOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  getPartnerOnboardings,
  type PartnerOnboarding,
  type PartnerOnboardingStatus,
} from '@/services/partnerOnboardingService'
import { CONTRACT_STATUS, ONBOARDING_STATUS } from './metadata'
import './partner-onboarding.css'

export function PartnerOnboardingsPage({
  basePath = '/partner-onboardings',
  salesMode = false,
}: {
  basePath?: string
  salesMode?: boolean
} = {}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PartnerOnboardingStatus | 'all'>('all')
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['partner-onboardings', search, status],
    queryFn: () => getPartnerOnboardings({ search, status }),
  })

  const summary = useMemo(() => ({
    total: data.length,
    contract: data.filter((item) => item.contract_status === 'completed').length,
    waiting: data.filter((item) => item.status === 'ready_for_approval').length,
    completed: data.filter((item) => item.status === 'approved').length,
  }), [data])

  return (
    <div className="partner-page">
      <div className="partner-page-header">
        <div>
          <Typography.Title level={2}>{salesMode ? '현장 입점 접수' : '입점요청(영업 전용)'}</Typography.Title>
          <Typography.Text type="secondary">{salesMode ? '내가 담당한 입점 신청과 진행 상태를 확인합니다.' : '현장 접수부터 계약, 검수, 사업주·상품 생성까지 한 곳에서 관리합니다.'}</Typography.Text>
        </div>
        <Button type="primary" size="large" icon={<FileAddOutlined />} onClick={() => navigate(`${basePath}/new`)}>
          입점 신청 등록
        </Button>
      </div>

      <div className="partner-summary-grid">
        <Card size="small"><Typography.Text type="secondary">전체 신청</Typography.Text><strong>{summary.total}</strong></Card>
        <Card size="small"><Typography.Text type="secondary">계약 완료</Typography.Text><strong>{summary.contract}</strong></Card>
        <Card size="small"><Typography.Text type="secondary">승인 대기</Typography.Text><strong>{summary.waiting}</strong></Card>
        <Card size="small"><Typography.Text type="secondary">입점 완료</Typography.Text><strong>{summary.completed}</strong></Card>
      </div>

      <div className="partner-filter-bar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="상호명, 사업자번호, 담당자 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: '전체 상태' },
            ...Object.entries(ONBOARDING_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
          ]}
        />
      </div>

      {error && <Alert type="error" showIcon message={(error as Error).message} style={{ marginBottom: 16 }} />}
      <Table<PartnerOnboarding>
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        scroll={{ x: 1050 }}
        pagination={{ pageSize: 15, showTotal: (total) => `총 ${total}건` }}
        onRow={(record) => ({ onClick: () => navigate(`${basePath}/${record.id}`), style: { cursor: 'pointer' } })}
        columns={[
          {
            title: '업체', key: 'business', width: 210,
            render: (_, item) => <div><b>{item.business_name}</b><div className="muted">{item.business_number}</div></div>,
          },
          { title: '담당자', key: 'contact', width: 140, render: (_, item) => <div>{item.contact_name}<div className="muted">{item.contact_phone}</div></div> },
          { title: '상품', width: 70, align: 'center', render: (_, item) => `${item.products?.length || 0}개` },
          {
            title: '서류', width: 90, align: 'center',
            render: (_, item) => {
              const count = item.documents?.length || 0
              return <Tag color={count >= 2 ? 'green' : 'orange'}>{count}/2</Tag>
            },
          },
          { title: '계약', width: 110, render: (_, item) => <Tag color={CONTRACT_STATUS[item.contract_status].color}>{CONTRACT_STATUS[item.contract_status].label}</Tag> },
          { title: '진행상태', width: 130, render: (_, item) => <Tag color={ONBOARDING_STATUS[item.status].color}>{ONBOARDING_STATUS[item.status].label}</Tag> },
          { title: '영업담당', dataIndex: 'sales_manager_name', width: 100, render: (value) => value || '-' },
          { title: '신청일', dataIndex: 'created_at', width: 110, render: (value) => dayjs(value).format('YYYY-MM-DD') },
          { title: '', width: 80, fixed: 'right', render: (_, item) => <Space><Button size="small" onClick={(event) => { event.stopPropagation(); navigate(`${basePath}/${item.id}`) }}>상세</Button></Space> },
        ]}
      />
    </div>
  )
}
