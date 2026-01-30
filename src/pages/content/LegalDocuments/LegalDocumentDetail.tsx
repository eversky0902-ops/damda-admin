import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Descriptions, Button, Tag, Spin, Divider, message, Popconfirm, Switch } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { getLegalDocument, deleteLegalDocument, toggleLegalDocumentVisibility } from '@/services/legalDocumentService'
import {
  LEGAL_DOCUMENT_CATEGORY_LABEL,
  LEGAL_DOCUMENT_CATEGORY_COLOR,
  LEGAL_DOCUMENT_VISIBILITY_LABEL,
  LEGAL_DOCUMENT_VISIBILITY_COLOR,
  DATETIME_FORMAT,
} from '@/constants'
import type { LegalDocumentCategory } from '@/types'

export function LegalDocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: document, isLoading } = useQuery({
    queryKey: ['legalDocument', id],
    queryFn: () => getLegalDocument(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLegalDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legalDocuments'] })
      message.success('문서가 삭제되었습니다')
      navigate('/content/legal-documents')
    },
    onError: () => {
      message.error('삭제에 실패했습니다')
    },
  })

  const visibilityMutation = useMutation({
    mutationFn: (isVisible: boolean) => toggleLegalDocumentVisibility(id!, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legalDocument', id] })
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

  if (!document) {
    return <div>문서를 찾을 수 없습니다</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Tag color={LEGAL_DOCUMENT_CATEGORY_COLOR[document.category]}>
          {LEGAL_DOCUMENT_CATEGORY_LABEL[document.category as LegalDocumentCategory]}
        </Tag>
        <h2 style={{ margin: 0 }}>{document.title}</h2>
        <Tag color={LEGAL_DOCUMENT_VISIBILITY_COLOR[document.is_visible ? 'visible' : 'hidden']}>
          {LEGAL_DOCUMENT_VISIBILITY_LABEL[document.is_visible ? 'visible' : 'hidden']}
        </Tag>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Popconfirm
          title="문서 삭제"
          description="정말 삭제하시겠습니까? 삭제된 문서는 복구할 수 없습니다."
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
        <Descriptions.Item label="카테고리">
          <Tag color={LEGAL_DOCUMENT_CATEGORY_COLOR[document.category]}>
            {LEGAL_DOCUMENT_CATEGORY_LABEL[document.category as LegalDocumentCategory]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="버전">v{document.version}</Descriptions.Item>
        <Descriptions.Item label="작성자">{document.admin?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="공개">
          <Switch
            checked={document.is_visible}
            onChange={(checked) => visibilityMutation.mutate(checked)}
          />
        </Descriptions.Item>
        <Descriptions.Item label="등록일">{dayjs(document.created_at).format(DATETIME_FORMAT)}</Descriptions.Item>
        <Descriptions.Item label="수정일">{dayjs(document.updated_at).format(DATETIME_FORMAT)}</Descriptions.Item>
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
          dangerouslySetInnerHTML={{ __html: document.content }}
        />
      </div>

      <Divider />
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/content/legal-documents')}>
        목록으로
      </Button>
    </div>
  )
}
