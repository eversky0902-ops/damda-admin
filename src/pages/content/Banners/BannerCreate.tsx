import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Typography, message } from 'antd'

import { createBanner } from '@/services/bannerService'
import { BannerForm } from '@/components/BannerForm'

const { Text } = Typography

export function BannerCreatePage() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      createBanner({
        title: values.title as string | undefined,
        image_url: values.image_url as string,
        sort_order: values.sort_order as number,
        is_visible: values.is_visible as boolean,
      }),
    onSuccess: () => {
      message.success('이미지가 등록되었습니다')
      navigate('/content/banners')
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '등록에 실패했습니다')
    },
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>메인 이미지 등록</h2>
        <Text type="secondary">메인 화면에 표시될 이미지를 등록합니다</Text>
      </div>

      <BannerForm
        mode="create"
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate('/content/banners')}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
