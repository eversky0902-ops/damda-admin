import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { getFAQ, updateFAQ } from '@/services/faqService'
import { FAQForm } from '@/components/FAQForm'

const { Text } = Typography

export function FAQEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: faq, isLoading } = useQuery({
    queryKey: ['faq', id],
    queryFn: () => getFAQ(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      updateFAQ(id!, {
        category: values.category as string,
        question: values.question as string,
        answer: values.answer as string,
        sort_order: values.sort_order as number,
        is_visible: values.is_visible as boolean,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq', id] })
      message.success('FAQ가 수정되었습니다')
      navigate(`/content/faqs/${id}`)
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '수정에 실패했습니다')
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
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>FAQ 수정</h2>
        <Text type="secondary">FAQ 내용을 수정합니다</Text>
      </div>

      <FAQForm
        mode="edit"
        initialValues={faq}
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate(`/content/faqs/${id}`)}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
