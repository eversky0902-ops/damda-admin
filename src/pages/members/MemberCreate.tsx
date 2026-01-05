import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, message } from 'antd'

import { createDaycare } from '@/services/daycareService'
import { DaycareForm } from '@/components/DaycareForm'
import type { DaycareCreateInput } from '@/types'

const { Text } = Typography

export function MemberCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createDaycare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daycares'] })
      message.success('회원이 등록되었습니다')
      navigate('/members')
    },
    onError: (error: Error) => {
      message.error(error.message || '등록에 실패했습니다')
    },
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>회원 등록</h2>
        <Text type="secondary">새로운 어린이집 회원을 등록합니다</Text>
      </div>

      <DaycareForm
        mode="create"
        onSubmit={(values) => createMutation.mutate(values as unknown as DaycareCreateInput)}
        onCancel={() => navigate('/members')}
        isSubmitting={createMutation.isPending}
      />
    </div>
  )
}
