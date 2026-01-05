import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Descriptions,
  Button,
  Tag,
  Switch,
  Space,
  Image,
  Card,
  Rate,
  Spin,
  Divider,
  Modal,
  message,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  StarFilled,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

import {
  getReview,
  updateReviewVisibility,
  updateReviewFeatured,
  deleteReview,
} from '@/services/reviewService'
import {
  DATETIME_FORMAT,
  REVIEW_VISIBILITY_LABEL,
  REVIEW_VISIBILITY_COLOR,
} from '@/constants'

const { Text } = Typography

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 리뷰 상세 조회
  const { data: review, isLoading } = useQuery({
    queryKey: ['review', id],
    queryFn: () => getReview(id!),
    enabled: !!id,
  })

  // 공개/비공개 토글
  const visibilityMutation = useMutation({
    mutationFn: (isVisible: boolean) => updateReviewVisibility(id!, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', id] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      message.success('공개 상태가 변경되었습니다')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  // 베스트 리뷰 토글
  const featuredMutation = useMutation({
    mutationFn: (isFeatured: boolean) => updateReviewFeatured(id!, isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', id] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      message.success('베스트 리뷰 상태가 변경되었습니다')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  // 리뷰 삭제
  const deleteMutation = useMutation({
    mutationFn: () => deleteReview(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      message.success('리뷰가 삭제되었습니다')
      navigate('/reviews')
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const handleDelete = () => {
    Modal.confirm({
      title: '리뷰 삭제',
      icon: <ExclamationCircleOutlined />,
      content: '이 리뷰를 삭제하시겠습니까? 삭제된 리뷰는 복구할 수 없습니다.',
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: () => deleteMutation.mutate(),
    })
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!review) {
    return <div>리뷰를 찾을 수 없습니다</div>
  }

  const visibilityStatus = review.is_visible ? 'visible' : 'hidden'

  return (
    <div>
      {/* 헤더 영역 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0 }}>리뷰 상세</h2>
          {review.is_featured && (
            <Tag icon={<StarFilled />} color="gold">
              베스트 리뷰
            </Tag>
          )}
        </div>
        <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
          삭제
        </Button>
      </div>

      {/* 상품 정보 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Image
            src={review.product?.thumbnail}
            width={80}
            height={80}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            preview={false}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwYAAuUB8gKWjPEAAAAASUVORK5CYII="
          />
          <div>
            <Text strong style={{ fontSize: 16 }}>
              {review.product?.name || '-'}
            </Text>
            <div style={{ color: '#666', marginTop: 4 }}>
              {review.product?.business_owner?.name || '-'}
            </div>
            <div style={{ color: '#1677ff', marginTop: 4 }}>
              {review.product?.sale_price?.toLocaleString()}원
            </div>
          </div>
        </div>
      </Card>

      {/* 리뷰 내용 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Rate disabled value={review.rating} style={{ fontSize: 18 }} />
            <span style={{ color: '#faad14', fontSize: 16 }}>{review.rating}점</span>
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, marginBottom: 16 }}>
          {review.content}
        </div>

        {/* 리뷰 이미지 */}
        {review.images && review.images.length > 0 && (
          <div>
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">첨부 이미지 ({review.images.length})</Text>
            </div>
            <Image.PreviewGroup>
              <Space wrap>
                {review.images
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((img) => (
                    <Image
                      key={img.id}
                      src={img.image_url}
                      width={120}
                      height={120}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                  ))}
              </Space>
            </Image.PreviewGroup>
          </div>
        )}
      </Card>

      {/* 상세 정보 */}
      <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="작성자 (어린이집)">
          {review.daycare?.name || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="담당자">{review.daycare?.contact_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="연락처">{review.daycare?.contact_phone || '-'}</Descriptions.Item>
        <Descriptions.Item label="이메일">{review.daycare?.email || '-'}</Descriptions.Item>
        <Descriptions.Item label="공개 상태">
          <Space>
            <Tag color={REVIEW_VISIBILITY_COLOR[visibilityStatus]}>
              {REVIEW_VISIBILITY_LABEL[visibilityStatus]}
            </Tag>
            <Switch
              checked={review.is_visible}
              onChange={(checked) => visibilityMutation.mutate(checked)}
              loading={visibilityMutation.isPending}
              checkedChildren="공개"
              unCheckedChildren="비공개"
            />
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="베스트 리뷰">
          <Space>
            {review.is_featured ? (
              <Tag icon={<StarFilled />} color="gold">
                베스트
              </Tag>
            ) : (
              <Tag>일반</Tag>
            )}
            <Switch
              checked={review.is_featured}
              onChange={(checked) => featuredMutation.mutate(checked)}
              loading={featuredMutation.isPending}
              checkedChildren="베스트"
              unCheckedChildren="일반"
            />
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="작성일">
          {dayjs(review.created_at).format(DATETIME_FORMAT)}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {dayjs(review.updated_at).format(DATETIME_FORMAT)}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reviews')}>
        목록으로
      </Button>
    </div>
  )
}
