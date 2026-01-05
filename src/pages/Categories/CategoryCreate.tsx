import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, message } from 'antd'

import { CategoryForm, type CategoryFormValues } from '@/components/CategoryForm'
import { createCategory } from '@/services/categoryService'

const { Text } = Typography

export function CategoryCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  // URL 파라미터에서 상위 카테고리 정보 추출
  const parentId = searchParams.get('parentId') || undefined
  const depth = searchParams.get('depth') ? parseInt(searchParams.get('depth')!, 10) : undefined

  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      message.success('카테고리가 등록되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      navigate('/categories')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const handleSubmit = (values: CategoryFormValues) => {
    mutation.mutate({
      name: values.name,
      parent_id: values.parent_id,
      depth: values.depth,
      sort_order: values.sort_order,
      is_active: values.is_active,
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>카테고리 등록</h2>
        <Text type="secondary">새로운 카테고리를 등록합니다.</Text>
      </div>

      <CategoryForm
        mode="create"
        initialValues={{ parentId, depth }}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/categories')}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
