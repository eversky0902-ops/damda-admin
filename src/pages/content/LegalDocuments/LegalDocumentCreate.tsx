import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, message } from 'antd'

import { createLegalDocument } from '@/services/legalDocumentService'
import { LegalDocumentForm } from '@/components/LegalDocumentForm'
import { useAuthStore } from '@/stores/authStore'
import type { LegalDocumentCategory } from '@/types'

const { Text } = Typography

export function LegalDocumentCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { admin } = useAuthStore()

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      createLegalDocument(
        {
          category: values.category as LegalDocumentCategory,
          title: values.title as string,
          content: values.content as string,
          is_visible: values.is_visible as boolean,
        },
        admin!.id
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legalDocuments'] })
      message.success('문서가 등록되었습니다')
      navigate('/content/legal-documents')
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '등록에 실패했습니다')
    },
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>약관/정책 등록</h2>
        <Text type="secondary">새로운 약관 또는 정책 문서를 작성합니다. 같은 카테고리에 새 버전이 자동으로 부여됩니다.</Text>
      </div>

      <LegalDocumentForm
        mode="create"
        onSubmit={(values) => mutation.mutate(values)}
        onCancel={() => navigate('/content/legal-documents')}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
