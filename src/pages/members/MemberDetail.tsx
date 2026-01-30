import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tabs,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  Modal,
  Input,
  message,
  Divider,
  List,
  Avatar,
  Popconfirm,
  Image,
  Select,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  HomeOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import {
  getDaycare,
  updateDaycareStatus,
  getDaycareMemos,
  addDaycareMemo,
  deleteDaycareMemo,
} from '@/services/daycareService'
import { formatDateTime, formatPhoneNumber, formatBusinessNumber } from '@/utils/format'
import { DAYCARE_STATUS_LABEL, DAYCARE_STATUS_COLOR } from '@/constants'
import { useAuthStore } from '@/stores/authStore'
import type { DaycareStatus } from '@/types'

const { TextArea } = Input

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { admin } = useAuthStore()

  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<DaycareStatus | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [revisionReason, setRevisionReason] = useState('')
  const [memoContent, setMemoContent] = useState('')

  // 어린이집 상세 조회
  const { data: daycare, isLoading } = useQuery({
    queryKey: ['daycare', id],
    queryFn: () => getDaycare(id!),
    enabled: !!id,
  })

  // 메모 목록 조회
  const { data: memos = [] } = useQuery({
    queryKey: ['daycare-memos', id],
    queryFn: () => getDaycareMemos(id!),
    enabled: !!id,
  })

  // 상태 변경 mutation
  const statusMutation = useMutation({
    mutationFn: ({ status, rejectionReason, revisionReason }: { status: DaycareStatus; rejectionReason?: string; revisionReason?: string }) =>
      updateDaycareStatus(id!, status, { rejectionReason, revisionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daycare', id] })
      queryClient.invalidateQueries({ queryKey: ['daycares'] })
      message.success('상태가 변경되었습니다')
    },
    onError: () => {
      message.error('상태 변경에 실패했습니다')
    },
  })

  // 메모 추가 mutation
  const addMemoMutation = useMutation({
    mutationFn: (content: string) => addDaycareMemo(id!, admin!.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daycare-memos', id] })
      setMemoContent('')
      message.success('메모가 추가되었습니다')
    },
    onError: () => {
      message.error('메모 추가에 실패했습니다')
    },
  })

  // 메모 삭제 mutation
  const deleteMemoMutation = useMutation({
    mutationFn: deleteDaycareMemo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daycare-memos', id] })
      message.success('메모가 삭제되었습니다')
    },
    onError: () => {
      message.error('메모 삭제에 실패했습니다')
    },
  })

  const handleOpenStatusModal = () => {
    setSelectedStatus(daycare?.status as DaycareStatus || null)
    setRejectReason('')
    setRevisionReason('')
    setStatusModalOpen(true)
  }

  const handleStatusSubmit = () => {
    if (!selectedStatus) return

    if (selectedStatus === 'rejected' && !rejectReason.trim()) {
      message.warning('거절 사유를 입력해주세요')
      return
    }

    if (selectedStatus === 'revision_required' && !revisionReason.trim()) {
      message.warning('보완 사유를 입력해주세요')
      return
    }

    statusMutation.mutate(
      {
        status: selectedStatus,
        rejectionReason: selectedStatus === 'rejected' ? rejectReason : undefined,
        revisionReason: selectedStatus === 'revision_required' ? revisionReason : undefined,
      },
      {
        onSuccess: () => {
          setStatusModalOpen(false)
          setSelectedStatus(null)
          setRejectReason('')
          setRevisionReason('')
        }
      }
    )
  }

  const handleAddMemo = () => {
    if (!memoContent.trim()) {
      message.warning('메모 내용을 입력해주세요')
      return
    }
    addMemoMutation.mutate(memoContent)
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!daycare) {
    return <div>회원 정보를 찾을 수 없습니다</div>
  }

  const tabItems = [
    {
      key: 'info',
      label: '기본 정보',
      children: (
        <>
          <div style={{ marginBottom: 12, textAlign: 'right' }}>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/members/${id}/edit`)}>
              수정
            </Button>
          </div>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="어린이집명">{daycare.name}</Descriptions.Item>
            <Descriptions.Item label="상태">
              <Space>
                <Tag color={DAYCARE_STATUS_COLOR[daycare.status]}>
                  {DAYCARE_STATUS_LABEL[daycare.status]}
                </Tag>
                <Button size="small" onClick={handleOpenStatusModal}>
                  변경
                </Button>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="이메일">{daycare.email}</Descriptions.Item>
            <Descriptions.Item label="사업자등록번호">
              {formatBusinessNumber(daycare.business_number)}
            </Descriptions.Item>
            <Descriptions.Item label="대표자">{daycare.representative || '-'}</Descriptions.Item>
            <Descriptions.Item label="담당자">{daycare.contact_name}</Descriptions.Item>
            <Descriptions.Item label="담당자 연락처">
              {formatPhoneNumber(daycare.contact_phone)}
            </Descriptions.Item>
            <Descriptions.Item label="전화번호">{daycare.tel || '-'}</Descriptions.Item>
            <Descriptions.Item label="인가번호">{daycare.license_number}</Descriptions.Item>
            <Descriptions.Item label="정원">
              {daycare.capacity ? `${daycare.capacity}명` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="주소" span={2}>
              {daycare.address}
              {daycare.address_detail && ` ${daycare.address_detail}`}
              {daycare.zipcode && ` (${daycare.zipcode})`}
            </Descriptions.Item>
            <Descriptions.Item label="가입일">{formatDateTime(daycare.created_at)}</Descriptions.Item>
            <Descriptions.Item label="승인일">
              {daycare.approved_at ? formatDateTime(daycare.approved_at) : '-'}
            </Descriptions.Item>
          </Descriptions>

          {daycare.status === 'rejected' && daycare.rejection_reason && (
            <div style={{ marginTop: 12, padding: 12, background: '#fff2f0', borderRadius: 4 }}>
              <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
                거절 사유: {daycare.rejection_reason}
              </span>
            </div>
          )}

          {daycare.status === 'revision_required' && daycare.revision_reason && (
            <div style={{ marginTop: 12, padding: 12, background: '#fffbe6', borderRadius: 4 }}>
              <div style={{ color: '#faad14', fontWeight: 500, marginBottom: 8 }}>
                보완 요청 사유: {daycare.revision_reason}
              </div>
              {daycare.revision_requested_at && (
                <div style={{ fontSize: 12, color: '#999' }}>
                  요청일시: {formatDateTime(daycare.revision_requested_at)}
                </div>
              )}
            </div>
          )}

          {daycare.revision_submitted_at && (
            <div style={{ marginTop: 12, padding: 12, background: '#f6ffed', borderRadius: 4 }}>
              <div style={{ color: '#52c41a', fontWeight: 500, marginBottom: 8 }}>
                보완 제출 완료
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                제출일시: {formatDateTime(daycare.revision_submitted_at)}
              </div>
              {daycare.revision_response && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>사용자 응답:</div>
                  <div style={{ background: '#fff', padding: 8, borderRadius: 4 }}>
                    {daycare.revision_response}
                  </div>
                </div>
              )}
              {daycare.revision_file && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>첨부파일:</div>
                  <a href={daycare.revision_file} target="_blank" rel="noopener noreferrer">
                    파일 보기
                  </a>
                </div>
              )}
            </div>
          )}

          <h4 style={{ marginTop: 24, marginBottom: 12 }}>인가증 파일</h4>
          {daycare.license_file ? (
            <Image
              src={daycare.license_file}
              alt="인가증"
              style={{ maxWidth: 400, maxHeight: 300 }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgesqAsqVAAAAPklEQVR4nO3BMQEAAADCoPVP7WULoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABeDVYABQC9SnAAAAASUVORK5CYII="
            />
          ) : (
            <span style={{ color: '#999' }}>파일 없음</span>
          )}
        </>
      ),
    },
    {
      key: 'memos',
      label: '관리자 메모',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <TextArea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="메모를 입력하세요"
              rows={3}
              style={{ marginBottom: 8 }}
            />
            <Button
              type="primary"
              onClick={handleAddMemo}
              loading={addMemoMutation.isPending}
            >
              메모 추가
            </Button>
          </div>

          <List
            dataSource={memos}
            locale={{ emptyText: '등록된 메모가 없습니다' }}
            renderItem={(memo) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="delete"
                    title="메모를 삭제하시겠습니까?"
                    onConfirm={() => deleteMemoMutation.mutate(memo.id)}
                    okText="삭제"
                    cancelText="취소"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} size="small" />}
                  title={
                    <Space>
                      <span style={{ fontWeight: 500 }}>{memo.admin?.name || '관리자'}</span>
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {formatDateTime(memo.created_at)}
                      </span>
                    </Space>
                  }
                  description={memo.content}
                />
              </List.Item>
            )}
          />
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Avatar
          icon={<HomeOutlined />}
          size={48}
          style={{ backgroundColor: '#f0f0f0', color: '#999' }}
        />
        <h2 style={{ margin: 0 }}>{daycare.name}</h2>
      </div>

      <Tabs items={tabItems} />

      <Divider />

      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/members')}>
        목록으로
      </Button>

      {/* 상태 변경 모달 */}
      <Modal
        title="상태 변경"
        open={statusModalOpen}
        onOk={handleStatusSubmit}
        onCancel={() => {
          setStatusModalOpen(false)
          setSelectedStatus(null)
          setRejectReason('')
          setRevisionReason('')
        }}
        okText="변경"
        cancelText="취소"
        confirmLoading={statusMutation.isPending}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>변경할 상태</div>
          <Select
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: '100%' }}
            options={[
              { value: 'pending', label: '가입대기' },
              { value: 'requested', label: '승인요청' },
              { value: 'approved', label: '승인완료' },
              { value: 'rejected', label: '승인거절' },
              { value: 'revision_required', label: '보완필요' },
            ]}
          />
        </div>
        {selectedStatus === 'rejected' && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>거절 사유</div>
            <TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="거절 사유를 입력해주세요"
              rows={4}
            />
          </div>
        )}
        {selectedStatus === 'revision_required' && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>보완 사유</div>
            <TextArea
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="보완이 필요한 사유를 입력해주세요"
              rows={4}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
