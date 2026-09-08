import test from 'node:test'
import assert from 'node:assert/strict'
import { queryTransaction, sha256, verifyRefundTransaction, verifySignature } from '../supabase/functions/_shared/nicepay-refund.ts'
import { completedRefundAmount, canRequestRefund } from '../src/utils/refundState.ts'
const config = { clientKey: 'test-key', secretKey: 'test-only-secret' }
const payment = { id: 'p', reservation_id: 'r', pg_tid: 'payment-tid', amount: 200000,
  paid_at: '2026-09-01T10:00:00+09:00', payment_method: 'card', pg_provider: 'nicepay', status: 'paid' }
const order = { order_id: 'order-1', pg_tid: payment.pg_tid, amount: payment.amount, reservation_ids: ['r'] }
const cancel = { tid: 'cancel-tid', amount: 60000, cancelledAt: '2026-09-03T10:00:00+09:00' }
async function transaction(overrides = {}) {
  const t = { resultCode: '0000', currency: 'KRW', tid: payment.pg_tid, orderId: order.order_id,
    amount: payment.amount, balanceAmt: 140000, payMethod: 'card', paidAt: payment.paid_at,
    ediDate: '2026-09-08T11:00:00+09:00', status: 'partialCancelled', cancelledAt: cancel.cancelledAt,
    cancels: [cancel], buyerName: 'DO NOT PERSIST', card: { cardNum: 'DO NOT PERSIST' }, ...overrides }
  t.signature = await sha256(`${t.tid}${t.amount}${t.ediDate}${config.secretKey}`)
  return t
}
const verify = async (overrides, p = payment, o = order) => verifyRefundTransaction(await transaction(overrides), p, o, config)
test('30% 부분환불: 원결제·잔액·취소시각 검증, 개인정보 미저장', async () => {
  const e = await verify({})
  assert.equal(e.balanceAmt, 140000)
  assert.equal(e.cancels[0].amount, 60000)
  assert.equal(e.cancels[0].cancelledAt, cancel.cancelledAt)
  assert.equal(JSON.stringify(e).includes('DO NOT PERSIST'), false)
  assert.equal('signature' in e, false)
})
test('전액 취소와 이미 반영된 결제도 조회 가능', async () => {
  const e = await verify({ status: 'cancelled', balanceAmt: 0, cancels: [{ ...cancel, amount: 200000 }] }, { ...payment, status: 'cancelled' })
  assert.equal(e.balanceAmt, 0)
})
test('취소되지 않은 paid 거래는 환불 0원', async () => {
  const e = await verify({ status: 'paid', balanceAmt: 200000, cancelledAt: '0', cancels: null })
  assert.equal(e.cancels.length, 0)
})
test('실제 NICEPAY +0900 시간대와 DB 기록시간 차이는 원문 서명을 유지해 검증', async () => {
  const e = await verify({ ediDate: '2026-09-08T11:00:00.000+0900', paidAt: '2026-09-01T10:00:00.000+0900',
    cancelledAt: '2026-09-03T10:00:00.000+0900', cancels: [{ ...cancel, cancelledAt: '2026-09-03T10:00:00.000+0900' }] },
  { ...payment, paid_at: '2026-09-01T01:00:00.908292+00:00' })
  assert.equal(e.recordedPaidAt, '2026-09-01T01:00:00.908292+00:00')
  assert.equal(e.paidAt, '2026-09-01T10:00:00.000+0900')
})
for (const [label, changes] of [
  ['다른 주문', { orderId: 'another-order' }], ['다른 TID', { tid: 'another-tid' }],
  ['1원 금액 불일치', { amount: 200001 }], ['잔액 불일치', { balanceAmt: 139999 }],
  ['실패 응답', { resultCode: '9999' }], ['문자열 금액', { amount: '200000' }],
  ['중복 취소번호', { cancels: [cancel, cancel], balanceAmt: 80000 }],
  ['음수 환불', { cancels: [{ ...cancel, amount: -60000 }] }],
  ['누락된 취소 상세', { cancels: [] }], ['시간대 없는 날짜', { cancels: [{ ...cancel, cancelledAt: '2026-09-03T10:00:00' }] }],
  ['결제 이전 취소', { cancels: [{ ...cancel, cancelledAt: '2026-08-01T10:00:00+09:00' }] }],
  ['마지막 취소일 불일치', { cancelledAt: '2026-09-04T10:00:00+09:00' }],
  ['paid인데 취소 이력 존재', { status: 'paid' }], ['full인데 잔액 존재', { status: 'cancelled' }],
]) test(`${label}은 복구 거부`, async () => assert.rejects(verify(changes)))
test('변조 서명 거부', async () => {
  const data = await transaction()
  data.signature = '0'.repeat(64)
  await assert.rejects(verifySignature(data, config), /invalid_signature/)
})
test('다중 예약 주문은 임의 배분하지 않고 검토 필요', async () => {
  await assert.rejects(verify({}, payment, { ...order, reservation_ids: ['r', 'r2'] }), /transaction_mismatch/)
})
test('다른 예약에 매핑된 결제 거부', async () => {
  await assert.rejects(verify({}, payment, { ...order, reservation_ids: ['other'] }), /transaction_mismatch/)
})
test('PG 조회는 GET만 실행 (취소·승인 POST 없음)', async () => {
  let calls = 0
  await queryTransaction(payment.pg_tid, config, async (url, options) => {
    calls++
    assert.equal(options.method, 'GET')
    assert.equal(options.redirect, 'error')
    assert.equal(url.origin, 'https://api.nicepay.co.kr')
    assert.equal(url.pathname, `/v1/payments/${payment.pg_tid}`)
    assert.equal('body' in options, false)
    return Response.json(await transaction())
  })
  assert.equal(calls, 1)
})
test('PG 오류·타임아웃은 성공으로 처리하지 않음', async () => {
  await assert.rejects(queryTransaction(payment.pg_tid, config, async () => new Response(null, { status: 500 })))
  await assert.rejects(queryTransaction(payment.pg_tid, config, async () => { throw new Error('timeout') }))
})
test('환불 완료액만 집계, 대기중 환불이 있으면 추가 환불 차단', () => {
  const rows = [{ status: 'completed', refund_amount: 60000 }, { status: 'failed', refund_amount: 20000 }]
  assert.equal(completedRefundAmount(rows), 60000)
  assert.equal(canRequestRefund(payment, rows), true)
  assert.equal(canRequestRefund(payment, undefined), false)
  assert.equal(canRequestRefund(payment, [...rows, { status: 'pending', refund_amount: 1000 }]), false)
  assert.equal(canRequestRefund({ ...payment, status: 'cancelled' }, rows), false)
})
