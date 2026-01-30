import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { AdBannerForm } from '@/components/AdBannerForm'
import { getAdBanner, updateAdBanner } from '@/services/adBannerService'
import type { AdBannerUpdateInput } from '@/types'

const { Text } = Typography

export function AdBannerEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: adBanner, isLoading } = useQuery({
    queryKey: ['adBanner', id],
    queryFn: () => getAdBanner(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (input: AdBannerUpdateInput) => updateAdBanner(id!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adBanner', id] })
      message.success('광고 배너가 수정되었습니다')
      navigate(`/content/ad-banners/${id}`)
    },
    onError: () => {
      message.error('수정에 실패했습니다')
    },
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!adBanner) {
    return <div>광고 배너를 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>광고 배너 수정</h2>
        <Text type="secondary">{adBanner.title}</Text>
      </div>

      <AdBannerForm
        mode="edit"
        initialValues={adBanner}
        onSubmit={(values) => mutation.mutate(values as unknown as AdBannerUpdateInput)}
        onCancel={() => navigate(`/content/ad-banners/${id}`)}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
