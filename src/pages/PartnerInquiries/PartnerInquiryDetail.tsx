import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, message, Card, Input, Modal } from 'antd'
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getPartnerInquiry, updatePartnerInquiryStatus, updatePartnerInquiryMemo } from '@/services/partnerInquiryService'
import { formatPhoneNumber } from '@/utils/format'
import { PARTNER_INQUIRY_STATUS_LABEL, PARTNER_INQUIRY_STATUS_COLOR, DATETIME_FORMAT } from '@/constants'
import { useAuthStore } from '@/stores/authStore'

const { TextArea } = Input

export function PartnerInquiryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { admin } = useAuthStore()
  const [memo, setMemo] = useState('')

  const { data: inquiry, isLoading } = useQuery({
    queryKey: ['partner-inquiry', id],
    queryFn: () => getPartnerInquiry(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (inquiry) {
      setMemo(inquiry.memo || '')
    }
  }, [inquiry])

  const reviewMutation = useMutation({
    mutationFn: () => updatePartnerInquiryStatus(id!, admin!.id, memo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-inquiry', id] })
      queryClient.invalidateQueries({ queryKey: ['partner-inquiries'] })
      message.success('처리완료로 변경되었습니다')
    },
    onError: () => {
      message.error('상태 변경에 실패했습니다')
    },
  })

  const memoMutation = useMutation({
    mutationFn: () => updatePartnerInquiryMemo(id!, memo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-inquiry', id] })
      message.success('메모가 저장되었습니다')
    },
    onError: () => {
      message.error('메모 저장에 실패했습니다')
    },
  })

  const handleReview = () => {
    Modal.confirm({
      title: '처리 완료',
      content: '이 입점문의를 처리 완료로 변경하시겠습니까?',
      okText: '확인',
      cancelText: '취소',
      onOk: () => reviewMutation.mutate(),
    })
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!inquiry) {
    return <div>입점문의를 찾을 수 없습니다</div>
  }

  const isPending = inquiry.status === 'pending'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Tag color={PARTNER_INQUIRY_STATUS_COLOR[inquiry.status]}>
          {PARTNER_INQUIRY_STATUS_LABEL[inquiry.status]}
        </Tag>
        <h2 style={{ margin: 0 }}>{inquiry.name}</h2>
      </div>

      <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="업체명">{inquiry.name}</Descriptions.Item>
        <Descriptions.Item label="사업자번호">{inquiry.business_number || '-'}</Descriptions.Item>
        <Descriptions.Item label="대표자">{inquiry.representative || '-'}</Descriptions.Item>
        <Descriptions.Item label="담당자">{inquiry.contact_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="연락처">{formatPhoneNumber(inquiry.contact_phone)}</Descriptions.Item>
        <Descriptions.Item label="이메일">{inquiry.email || '-'}</Descriptions.Item>
        <Descriptions.Item label="우편번호">{inquiry.zipcode || '-'}</Descriptions.Item>
        <Descriptions.Item label="주소" span={2}>
          {inquiry.address || '-'}
          {inquiry.address_detail && ` ${inquiry.address_detail}`}
        </Descriptions.Item>
        <Descriptions.Item label="프로그램 유형" span={2}>
          {inquiry.program_types || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="등록일">{dayjs(inquiry.created_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="처리일">
          {inquiry.reviewed_at ? dayjs(inquiry.reviewed_at).format(DATETIME_FORMAT) : '-'}
        </Descriptions.Item>
        {inquiry.admin && (
          <Descriptions.Item label="처리자">{inquiry.admin.name}</Descriptions.Item>
        )}
      </Descriptions>

      {inquiry.description && (
        <Card title="문의 내용" size="small" style={{ marginBottom: 24 }}>
          <div style={{ whiteSpace: 'pre-wrap', minHeight: 100 }}>
            {inquiry.description}
          </div>
        </Card>
      )}

      <Card title="메모" size="small" style={{ marginBottom: 24 }}>
        <TextArea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모를 입력하세요"
          rows={4}
          style={{ marginBottom: 12 }}
        />
        <Button
          onClick={() => memoMutation.mutate()}
          loading={memoMutation.isPending}
        >
          메모 저장
        </Button>
      </Card>

      {isPending && (
        <div style={{ marginBottom: 24 }}>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleReview}
            loading={reviewMutation.isPending}
          >
            처리완료
          </Button>
        </div>
      )}

      <Divider />
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/partner-inquiries')}>
        목록으로
      </Button>
    </div>
  )
}
