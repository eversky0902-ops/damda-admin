import type { PartnerContractStatus, PartnerOnboardingStatus } from '@/services/partnerOnboardingService'

export const ONBOARDING_STATUS: Record<PartnerOnboardingStatus, { label: string; color: string }> = {
  draft: { label: '임시저장', color: 'default' },
  submitted: { label: '접수 완료', color: 'blue' },
  contract_pending: { label: '계약 발송 대기', color: 'gold' },
  contract_in_progress: { label: '서명 진행 중', color: 'processing' },
  under_review: { label: '관리자 검수', color: 'cyan' },
  revision_requested: { label: '수정 요청', color: 'orange' },
  ready_for_approval: { label: '승인 대기', color: 'purple' },
  approving: { label: '승인 처리 중', color: 'processing' },
  approved: { label: '입점 완료', color: 'green' },
  rejected: { label: '반려', color: 'red' },
  failed: { label: '처리 실패', color: 'red' },
}

export const CONTRACT_STATUS: Record<PartnerContractStatus, { label: string; color: string }> = {
  not_sent: { label: '미발송', color: 'default' },
  send_requested: { label: '발송 요청', color: 'gold' },
  sent: { label: '발송 완료', color: 'blue' },
  viewed: { label: '열람', color: 'cyan' },
  signed: { label: '서명', color: 'purple' },
  completed: { label: '계약 완료', color: 'green' },
  declined: { label: '서명 거절', color: 'red' },
  expired: { label: '기간 만료', color: 'orange' },
  failed: { label: '발송 실패', color: 'red' },
}
