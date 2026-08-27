import { useState } from 'react'
import { Typography, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PartnerOnboardingBaseForm, type OnboardingDocumentFiles } from '@/components/PartnerOnboardingBaseForm'
import { createPartnerOnboarding, uploadPartnerDocument, type PartnerOnboardingInput } from '@/services/partnerOnboardingService'
import './partner-onboarding.css'

export function PartnerOnboardingCreatePage({ basePath = '/partner-onboardings' }: { basePath?: string } = {}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [documentFiles, setDocumentFiles] = useState<OnboardingDocumentFiles>({})
  const mutation = useMutation({
    mutationFn: async (values: PartnerOnboardingInput) => {
      const onboarding = await createPartnerOnboarding(values)
      await uploadPartnerDocument(onboarding.id, 'business_registration', documentFiles.business_registration!)
      await uploadPartnerDocument(onboarding.id, 'bank_account', documentFiles.bank_account!)
      return onboarding
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partner-onboardings'] })
      message.success('입점 신청서와 필수서류가 등록되었습니다. 상품을 등록해주세요.')
      navigate(`${basePath}/${data.id}`)
    },
    onError: (error: Error) => message.error(error.message),
  })

  return (
    <div className="partner-page">
      <div className="partner-page-header">
        <div>
          <Typography.Title level={2}>제휴 입점 신청</Typography.Title>
          <Typography.Text type="secondary">기본정보를 저장한 후 서류, 상품, 계약 정보를 이어서 등록합니다.</Typography.Text>
        </div>
      </div>
      <PartnerOnboardingBaseForm
        submitting={mutation.isPending}
        documentFiles={documentFiles}
        requireDocuments
        onDocumentsChange={setDocumentFiles}
        onSubmit={(values: PartnerOnboardingInput) => {
          if (!documentFiles.business_registration || !documentFiles.bank_account) {
            message.warning('사업자등록증과 통장사본을 모두 첨부해주세요.')
            return
          }
          mutation.mutate(values)
        }}
        onCancel={() => navigate(basePath)}
      />
    </div>
  )
}
