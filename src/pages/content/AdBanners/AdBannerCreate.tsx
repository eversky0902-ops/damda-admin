import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Typography, message } from 'antd'

import { AdBannerForm } from '@/components/AdBannerForm'
import { createAdBanner } from '@/services/adBannerService'
import type { AdBannerCreateInput } from '@/types'

const { Text } = Typography

export function AdBannerCreatePage() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (input: AdBannerCreateInput) => createAdBanner(input),
    onSuccess: (data) => {
      message.success('광고 배너가 등록되었습니다')
      navigate(`/content/ad-banners/${data.id}`)
    },
    onError: () => {
      message.error('등록에 실패했습니다')
    },
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>광고 배너 등록</h2>
        <Text type="secondary">메인 카테고리 하단에 표시될 외부 업체 광고 배너를 등록합니다</Text>
      </div>

      <AdBannerForm
        mode="create"
        onSubmit={(values) => mutation.mutate(values as unknown as AdBannerCreateInput)}
        onCancel={() => navigate('/content/ad-banners')}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
