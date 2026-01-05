import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { getNotice, updateNotice } from '@/services/noticeService'
import { NoticeForm } from '@/components/NoticeForm'

const { Text } = Typography

export function NoticeEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: notice, isLoading } = useQuery({
    queryKey: ['notice', id],
    queryFn: () => getNotice(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      updateNotice(id!, {
        title: values.title as string,
        content: values.content as string,
        is_pinned: values.is_pinned as boolean,
        is_visible: values.is_visible as boolean,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notice', id] })
      message.success('공지사항이 수정되었습니다')
      navigate(`/content/notices/${id}`)
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

  if (!notice) {
    return <div>공지사항을 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>공지사항 수정</h2>
        <Text type="secondary">공지사항 내용을 수정합니다</Text>
      </div>

      <NoticeForm
        mode="edit"
        initialValues={notice}
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate(`/content/notices/${id}`)}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
