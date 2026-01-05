import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { getVendor, updateVendor } from '@/services/vendorService'
import { VendorForm } from '@/components/VendorForm'
import type { BusinessOwnerUpdateInput } from '@/types'

const { Text } = Typography

export function VendorEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => getVendor(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: BusinessOwnerUpdateInput) => updateVendor(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      message.success('정보가 수정되었습니다')
      navigate(`/vendors/${id}`)
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

  if (!vendor) {
    return <div>사업주를 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>사업주 정보 수정</h2>
        <Text type="secondary">{vendor.name}의 정보를 수정합니다</Text>
      </div>

      <VendorForm
        mode="edit"
        initialValues={vendor}
        vendorId={id}
        onSubmit={(values) => updateMutation.mutate(values as BusinessOwnerUpdateInput)}
        onCancel={() => navigate(`/vendors/${id}`)}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  )
}
