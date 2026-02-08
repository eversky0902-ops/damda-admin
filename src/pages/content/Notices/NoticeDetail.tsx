import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, message, Popconfirm, Switch } from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, PushpinOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getNotice, deleteNotice, toggleNoticeVisibility, toggleNoticePinned } from '@/services/noticeService'
import { NOTICE_VISIBILITY_LABEL, NOTICE_VISIBILITY_COLOR, DATETIME_FORMAT } from '@/constants'

export function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: notice, isLoading } = useQuery({
    queryKey: ['notice', id],
    queryFn: () => getNotice(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      message.success('공지사항이 삭제되었습니다')
      navigate('/content/notices')
    },
    onError: () => {
      message.error('삭제에 실패했습니다')
    },
  })

  const visibilityMutation = useMutation({
    mutationFn: (isVisible: boolean) => toggleNoticeVisibility(id!, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notice', id] })
      message.success('공개 상태가 변경되었습니다')
    },
  })

  const pinnedMutation = useMutation({
    mutationFn: (isPinned: boolean) => toggleNoticePinned(id!, isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notice', id] })
      message.success('고정 상태가 변경되었습니다')
    },
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!notice) {
    return <div>공지사항을 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {notice.is_pinned && <PushpinOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
        <h2 style={{ margin: 0 }}>{notice.title}</h2>
        <Tag color={NOTICE_VISIBILITY_COLOR[notice.is_visible ? 'visible' : 'hidden']}>
          {NOTICE_VISIBILITY_LABEL[notice.is_visible ? 'visible' : 'hidden']}
        </Tag>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/content/notices/${id}/edit`)}
        >
          수정
        </Button>
        <Popconfirm
          title="공지사항 삭제"
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

      <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="작성자">{notice.admin?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="조회수">{notice.view_count.toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="등록일">{dayjs(notice.created_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="수정일">{dayjs(notice.updated_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="고정">
          <Switch
            checked={notice.is_pinned}
            onChange={(checked) => pinnedMutation.mutate(checked)}
            checkedChildren={<PushpinOutlined />}
          />
        </Descriptions.Item>
        <Descriptions.Item label="공개">
          <Switch
            checked={notice.is_visible}
            onChange={(checked) => visibilityMutation.mutate(checked)}
          />
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 8 }}>내용</h4>
        <div
          style={{
            padding: 16,
            background: '#fafafa',
            borderRadius: 6,
            minHeight: 200,
          }}
          className="notice-content-view"
          dangerouslySetInnerHTML={{ __html: notice.content }}
        />
        <style>{`
          .notice-content-view img {
            max-width: 100%;
            height: auto;
          }
          .notice-content-view p {
            margin: 0;
            min-height: 1.4em;
          }
        `}</style>
      </div>

      <Divider />
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/content/notices')}>
        목록으로
      </Button>
    </div>
  )
}
