import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, message, Popconfirm, Switch } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getFAQ, deleteFAQ, toggleFAQVisibility } from '@/services/faqService'
import { FAQ_CATEGORY_LABEL, NOTICE_VISIBILITY_LABEL, NOTICE_VISIBILITY_COLOR, DATETIME_FORMAT } from '@/constants'

export function FAQDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: faq, isLoading } = useQuery({
    queryKey: ['faq', id],
    queryFn: () => getFAQ(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFAQ,
    onSuccess: () => {
      message.success('FAQ가 삭제되었습니다')
      navigate('/content/faqs')
    },
    onError: () => {
      message.error('삭제에 실패했습니다')
    },
  })

  const visibilityMutation = useMutation({
    mutationFn: (isVisible: boolean) => toggleFAQVisibility(id!, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq', id] })
      message.success('공개 상태가 변경되었습니다')
    },
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!faq) {
    return <div>FAQ를 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Tag>{FAQ_CATEGORY_LABEL[faq.category] || faq.category}</Tag>
        <h2 style={{ margin: 0 }}>{faq.question}</h2>
        <Tag color={NOTICE_VISIBILITY_COLOR[faq.is_visible ? 'visible' : 'hidden']}>
          {NOTICE_VISIBILITY_LABEL[faq.is_visible ? 'visible' : 'hidden']}
        </Tag>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/content/faqs/${id}/edit`)}
        >
          수정
        </Button>
        <Popconfirm
          title="FAQ 삭제"
          description="정말 삭제하시겠습니까?"
          onConfirm={() => deleteMutation.mutate(id!)}
          okText="삭제"
          cancelText="취소"
        >
          <Button danger icon={<DeleteOutlined />}>
            삭제
          </Button>
        </Popconfirm>
      </div>

      <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="카테고리">{FAQ_CATEGORY_LABEL[faq.category] || faq.category}</Descriptions.Item>
        <Descriptions.Item label="정렬순서">{faq.sort_order}</Descriptions.Item>
        <Descriptions.Item label="등록일">{dayjs(faq.created_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="수정일">{dayjs(faq.updated_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="공개">
          <Switch
            checked={faq.is_visible}
            onChange={(checked) => visibilityMutation.mutate(checked)}
          />
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 8 }}>질문</h4>
        <div
          style={{
            padding: 16,
            background: '#e6f4ff',
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          {faq.question}
        </div>

        <h4 style={{ marginBottom: 8 }}>답변</h4>
        <div
          style={{
            padding: 16,
            background: '#fafafa',
            borderRadius: 6,
            whiteSpace: 'pre-wrap',
            minHeight: 100,
          }}
        >
          {faq.answer}
        </div>
      </div>

      <Divider />
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/content/faqs')}>
        목록으로
      </Button>
    </div>
  )
}
