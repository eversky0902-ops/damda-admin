import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { getProduct, updateProduct } from '@/services/productService'
import { ProductForm } from '@/components/ProductForm'
import type { ProductUpdateInput } from '@/types'

const { Text } = Typography

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 상품 정보 조회
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (input: ProductUpdateInput) => updateProduct(id!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      message.success('상품이 수정되었습니다')
      navigate(`/products/${id}`)
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const handleSubmit = (values: Record<string, unknown>) => {
    mutation.mutate(values as ProductUpdateInput)
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!product) {
    return <div>상품을 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>상품 수정</h2>
        <Text type="secondary">{product.name}</Text>
      </div>

      <ProductForm
        mode="edit"
        initialValues={product}
        productId={id}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/products/${id}`)}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
