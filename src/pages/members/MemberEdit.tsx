import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { getDaycare, updateDaycare } from '@/services/daycareService'
import { DaycareForm } from '@/components/DaycareForm'
import type { DaycareUpdateInput } from '@/types'

const { Text } = Typography

export function MemberEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: daycare, isLoading } = useQuery({
    queryKey: ['daycare', id],
    queryFn: () => getDaycare(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: DaycareUpdateInput) => updateDaycare(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daycare', id] })
      queryClient.invalidateQueries({ queryKey: ['daycares'] })
      message.success('정보가 수정되었습니다')
      navigate(`/members/${id}`)
    },
    onError: (error: Error) => {
      message.error(error.message || '수정에 실패했습니다')
    },
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!daycare) {
    return <div>회원을 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>회원 정보 수정</h2>
        <Text type="secondary">{daycare.name}의 정보를 수정합니다</Text>
      </div>

      <DaycareForm
        mode="edit"
        initialValues={daycare}
        onSubmit={(values) => updateMutation.mutate(values as DaycareUpdateInput)}
        onCancel={() => navigate(`/members/${id}`)}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  )
}
