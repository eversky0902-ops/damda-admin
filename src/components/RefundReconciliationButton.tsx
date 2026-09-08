import { Button, Modal, message } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reconcileNicepayRefund } from '@/services/refundReconciliationService'

export function RefundReconciliationButton({ paymentId }: { paymentId: string }) {
  const cache = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => reconcileNicepayRefund(paymentId),
    onSuccess: result => {
      for (const key of ['payment', 'reservation', 'payments', 'reservations', 'refunds', 'paymentStats', 'reservationStats', 'dailyRevenueDetail']) {
        cache.invalidateQueries({ queryKey: [key] })
      }
      message.success(result.insertedCount > 0
        ? `누락된 환불 ${result.insertedCount}건을 반영했습니다. 누적 환불액 ${result.refundAmount.toLocaleString()}원`
        : `PG 확인 완료: 누적 환불액 ${result.refundAmount.toLocaleString()}원, 추가 반영 내역 없음`)
    },
    onError: (error: Error) => message.error(error.message),
  })
  return <Button icon={<SyncOutlined />} loading={mutation.isPending} disabled={mutation.isPending}
    onClick={() => Modal.confirm({ title: 'PG 취소 내역 동기화',
      content: '나이스페이에서 이미 취소된 금액과 완료일을 조회해 담다에 반영합니다. 실제 결제 취소나 추가 환불은 실행하지 않습니다.',
      okText: '조회·동기화', cancelText: '닫기', onOk: () => mutation.mutateAsync(),
    })}>PG 취소내역 동기화</Button>
}
