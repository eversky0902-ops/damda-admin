type RefundRow = { status: string; refund_amount: number }
export function completedRefundAmount(refunds: RefundRow[] = []) {
  return refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.refund_amount, 0)
}
export function canRequestRefund(payment: { status: string; amount: number } | null | undefined, refunds: RefundRow[] | undefined) {
  // A cancelled reservation can still have a paid/unrefunded transaction.
  // Never enable money actions while refund history is loading or a refund is in flight.
  return !!payment && refunds !== undefined && payment.status === 'paid'
    && !refunds.some(r => r.status === 'pending') && completedRefundAmount(refunds) < payment.amount
}
