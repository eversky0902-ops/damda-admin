import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, message } from 'antd'

import { createPopup } from '@/services/popupService'
import { PopupForm } from '@/components/PopupForm'

const { Text } = Typography

export function PopupCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      createPopup({
        title: values.title as string,
        content: values.content as string | undefined,
        image_url: values.image_url as string | undefined,
        link_url: values.link_url as string | undefined,
        start_date: values.start_date as string,
        end_date: values.end_date as string,
        is_visible: values.is_visible as boolean,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups'] })
      message.success('팝업이 등록되었습니다')
      navigate('/content/popups')
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '등록에 실패했습니다')
    },
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>팝업 등록</h2>
        <Text type="secondary">새로운 팝업을 등록합니다</Text>
      </div>

      <PopupForm
        mode="create"
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate('/content/popups')}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
