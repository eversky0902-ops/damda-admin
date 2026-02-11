import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { getPopup, updatePopup } from '@/services/popupService'
import { PopupForm } from '@/components/PopupForm'

const { Text } = Typography

export function PopupEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: popup, isLoading } = useQuery({
    queryKey: ['popup', id],
    queryFn: () => getPopup(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      updatePopup(id!, {
        title: values.title as string,
        content: values.content as string | null | undefined,
        image_url: values.image_url as string | null | undefined,
        link_url: values.link_url as string | null | undefined,
        start_date: values.start_date as string,
        end_date: values.end_date as string,
        is_visible: values.is_visible as boolean,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popup', id] })
      queryClient.invalidateQueries({ queryKey: ['popups'] })
      message.success('팝업이 수정되었습니다')
      navigate(`/content/popups/${id}`)
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

  if (!popup) {
    return <div>팝업을 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>팝업 수정</h2>
        <Text type="secondary">팝업 정보를 수정합니다</Text>
      </div>

      <PopupForm
        mode="edit"
        initialValues={popup}
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate(`/content/popups/${id}`)}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
