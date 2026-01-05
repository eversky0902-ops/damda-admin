import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Typography, message } from 'antd'

import { createNotice } from '@/services/noticeService'
import { NoticeForm } from '@/components/NoticeForm'
import { useAuthStore } from '@/stores/authStore'

const { Text } = Typography

export function NoticeCreatePage() {
  const navigate = useNavigate()
  const { admin } = useAuthStore()

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      createNotice(
        {
          title: values.title as string,
          content: values.content as string,
          is_pinned: values.is_pinned as boolean,
          is_visible: values.is_visible as boolean,
        },
        admin!.id
      ),
    onSuccess: () => {
      message.success('공지사항이 등록되었습니다')
      navigate('/content/notices')
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '등록에 실패했습니다')
    },
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>공지사항 등록</h2>
        <Text type="secondary">새로운 공지사항을 작성합니다</Text>
      </div>

      <NoticeForm
        mode="create"
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate('/content/notices')}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
