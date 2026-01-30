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
    onSuccess: async (_data, variables) => {
      message.success('카테고리가 등록되었습니다.')
      // 실제 제출된 parent_id 또는 URL의 parentId 사용
      const targetParentId = variables.parent_id || parentId
      // 모든 카테고리 관련 캐시 무효화 (형제 카테고리 sort_order 변경 반영)
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      await queryClient.invalidateQueries({ queryKey: ['category'] }) // 모든 개별 카테고리 캐시
      if (targetParentId) {
        navigate(`/categories/${targetParentId}`)
      } else {
        navigate('/categories')
      }
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
      icon_url: values.icon_url,
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
        onCancel={() => navigate(parentId ? `/categories/${parentId}` : '/categories')}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
