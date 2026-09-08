import { supabase } from '@/lib/supabase'

export interface RefundReconciliationResult {
  success: true
  insertedCount: number
  refundAmount: number
  balanceAmount: number
  gatewayStatus: 'paid' | 'cancelled' | 'partialCancelled'
}

// This endpoint only GETs NICEPAY and reconciles existing cancellations.
export async function reconcileNicepayRefund(paymentId: string): Promise<RefundReconciliationResult> {
  const { data, error } = await supabase.functions.invoke('reconcile-nicepay-refund', { body: { paymentId } })
  if (error || data?.success !== true) {
    throw new Error('PG 취소 내역을 확인하지 못했습니다. 인증·서버 설정 또는 거래 불일치 확인이 필요합니다. 다시 환불하지 마세요.')
  }
  return data as RefundReconciliationResult
}

export async function verifyBeforeRefund(paymentId: string, refundAmount: number) {
  if (!Number.isSafeInteger(refundAmount) || refundAmount <= 0) throw new Error('환불금액을 올바르게 입력해주세요.')
  const result = await reconcileNicepayRefund(paymentId)
  if (result.insertedCount > 0 || result.gatewayStatus === 'cancelled') {
    throw new Error('PG에서 이미 취소된 내역을 반영했습니다. 갱신된 환불 내역을 확인해주세요. 새 환불은 실행하지 않았습니다.')
  }
  if (refundAmount > result.balanceAmount) throw new Error('환불금액이 PG의 실제 취소 가능 잔액을 초과합니다.')
}
