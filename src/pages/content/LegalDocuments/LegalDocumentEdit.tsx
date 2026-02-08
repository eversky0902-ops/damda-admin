import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Spin, message } from 'antd'

import { getLegalDocument, updateLegalDocument } from '@/services/legalDocumentService'
import { LegalDocumentForm } from '@/components/LegalDocumentForm'

const { Text } = Typography

export function LegalDocumentEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: document, isLoading } = useQuery({
    queryKey: ['legalDocument', id],
    queryFn: () => getLegalDocument(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      updateLegalDocument(id!, {
        title: values.title as string,
        content: values.content as string,
        is_visible: values.is_visible as boolean,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legalDocuments'] })
      queryClient.invalidateQueries({ queryKey: ['legalDocument', id] })
      message.success('문서가 수정되었습니다')
      navigate(`/content/legal-documents/${id}`)
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '수정에 실패했습니다')
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
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>약관/정책 수정</h2>
        <Text type="secondary">기존 문서의 내용을 수정합니다. (v{document.version})</Text>
      </div>

      <LegalDocumentForm
        mode="edit"
        initialValues={document}
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate(`/content/legal-documents/${id}`)}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
