import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { CategoryForm, type CategoryFormValues } from '@/components/CategoryForm'
import { getCategory, updateCategory } from '@/services/categoryService'

const { Text } = Typography

export function CategoryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: category, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategory(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      updateCategory(id!, {
        name: values.name,
        sort_order: values.sort_order,
        is_active: values.is_active,
        icon_url: values.icon_url,
      }),
    onSuccess: async () => {
      message.success('카테고리가 수정되었습니다.')
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      await queryClient.invalidateQueries({ queryKey: ['category'] }) // 모든 개별 카테고리 캐시
      navigate(`/categories/${id}`)
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!category) {
    return <div>카테고리를 찾을 수 없습니다.</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>카테고리 수정</h2>
        <Text type="secondary">{category.name} 카테고리를 수정합니다.</Text>
      </div>

      <CategoryForm
        mode="edit"
        initialValues={category}
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate(`/categories/${id}`)}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
