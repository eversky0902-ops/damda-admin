import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { getBanner, updateBanner } from '@/services/bannerService'
import { BannerForm } from '@/components/BannerForm'
import type { BannerType } from '@/types'

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
        type: values.type as BannerType,
        title: values.title as string | undefined,
        image_url: values.image_url as string,
        link_url: values.link_url as string | undefined,
        sort_order: values.sort_order as number,
        start_date: values.start_date as string | null | undefined,
        end_date: values.end_date as string | null | undefined,
        is_visible: values.is_visible as boolean,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner', id] })
      message.success('배너가 수정되었습니다')
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
    return <div>배너를 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>배너 수정</h2>
        <Text type="secondary">배너 정보를 수정합니다</Text>
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
