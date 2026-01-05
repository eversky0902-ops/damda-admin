import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, message, Popconfirm, Switch, Image } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getPopup, deletePopup, togglePopupVisibility } from '@/services/popupService'
import { POPUP_POSITION_LABEL, DATETIME_FORMAT } from '@/constants'

// 팝업 활성 상태 계산
function getPopupStatus(popup: { is_visible: boolean; start_date: string; end_date: string }): 'active' | 'scheduled' | 'expired' | 'hidden' {
  if (!popup.is_visible) return 'hidden'
  const now = new Date()
  const start = new Date(popup.start_date)
  const end = new Date(popup.end_date)
  if (now < start) return 'scheduled'
  if (now > end) return 'expired'
  return 'active'
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: '진행중' },
  scheduled: { color: 'blue', label: '예정' },
  expired: { color: 'default', label: '종료' },
  hidden: { color: 'default', label: '비공개' },
}

export function PopupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: popup, isLoading } = useQuery({
    queryKey: ['popup', id],
    queryFn: () => getPopup(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePopup,
    onSuccess: () => {
      message.success('팝업이 삭제되었습니다')
      navigate('/content/popups')
    },
    onError: () => {
      message.error('삭제에 실패했습니다')
    },
  })

  const visibilityMutation = useMutation({
    mutationFn: (isVisible: boolean) => togglePopupVisibility(id!, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popup', id] })
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

  if (!popup) {
    return <div>팝업을 찾을 수 없습니다</div>
  }

  const status = getPopupStatus(popup)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{popup.title}</h2>
        <Tag color={STATUS_CONFIG[status].color}>
          {STATUS_CONFIG[status].label}
        </Tag>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/content/popups/${id}/edit`)}
        >
          수정
        </Button>
        <Popconfirm
          title="팝업 삭제"
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

      {popup.image_url && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 8 }}>팝업 이미지</h4>
          <Image
            src={popup.image_url}
            alt="팝업"
            style={{ maxWidth: 400, maxHeight: 300, objectFit: 'contain', borderRadius: 8 }}
          />
        </div>
      )}

      <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="위치">{POPUP_POSITION_LABEL[popup.position]}</Descriptions.Item>
        <Descriptions.Item label="크기">{popup.width || 400} x {popup.height || 300}</Descriptions.Item>
        <Descriptions.Item label="게시 시작일">{dayjs(popup.start_date).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="게시 종료일">{dayjs(popup.end_date).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="링크 URL" span={2}>
          {popup.link_url ? (
            <a href={popup.link_url} target="_blank" rel="noopener noreferrer">
              <LinkOutlined /> {popup.link_url}
            </a>
          ) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="등록일">{dayjs(popup.created_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="수정일">{dayjs(popup.updated_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="공개">
          <Switch
            checked={popup.is_visible}
            onChange={(checked) => visibilityMutation.mutate(checked)}
          />
        </Descriptions.Item>
      </Descriptions>

      {popup.content && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 8 }}>팝업 내용</h4>
          <div
            style={{
              padding: 16,
              background: '#fafafa',
              borderRadius: 6,
              whiteSpace: 'pre-wrap',
              minHeight: 100,
            }}
          >
            {popup.content}
          </div>
        </div>
      )}

      <Divider />
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/content/popups')}>
        목록으로
      </Button>
    </div>
  )
}
