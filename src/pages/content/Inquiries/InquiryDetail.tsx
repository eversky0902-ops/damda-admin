import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, message, Card, Input, Form } from 'antd'
import { ArrowLeftOutlined, SendOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getInquiry, answerInquiry, updateInquiryAnswer } from '@/services/inquiryService'
import { INQUIRY_STATUS_LABEL, INQUIRY_STATUS_COLOR, INQUIRY_CATEGORY_LABEL, DATETIME_FORMAT } from '@/constants'
import { useAuthStore } from '@/stores/authStore'

const { TextArea } = Input

export function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { admin } = useAuthStore()
  const [form] = Form.useForm()
  const [isEditing, setIsEditing] = useState(false)

  const { data: inquiry, isLoading } = useQuery({
    queryKey: ['inquiry', id],
    queryFn: () => getInquiry(id!),
    enabled: !!id,
  })

  const answerMutation = useMutation({
    mutationFn: (answer: string) => answerInquiry(id!, { answer }, admin!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiry', id] })
      message.success('답변이 등록되었습니다')
      form.resetFields()
    },
    onError: () => {
      message.error('답변 등록에 실패했습니다')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (answer: string) => updateInquiryAnswer(id!, { answer }, admin!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiry', id] })
      message.success('답변이 수정되었습니다')
      setIsEditing(false)
    },
    onError: () => {
      message.error('답변 수정에 실패했습니다')
    },
  })

  const handleSubmitAnswer = () => {
    form.validateFields().then((values) => {
      if (inquiry?.status === 'answered') {
        updateMutation.mutate(values.answer)
      } else {
        answerMutation.mutate(values.answer)
      }
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
    return <div>문의를 찾을 수 없습니다</div>
  }

  const isAnswered = inquiry.status === 'answered'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Tag color={INQUIRY_STATUS_COLOR[inquiry.status]}>
          {INQUIRY_STATUS_LABEL[inquiry.status]}
        </Tag>
        <Tag>{INQUIRY_CATEGORY_LABEL[inquiry.category] || inquiry.category}</Tag>
        <h2 style={{ margin: 0 }}>{inquiry.title}</h2>
      </div>

      <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="작성자">{inquiry.daycare?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="이메일">{inquiry.daycare?.email || '-'}</Descriptions.Item>
        <Descriptions.Item label="등록일">{dayjs(inquiry.created_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="답변일">
          {inquiry.answered_at ? dayjs(inquiry.answered_at).format(DATETIME_FORMAT) : '-'}
        </Descriptions.Item>
        {inquiry.admin && (
          <Descriptions.Item label="답변자">{inquiry.admin.name}</Descriptions.Item>
        )}
      </Descriptions>

      <Card
        title="문의 내용"
        size="small"
        style={{ marginBottom: 24 }}
      >
        <div style={{ whiteSpace: 'pre-wrap', minHeight: 100 }}>
          {inquiry.content}
        </div>
      </Card>

      {isAnswered && !isEditing ? (
        <Card
          title="답변"
          size="small"
          extra={
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                form.setFieldValue('answer', inquiry.answer)
                setIsEditing(true)
              }}
            >
              수정
            </Button>
          }
          style={{ marginBottom: 24 }}
        >
          <div style={{ whiteSpace: 'pre-wrap', minHeight: 100 }}>
            {inquiry.answer}
          </div>
        </Card>
      ) : (
        <Card
          title={isAnswered ? '답변 수정' : '답변 작성'}
          size="small"
          style={{ marginBottom: 24 }}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="answer"
              rules={[{ required: true, message: '답변을 입력해주세요' }]}
            >
              <TextArea
                placeholder="답변 내용을 입력해주세요"
                rows={6}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {isEditing && (
                <Button onClick={() => setIsEditing(false)}>
                  취소
                </Button>
              )}
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmitAnswer}
                loading={answerMutation.isPending || updateMutation.isPending}
              >
                {isAnswered ? '답변 수정' : '답변 등록'}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      <Divider />
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/content/inquiries')}>
        목록으로
      </Button>
    </div>
  )
}
