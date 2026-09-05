import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import {
  getBusinessSignupDocumentUrl,
  getBusinessSignupRequests,
  reviewBusinessSignup,
  type BusinessSignupRequest,
  type BusinessSignupStatus,
} from '@/services/businessSignupService'

const statusLabel: Record<BusinessSignupStatus, string> = {
  pending: '승인대기',
  approved: '승인완료',
  rejected: '거절',
  on_hold: '승인보류',
}

const statusColor: Record<BusinessSignupStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  on_hold: 'gold',
}

export function BusinessSignupsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selectedRequest, setSelectedRequest] = useState<BusinessSignupRequest | null>(null)
  const [reviewStatus, setReviewStatus] = useState<Exclude<BusinessSignupStatus, 'pending'>>('on_hold')
  const [reviewNote, setReviewNote] = useState('')
  const [search, setSearch] = useState('')

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['business-signup-requests'],
    queryFn: getBusinessSignupRequests,
  })
  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return requests
    return requests.filter((request) =>
      [request.email, request.business_name, request.business_number, request.contact_name]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(keyword))
    )
  }, [requests, search])

  const reviewMutation = useMutation({
    mutationFn: ({ request, status, note }: {
      request: BusinessSignupRequest
      status: Exclude<BusinessSignupStatus, 'pending'>
      note: string
    }) => reviewBusinessSignup({
      requestId: request.id,
      status,
      reviewNote: note,
      businessOwnerId: status === 'approved'
        ? request.matched_business_owner_id || request.auth_user_id
        : undefined,
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-signup-requests'] })
      setSelectedRequest(null)
      setReviewNote('')
      if (variables.status === 'approved') {
        message.success('가입 승인이 완료되어 사업주 목록으로 이동합니다.')
        navigate('/vendors')
        return
      }
      message.success('가입 신청 상태와 관리자 메모가 저장되었습니다.')
    },
    onError: (mutationError: Error) => message.error(mutationError.message),
  })

  const openReview = (request: BusinessSignupRequest) => {
    setSelectedRequest(request)
    setReviewStatus(request.status === 'pending' ? 'on_hold' : request.status)
    setReviewNote(request.review_note || '')
  }

  const openDocument = async (bucket: string | null, path: string | null) => {
    if (!bucket || !path) return
    try {
      const url = await getBusinessSignupDocumentUrl(bucket, path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (documentError) {
      message.error(documentError instanceof Error ? documentError.message : '첨부 서류를 열 수 없습니다.')
    }
  }

  const columns: ColumnsType<BusinessSignupRequest> = [
    {
      title: '신청일',
      dataIndex: 'created_at',
      width: 120,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '사업자명',
      dataIndex: 'business_name',
      width: 200,
      render: (name: string, request) => <Button type="link" style={{ padding: 0, height: 'auto', textAlign: 'left', whiteSpace: 'normal' }} onClick={() => openReview(request)}>{name}</Button>,
    },
    { title: '사업자등록번호', dataIndex: 'business_number', width: 150 },
    { title: '대표자', dataIndex: 'representative', width: 100 },
    { title: '이메일', dataIndex: 'email', width: 220 },
    { title: '담당자', dataIndex: 'contact_name', width: 100 },
    {
      title: '상태',
      dataIndex: 'status',
      width: 100,
      render: (status: BusinessSignupStatus) => <Tag color={statusColor[status]}>{statusLabel[status]}</Tag>,
    },
    {
      title: '처리',
      width: 100,
      render: (_, request) => <Button size="small" onClick={() => openReview(request)}>검토</Button>,
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>사업주 가입 승인</Typography.Title>
        <Typography.Text type="secondary">
          담다 비즈니스센터의 가입 신청 정보를 확인하고 처리 상태를 관리합니다.
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
        scroll={{ x: 1100 }}
        onRow={(request) => ({ onClick: () => openReview(request), style: { cursor: 'pointer' } })}
        pagination={{ pageSize: 15, showTotal: (total) => `총 ${total}건` }}
      />

      <Modal
        title="가입 신청 상세·검토"
        open={!!selectedRequest}
        okText={reviewStatus === 'approved' ? '승인완료 저장' : reviewStatus === 'rejected' ? '거절 저장' : '승인보류 저장'}
        cancelText="취소"
        confirmLoading={reviewMutation.isPending}
        onCancel={() => {
          setSelectedRequest(null)
          setReviewNote('')
        }}
        onOk={() => {
          if (selectedRequest) {
            reviewMutation.mutate({
              request: selectedRequest,
              status: reviewStatus,
              note: reviewNote,
            })
          }
        }}
      >
        {selectedRequest && (
          <>
            <Typography.Text type="secondary">회원가입 시 입력한 정보를 확인하고 처리 상태와 관리자 메모를 기록합니다.</Typography.Text>
            <Descriptions size="small" column={2} bordered style={{ marginTop: 12 }}>
              <Descriptions.Item label="신청일">{dayjs(selectedRequest.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="현재 상태"><Tag color={statusColor[selectedRequest.status]}>{statusLabel[selectedRequest.status]}</Tag></Descriptions.Item>
              <Descriptions.Item label="사업자명">{selectedRequest.business_name}</Descriptions.Item>
              <Descriptions.Item label="사업자등록번호">{selectedRequest.business_number}</Descriptions.Item>
              <Descriptions.Item label="대표자명">{selectedRequest.representative}</Descriptions.Item>
              <Descriptions.Item label="담당자명">{selectedRequest.contact_name}</Descriptions.Item>
              <Descriptions.Item label="담당자 연락처">{selectedRequest.contact_phone}</Descriptions.Item>
              <Descriptions.Item label="이메일">{selectedRequest.email}</Descriptions.Item>
              <Descriptions.Item label="은행명">{selectedRequest.bank_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="예금주명">{selectedRequest.bank_holder || '-'}</Descriptions.Item>
              <Descriptions.Item label="계좌번호" span={2}>{selectedRequest.bank_account || '-'}</Descriptions.Item>
              <Descriptions.Item label="사업자등록증">
                {selectedRequest.business_registration_storage_path ? (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0 }}
                    onClick={() => openDocument(
                      selectedRequest.business_registration_storage_bucket,
                      selectedRequest.business_registration_storage_path,
                    )}
                  >
                    {selectedRequest.business_registration_file_name || '파일 보기'}
                  </Button>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="통장사본">
                {selectedRequest.bank_account_copy_storage_path ? (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0 }}
                    onClick={() => openDocument(
                      selectedRequest.bank_account_copy_storage_bucket,
                      selectedRequest.bank_account_copy_storage_path,
                    )}
                  >
                    {selectedRequest.bank_account_copy_file_name || '파일 보기'}
                  </Button>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="처리일" span={2}>{selectedRequest.reviewed_at ? dayjs(selectedRequest.reviewed_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '16px 0' }} />
            <Typography.Text strong>처리 상태</Typography.Text>
            <Select
              value={reviewStatus}
              onChange={setReviewStatus}
              style={{ width: '100%', marginTop: 8 }}
              options={[
                { value: 'approved', label: '승인완료' },
                { value: 'on_hold', label: '승인보류' },
                { value: 'rejected', label: '거절' },
              ]}
            />
            <Typography.Text strong style={{ display: 'block', marginTop: 16 }}>관리자 메모</Typography.Text>
            <Input.TextArea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="승인완료·승인보류·거절 사유와 후속 조치 내용을 남겨주세요."
              rows={4}
              maxLength={1000}
              showCount
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
