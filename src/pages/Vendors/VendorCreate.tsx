import { useNavigate } from 'react-router-dom'
import { Typography, message } from 'antd'
import { useMutation } from '@tanstack/react-query'

import { createVendor } from '@/services/vendorService'
import { VendorForm } from '@/components/VendorForm'
import type { BusinessOwnerCreateInput } from '@/types'

const { Text } = Typography

export function VendorCreatePage() {
  const navigate = useNavigate()

  const createMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      message.success('사업주가 등록되었습니다')
      navigate('/vendors')
    },
    onError: (error: Error) => {
      message.error(error.message || '등록에 실패했습니다')
    },
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>사업주 등록</h2>
        <Text type="secondary">새로운 사업주를 등록하고 상품 판매를 시작하세요</Text>
      </div>

      <VendorForm
        mode="create"
        onSubmit={(values) => createMutation.mutate(values as unknown as BusinessOwnerCreateInput)}
        onCancel={() => navigate('/vendors')}
        isSubmitting={createMutation.isPending}
      />
    </div>
  )
}
