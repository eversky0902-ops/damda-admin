import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Descriptions,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  approveBusinessSignup,
  getBusinessSignupRequests,
  rejectBusinessSignup,
  type BusinessSignupRequest,
  type BusinessSignupStatus,
} from '@/services/businessSignupService'
import { getAllVendors } from '@/services/vendorService'
import type { BusinessOwner } from '@/types'

const statusLabel: Record<BusinessSignupStatus, string> = {
  pending: '승인대기',
  approved: '승인완료',
  rejected: '반려',
}

const statusColor: Record<BusinessSignupStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
}

export function BusinessSignupsPage() {
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<BusinessSignupRequest | null>(null)
  const [selectedVendorId, setSelectedVendorId] = useState<string>()
  const [search, setSearch] = useState('')

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['business-signup-requests'],
    queryFn: getBusinessSignupRequests,
  })
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', 'all-for-signup-matching'],
    queryFn: getAllVendors,
  })

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return requests
    return requests.filter((request) =>
      [request.email, request.owner_code, request.business_name, request.business_number, request.contact_name]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(keyword))
    )
  }, [requests, search])

  const approveMutation = useMutation({
    mutationFn: ({ requestId, vendorId }: { requestId: string; vendorId: string }) =>
      approveBusinessSignup(requestId, vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-signup-requests'] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      setSelectedRequest(null)
      setSelectedVendorId(undefined)
      message.success('사업주 계정이 매칭되어 로그인이 활성화되었습니다.')
    },
    onError: (mutationError: Error) => message.error(mutationError.message),
  })

  const rejectMutation = useMutation({
    mutationFn: rejectBusinessSignup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-signup-requests'] })
      message.success('가입 신청을 반려했습니다.')
    },
    onError: (mutationError: Error) => message.error(mutationError.message),
  })

  const openMatching = (request: BusinessSignupRequest) => {
    setSelectedRequest(request)
    const exactMatch = vendors.find((vendor) => vendor.owner_code === request.owner_code)
    setSelectedVendorId(exactMatch?.id)
  }

  const columns: ColumnsType<BusinessSignupRequest> = [
    {
      title: '신청일',
      dataIndex: 'created_at',
      width: 120,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    { title: '사업자명', dataIndex: 'business_name' },
    {
      title: '사업주 코드',
      dataIndex: 'owner_code',
      width: 145,
      render: (value: string | null) => value ? <Typography.Text code copyable>{value}</Typography.Text> : '-',
    },
    { title: '사업자등록번호', dataIndex: 'business_number', width: 150 },
    { title: '대표자', dataIndex: 'representative', width: 100 },
    { title: '이메일', dataIndex: 'email' },
    { title: '담당자', dataIndex: 'contact_name', width: 100 },
    {
      title: '상태',
      dataIndex: 'status',
      width: 100,
      render: (status: BusinessSignupStatus) => <Tag color={statusColor[status]}>{statusLabel[status]}</Tag>,
    },
    {
      title: '처리',
      width: 150,
      render: (_, request) => request.status === 'pending' ? (
        <Space>
          <Button type="primary" size="small" onClick={() => openMatching(request)}>사업자 매칭</Button>
          <Button
            danger
            size="small"
            loading={rejectMutation.isPending}
            onClick={() => Modal.confirm({
              title: '가입 신청을 반려하시겠습니까?',
              okText: '반려',
              cancelText: '취소',
              okButtonProps: { danger: true },
              onOk: () => rejectMutation.mutateAsync(request.id),
            })}
          >반려</Button>
        </Space>
      ) : '-',
    },
  ]

  const selectedVendor = vendors.find((vendor) => vendor.id === selectedVendorId)

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>사업주 가입 승인</Typography.Title>
        <Typography.Text type="secondary">
          사업주 콘솔에서 가입한 계정을 등록된 사업자와 매칭하면 로그인이 활성화됩니다.
        </Typography.Text>
      </div>

      {error && <Alert type="error" showIcon message={(error as Error).message} style={{ marginBottom: 16 }} />}
      <Input.Search
        allowClear
        placeholder="사업자명, 사업자등록번호, 이메일, 담당자 검색"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ width: 420, marginBottom: 16 }}
      />
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={filteredRequests}
        pagination={{ pageSize: 15, showTotal: (total) => `총 ${total}건` }}
      />

      <Modal
        title="가입 계정과 사업자 매칭"
        open={!!selectedRequest}
        okText="매칭 후 로그인 허용"
        cancelText="취소"
        confirmLoading={approveMutation.isPending}
        okButtonProps={{
          disabled: !selectedVendorId || selectedVendor?.owner_code !== selectedRequest?.owner_code,
        }}
        onCancel={() => {
          setSelectedRequest(null)
          setSelectedVendorId(undefined)
        }}
        onOk={() => {
          if (selectedRequest && selectedVendorId) {
            approveMutation.mutate({ requestId: selectedRequest.id, vendorId: selectedVendorId })
          }
        }}
      >
        {selectedRequest && (
          <>
            <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="가입 이메일">{selectedRequest.email}</Descriptions.Item>
              <Descriptions.Item label="사업주 코드">
                {selectedRequest.owner_code
                  ? <Typography.Text code copyable>{selectedRequest.owner_code}</Typography.Text>
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="신청 사업자">{selectedRequest.business_name}</Descriptions.Item>
              <Descriptions.Item label="사업자등록번호">{selectedRequest.business_number}</Descriptions.Item>
            </Descriptions>
            <Typography.Text strong>매칭할 등록 사업자</Typography.Text>
            <Select
              showSearch
              allowClear
              value={selectedVendorId}
              onChange={setSelectedVendorId}
              placeholder="사업자를 선택하세요"
              optionFilterProp="label"
              style={{ width: '100%', marginTop: 8 }}
              options={vendors.map((vendor: BusinessOwner) => ({
                value: vendor.id,
                label: `${vendor.name} · ${vendor.owner_code} · ${vendor.business_number}`,
              }))}
            />
            {selectedVendor && selectedVendor.owner_code !== selectedRequest.owner_code && (
              <Alert
                type="warning"
                showIcon
                message="가입 신청의 사업주 코드와 선택한 사업주의 코드가 다릅니다. 연결할 수 없습니다."
                style={{ marginTop: 12 }}
              />
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
