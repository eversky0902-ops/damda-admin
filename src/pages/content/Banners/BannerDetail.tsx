import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, message, Popconfirm, Switch, Image } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getBanner, deleteBanner, toggleBannerVisibility } from '@/services/bannerService'
import { NOTICE_VISIBILITY_LABEL, NOTICE_VISIBILITY_COLOR, DATETIME_FORMAT } from '@/constants'

export function BannerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: banner, isLoading } = useQuery({
    queryKey: ['banner', id],
    queryFn: () => getBanner(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => {
      message.success('이미지가 삭제되었습니다')
      navigate('/content/banners')
    },
    onError: () => {
      message.error('삭제에 실패했습니다')
    },
  })

  const visibilityMutation = useMutation({
    mutationFn: (isVisible: boolean) => toggleBannerVisibility(id!, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner', id] })
      message.success('공개 상태가 변경되었습니다')
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{banner.title || '(제목 없음)'}</h2>
        <Tag color={NOTICE_VISIBILITY_COLOR[banner.is_visible ? 'visible' : 'hidden']}>
          {NOTICE_VISIBILITY_LABEL[banner.is_visible ? 'visible' : 'hidden']}
        </Tag>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/content/banners/${id}/edit`)}
        >
          수정
        </Button>
        <Popconfirm
          title="이미지 삭제"
          description="정말 삭제하시겠습니까?"
          onConfirm={() => deleteMutation.mutate(id!)}
          okText="삭제"
          cancelText="취소"
        >
          <Button danger icon={<DeleteOutlined />}>
            삭제
          </Button>
        </Popconfirm>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 8 }}>메인 이미지</h4>
        <Image
          src={banner.image_url}
          alt="메인 이미지"
          style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8 }}
        />
      </div>

      <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="제목">{banner.title || '-'}</Descriptions.Item>
        <Descriptions.Item label="정렬순서">{banner.sort_order}</Descriptions.Item>
        <Descriptions.Item label="등록일">{dayjs(banner.created_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="수정일">{dayjs(banner.updated_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="공개">
          <Switch
            checked={banner.is_visible}
            onChange={(checked) => visibilityMutation.mutate(checked)}
          />
        </Descriptions.Item>
      </Descriptions>

      <Divider />
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/content/banners')}>
        목록으로
      </Button>
    </div>
  )
}
