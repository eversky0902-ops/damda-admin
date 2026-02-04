import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { getSettlement, updateSettlement, type SettlementUpdateInput } from '@/services/settlementService'
import { SettlementForm } from '@/components/SettlementForm'

const { Text } = Typography

export function SettlementEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: settlement, isLoading } = useQuery({
    queryKey: ['settlement', id],
    queryFn: () => getSettlement(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: SettlementUpdateInput) => updateSettlement(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlement', id] })
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      message.success('정산이 수정되었습니다')
      navigate(`/settlements/${id}`)
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

  if (!settlement) {
    return <div>정산 정보를 찾을 수 없습니다</div>
  }

  // pending 상태가 아니면 수정 불가
  if (settlement.status !== 'pending') {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Text type="secondary">완료된 정산은 수정할 수 없습니다</Text>
      </div>
    )
  }

  const vendor = settlement.business_owner as { name: string } | undefined

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>정산 수정</h2>
        <Text type="secondary">{vendor?.name || '사업주'}의 정산 내역을 수정합니다</Text>
      </div>

      <SettlementForm
        mode="edit"
        initialValues={{
          ...settlement,
          business_owner_id: settlement.business_owner_id,
        }}
        onSubmit={(values) => updateMutation.mutate(values as SettlementUpdateInput)}
        onCancel={() => navigate(`/settlements/${id}`)}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  )
}
