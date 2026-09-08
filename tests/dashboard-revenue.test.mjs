import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateDashboardRevenue, fetchRevenuePages, revenueDateBounds } from '../src/utils/dashboardRevenue.ts'

const payment = (overrides = {}) => ({
  id: 'payment-1', amount: 200000, paid_at: '2026-09-01T10:00:00+09:00', status: 'paid', ...overrides,
})
const refund = (amount, overrides = {}) => ({
  id: 'refund-1', payment_id: 'payment-1', refund_amount: amount,
  refunded_at: '2026-09-03T10:00:00+09:00', status: 'completed', ...overrides,
})
const total = days => days.reduce((sum, day) => ({
  revenue: sum.revenue + day.revenue, refund: sum.refund + day.refundAmount,
  platform: sum.platform + day.netRevenue, settlement: sum.settlement + day.settlementAmount,
}), { revenue: 0, refund: 0, platform: 0, settlement: 0 })
const calculate = (payments, refunds) => calculateDashboardRevenue('2026-09-01', '2026-09-30', payments, refunds)

for (const [label, amount, expectedSettlement] of [
  ['정상 거래 / 환불 불가', 0, 176000],
  ['10일 전 전액 환불', 200000, -24000],
  ['9~7일 전 70% 환불', 140000, 36000],
  ['6~5일 전 50% 환불', 100000, 76000],
  ['4~3일 전 30% 환불: 사용자 예시', 60000, 116000],
]) {
  test(label, () => {
    const result = total(calculate([payment()], amount ? [refund(amount)] : []))
    assert.deepEqual(result, { revenue: 200000, refund: amount, platform: 24000, settlement: expectedSettlement })
    assert.equal(result.revenue, result.refund + result.platform + result.settlement)
  })
}

test('다른 날 발생한 환불도 정산 합계에서 차감하며 수수료는 고정', () => {
  const days = calculate([payment({ status: 'cancelled' })], [refund(60000)])
  assert.equal(days[2].settlementAmount, -60000)
  assert.equal(days[2].netRevenue, 0)
  assert.equal(total(days).settlement, 116000)
})

test('지난달 결제의 이번달 환불은 원거래액·수수료를 중복 계상하지 않음', () => {
  const p = payment({ paid_at: '2026-08-30T10:00:00+09:00' })
  const refunds = [refund(10000, { id: 'prior', refunded_at: '2026-08-31T10:00:00+09:00' }), refund(50000)]
  assert.deepEqual(total(calculate([p], refunds)), { revenue: 0, refund: 50000, platform: 0, settlement: -50000 })
  const august = calculateDashboardRevenue('2026-08-01', '2026-08-31', [p], refunds)
  const both = calculateDashboardRevenue('2026-08-01', '2026-09-30', [p], refunds)
  assert.equal(total(august).settlement + total(calculate([p], refunds)).settlement, total(both).settlement)
})

test('순차 부분환불 후 전액환불도 고정 수수료와 음수 정산을 유지', () => {
  const result = total(calculate([payment({ amount: 13 })], [
    refund(5), refund(8, { id: 'refund-2', refunded_at: '2026-09-04T10:00:00+09:00' }),
  ]))
  assert.deepEqual(result, { revenue: 13, refund: 13, platform: 2, settlement: -2 })
})

test('원 단위 반올림은 거래별로 적용하고 정산 잔액과 1원도 어긋나지 않음', () => {
  assert.deepEqual(total(calculate([payment({ amount: 13 }), payment({ id: 'payment-2', amount: 13 })], [])),
    { revenue: 26, refund: 0, platform: 4, settlement: 22 })
})

test('환불 대기·실패 및 미결제 예약 제외', () => {
  const result = total(calculate([
    payment(), payment({ id: 'pending', status: 'pending', paid_at: null }),
    payment({ id: 'failed', status: 'failed' }),
  ], [refund(60000, { status: 'pending' }), refund(60000, { id: 'failed-refund', status: 'failed' })]))
  assert.deepEqual(result, { revenue: 200000, refund: 0, platform: 24000, settlement: 176000 })
})

test('한국 날짜 기준 자정과 마지막 날 소수점 초를 포함', () => {
  assert.deepEqual(revenueDateBounds('2026-09-01', '2026-09-30'), {
    start: '2026-08-31T15:00:00.000Z', endExclusive: '2026-09-30T15:00:00.000Z',
  })
  const days = calculate([
    payment({ paid_at: '2026-08-31T15:00:00Z' }),
    payment({ id: 'last', paid_at: '2026-09-30T14:59:59.999Z' }),
    payment({ id: 'next', paid_at: '2026-09-30T15:00:00Z' }),
  ], [])
  assert.equal(days.length, 30)
  assert.equal(days[0].revenue, 200000)
  assert.equal(days[29].revenue, 200000)
  assert.equal(total(days).revenue, 400000)
})

test('잘못된 금액·초과환불·연결 누락을 0원 성공으로 처리하지 않음', () => {
  assert.throws(() => calculate([payment({ amount: NaN })], []))
  assert.throws(() => calculate([payment({ amount: -1 })], []))
  assert.throws(() => calculate([payment()], [refund(200001)]))
  assert.throws(() => calculate([payment()], [refund(100000), refund(100001, { id: 'second' })]))
  assert.throws(() => calculate([], [refund(10)]))
  assert.throws(() => calculate([payment()], [refund(10, { refunded_at: null })]))
  assert.throws(() => calculate([payment(), payment()], []))
})

test('빈 기간은 0원, 잘못된 조회 기간은 오류', () => {
  assert.deepEqual(total(calculate([], [])), { revenue: 0, refund: 0, platform: 0, settlement: 0 })
  assert.throws(() => revenueDateBounds('2026-09-31', '2026-10-01'))
  assert.throws(() => revenueDateBounds('2026-09-30', '2026-09-01'))
})

test('1,000건 초과 및 서버 응답 개수 제한에도 전체 금액 집계', async () => {
  const payments = Array.from({ length: 1005 }, (_, index) => payment({ id: `p-${index}`, amount: 1000 }))
  const fetched = await fetchRevenuePages(async (from, to) => ({
    data: payments.slice(from, Math.min(to + 1, from + 80)), error: null,
  }))
  assert.equal(fetched.length, 1005)
  assert.deepEqual(total(calculate(fetched, [])), { revenue: 1005000, refund: 0, platform: 120600, settlement: 884400 })
})

test('뒤 페이지 API 실패 시 불완전한 합계를 반환하지 않음', async () => {
  await assert.rejects(fetchRevenuePages(async from => from === 0
    ? { data: [payment()], error: null }
    : { data: null, error: { message: 'API 조회 실패' } }), /API 조회 실패/)
})
