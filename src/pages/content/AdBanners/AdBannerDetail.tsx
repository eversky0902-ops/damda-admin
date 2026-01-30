import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Descriptions, Tag, Button, Spin, message, Popconfirm, Switch, Image, Divider } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getAdBanner, deleteAdBanner, toggleAdBannerVisibility } from '@/services/adBannerService'
import { AD_BANNER_STATUS_LABEL, AD_BANNER_STATUS_COLOR, DATETIME_FORMAT } from '@/constants'

export function AdBannerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: adBanner, isLoading } = useQuery({
    queryKey: ['adBanner', id],
    queryFn: () => getAdBanner(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdBanner,
    onSuccess: () => {
      message.success('광고 배너가 삭제되었습니다')
      navigate('/content/ad-banners')
    },
    onError: () => {
      message.error('삭제에 실패했습니다')
    },
  })

  const visibilityMutation = useMutation({
    mutationFn: ({ isVisible }: { isVisible: boolean }) =>
      toggleAdBannerVisibility(id!, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adBanner', id] })
      message.success('공개 상태가 변경되었습니다')
    },
    onError: () => {
      message.error('상태 변경에 실패했습니다')
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
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{adBanner.title}</h2>
        <Tag color={AD_BANNER_STATUS_COLOR[adBanner.is_visible ? 'visible' : 'hidden']}>
          {AD_BANNER_STATUS_LABEL[adBanner.is_visible ? 'visible' : 'hidden']}
        </Tag>
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/content/ad-banners/${id}/edit`)}
        >
          수정
        </Button>
        <Popconfirm
          title="광고 배너 삭제"
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

      {/* 배너 이미지 */}
      <Card style={{ marginBottom: 24 }}>
        <Image
          src={adBanner.image_url}
          alt={adBanner.title}
          style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 4 }}
        />
      </Card>

      {/* 상세 정보 */}
      <Card>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="광고주">{adBanner.advertiser_name}</Descriptions.Item>
          <Descriptions.Item label="제목">{adBanner.title}</Descriptions.Item>
          <Descriptions.Item label="정렬순서">{adBanner.sort_order}</Descriptions.Item>
          <Descriptions.Item label="공개 상태">
            <Switch
              checked={adBanner.is_visible}
              onChange={(checked) => visibilityMutation.mutate({ isVisible: checked })}
              checkedChildren="공개"
              unCheckedChildren="비공개"
            />
          </Descriptions.Item>
          <Descriptions.Item label="게시 시작일">
            {adBanner.start_date ? dayjs(adBanner.start_date).format(DATETIME_FORMAT) : '상시'}
          </Descriptions.Item>
          <Descriptions.Item label="게시 종료일">
            {adBanner.end_date ? dayjs(adBanner.end_date).format(DATETIME_FORMAT) : '상시'}
          </Descriptions.Item>
          <Descriptions.Item label="외부 링크" span={2}>
            {adBanner.link_url ? (
              <a href={adBanner.link_url} target="_blank" rel="noopener noreferrer">
                <LinkOutlined style={{ marginRight: 4 }} />
                {adBanner.link_url}
              </a>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="등록일">
            {dayjs(adBanner.created_at).format(DATETIME_FORMAT)}
          </Descriptions.Item>
          <Descriptions.Item label="수정일">
            {dayjs(adBanner.updated_at).format(DATETIME_FORMAT)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/content/ad-banners')}>
        목록으로
      </Button>
    </div>
  )
}
