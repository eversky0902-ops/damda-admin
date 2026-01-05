import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, message } from 'antd'

import { createProduct } from '@/services/productService'
import { ProductForm } from '@/components/ProductForm'
import type { ProductCreateInput } from '@/types'

const { Text } = Typography

export function ProductCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: ProductCreateInput) => createProduct(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      message.success('상품이 등록되었습니다')
      navigate(`/products/${data.id}`)
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const handleSubmit = (values: Record<string, unknown>) => {
    mutation.mutate(values as unknown as ProductCreateInput)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>상품 등록</h2>
        <Text type="secondary">새로운 체험 상품을 등록합니다</Text>
      </div>

      <ProductForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/products')}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
