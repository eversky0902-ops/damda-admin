import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Typography, message } from 'antd'

import { createFAQ } from '@/services/faqService'
import { FAQForm } from '@/components/FAQForm'

const { Text } = Typography

export function FAQCreatePage() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      createFAQ({
        category: values.category as string,
        question: values.question as string,
        answer: values.answer as string,
        sort_order: values.sort_order as number,
        is_visible: values.is_visible as boolean,
      }),
    onSuccess: () => {
      message.success('FAQ가 등록되었습니다')
      navigate('/content/faqs')
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '등록에 실패했습니다')
    },
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>FAQ 등록</h2>
        <Text type="secondary">새로운 FAQ를 작성합니다</Text>
      </div>

      <FAQForm
        mode="create"
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate('/content/faqs')}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
