import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { getBanner, updateBanner } from '@/services/bannerService'
import { BannerForm } from '@/components/BannerForm'

const { Text } = Typography

export function BannerEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: banner, isLoading } = useQuery({
    queryKey: ['banner', id],
    queryFn: () => getBanner(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      updateBanner(id!, {
        title: values.title as string | undefined,
        image_url: values.image_url as string,
        sort_order: values.sort_order as number,
        is_visible: values.is_visible as boolean,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner', id] })
      message.success('이미지가 수정되었습니다')
      navigate(`/content/banners/${id}`)
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '수정에 실패했습니다')
    },
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!banner) {
    return <div>이미지를 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>메인 이미지 수정</h2>
        <Text type="secondary">이미지 정보를 수정합니다</Text>
      </div>

      <BannerForm
        mode="edit"
        initialValues={banner}
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate(`/content/banners/${id}`)}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
