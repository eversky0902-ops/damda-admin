import test from 'node:test'
import assert from 'node:assert/strict'
import { forwardRefundWebhook } from '../../damda-user/src/lib/payments/refund-webhook.ts'
const body = { status: 'cancelled', tid: 'test-tid', signature: 'test-signature' }
const base = 'https://test-project.supabase.co'
test('취소 알림만 동기화 서버에 전달, PG 취소 요청 없음', async () => {
  let count = 0
  const response = await forwardRefundWebhook(body, async (url, request) => {
    count++
    assert.equal(url, `${base}/functions/v1/nicepay-refund-webhook`)
    assert.equal(request.method, 'POST')
    assert.deepEqual(JSON.parse(request.body), body)
    return new Response('OK')
  }, base)
  assert.equal(count, 1); assert.equal(response.status, 200); assert.equal(await response.text(), 'OK')
})
test('자동 반영 실패·모호한 성공은 재시도 가능한 실패로 응답', async () => {
  for (const upstream of [new Response('OK', { status: 500 }), new Response('pending'), new Response('')]) {
    assert.equal((await forwardRefundWebhook(body, async () => upstream, base)).status, 503)
  }
  assert.equal((await forwardRefundWebhook(body, async () => { throw new Error('timeout') }, base)).status, 503)
})
test('결제완료 알림은 환불 처리기로 보내지 않음', async () => {
  const response = await forwardRefundWebhook({ status: 'paid' }, async () => { throw new Error('must not call') }, base)
  assert.equal(response.status, 400)
})
