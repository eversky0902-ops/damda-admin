// Dashboard figures are an estimate at the agreed 12% rate, not paid settlements.
export const DASHBOARD_COMMISSION_RATE = 12

export interface RevenuePayment {
  id: string
  amount: number
  paid_at: string | null
  status: string
}

export interface RevenueRefund {
  id: string
  payment_id: string
  refund_amount: number
  refunded_at: string | null
  status: string
}

export interface DailyRevenueDetailData {
  date: string
  displayDate: string
  revenue: number
  refundAmount: number
  netRevenue: number
  settlementAmount: number
  count: number
}

// Continue until an empty page, even if the server caps responses below the
// requested size. A failed page must not turn into a successful partial sum.
export async function fetchRevenuePages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []
  for (;;) {
    const { data, error } = await fetchPage(rows.length, rows.length + 499)
    if (error) throw new Error(error.message)
    if (!data?.length) return rows
    rows.push(...data)
  }
}

const DAY_MS = 86_400_000
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

function timestamp(value: string): number {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error('결제·환불 일시를 확인해주세요.')
  return parsed
}

function calendarDate(value: string): number {
  const parsed = timestamp(`${value}T00:00:00Z`)
  if (new Date(parsed).toISOString().slice(0, 10) !== value) {
    throw new Error('조회 기간을 확인해주세요.')
  }
  return parsed
}

export function revenueDateBounds(startDate: string, endDate: string) {
  const start = calendarDate(startDate)
  const end = calendarDate(endDate)
  if (end < start || end - start > 370 * DAY_MS) throw new Error('조회 기간을 확인해주세요.')
  return {
    start: new Date(start - KST_OFFSET_MS).toISOString(),
    endExclusive: new Date(end + DAY_MS - KST_OFFSET_MS).toISOString(),
  }
}

function assertAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error('결제·환불 금액을 확인해주세요.')
  }
}

// Integer won, rounded once per original payment. The agreed platform fee
// remains payable after partial refunds, but is reversed once fully refunded.
function commission(amount: number): number {
  if (!Number.isSafeInteger(amount * DASHBOARD_COMMISSION_RATE)) {
    throw new Error('집계 가능한 금액 범위를 초과했습니다.')
  }
  return Math.round(amount * DASHBOARD_COMMISSION_RATE / 100)
}

export function calculateDashboardRevenue(
  startDate: string,
  endDate: string,
  payments: readonly RevenuePayment[],
  refundHistory: readonly RevenueRefund[],
): DailyRevenueDetailData[] {
  const { endExclusive } = revenueDateBounds(startDate, endDate)
  const cutoff = timestamp(endExclusive)
  const daily = new Map<string, DailyRevenueDetailData>()
  for (let day = calendarDate(startDate); day <= calendarDate(endDate); day += DAY_MS) {
    const date = new Date(day).toISOString().slice(0, 10)
    daily.set(date, {
      date, displayDate: `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`,
      revenue: 0, refundAmount: 0, netRevenue: 0, settlementAmount: 0, count: 0,
    })
  }
  const dayFor = (time: number) => daily.get(new Date(time + KST_OFFSET_MS).toISOString().slice(0, 10))
  const paymentMap = new Map<string, RevenuePayment>()
  for (const payment of payments) {
    if (!payment.paid_at || !['paid', 'cancelled'].includes(payment.status)) continue
    assertAmount(payment.amount)
    if (paymentMap.has(payment.id)) throw new Error('결제 중복 집계가 감지되었습니다.')
    paymentMap.set(payment.id, payment)
    const day = dayFor(timestamp(payment.paid_at))
    if (day) {
      day.revenue += payment.amount
      day.netRevenue += commission(payment.amount)
      day.count += 1
    }
  }

  const refunded = new Map<string, number>()
  const refundIds = new Set<string>()
  const completed = refundHistory
    .filter(refund => refund.status === 'completed')
    .map(refund => {
      if (!refund.refunded_at) throw new Error('완료된 환불의 처리 일시가 없습니다.')
      return { refund, time: timestamp(refund.refunded_at) }
    })
    .filter(({ time }) => time < cutoff)
    .sort((a, b) => a.time - b.time || a.refund.id.localeCompare(b.refund.id))

  for (const { refund, time } of completed) {
    if (refundIds.has(refund.id)) throw new Error('환불 중복 집계가 감지되었습니다.')
    refundIds.add(refund.id)
    assertAmount(refund.refund_amount)
    const payment = paymentMap.get(refund.payment_id)
    if (!payment?.paid_at || timestamp(payment.paid_at) > time) {
      throw new Error('환불에 연결된 원결제를 확인해주세요.')
    }
    const before = payment.amount - (refunded.get(payment.id) ?? 0)
    const after = before - refund.refund_amount
    if (after < 0) throw new Error('누적 환불액이 원결제 금액을 초과했습니다.')
    refunded.set(payment.id, payment.amount - after)
    const day = dayFor(time)
    if (day) {
      day.refundAmount += refund.refund_amount
      // Reverse the original rounded fee exactly once, on the date cumulative
      // completed refunds reach the original payment. This keeps daily/monthly
      // totals additive without rewriting the historical payment date.
      if (before > 0 && after === 0) day.netRevenue -= commission(payment.amount)
    }
  }

  return [...daily.values()].map(day => {
    // Refund-only days must remain negative to reduce the period's totals.
    const settlementAmount = day.revenue - day.refundAmount - day.netRevenue
    if (![day.revenue, day.refundAmount, day.netRevenue, settlementAmount].every(Number.isSafeInteger)) {
      throw new Error('집계 가능한 금액 범위를 초과했습니다.')
    }
    return { ...day, settlementAmount }
  })
}
