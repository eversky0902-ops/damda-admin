import { useNavigate } from 'react-router-dom'
import { Typography, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createSettlement, type SettlementCreateInput } from '@/services/settlementService'
import { SettlementForm } from '@/components/SettlementForm'

const { Text } = Typography

export function SettlementCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      message.success('정산이 등록되었습니다')
      navigate('/settlements')
    },
    onError: (error: Error) => {
      message.error(error.message || '등록에 실패했습니다')
    },
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>정산 등록</h2>
        <Text type="secondary">사업주에 대한 새로운 정산 내역을 등록합니다</Text>
      </div>

      <SettlementForm
        mode="create"
        onSubmit={(values) => createMutation.mutate(values as unknown as SettlementCreateInput)}
        onCancel={() => navigate('/settlements')}
        isSubmitting={createMutation.isPending}
      />
    </div>
  )
}
