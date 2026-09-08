// NICEPAY /api/status-transaction.md: this module ONLY queries; never cancels.
export type GatewayConfig = { clientKey: string; secretKey: string }
export type RefundPayment = {
  id: string; reservation_id: string; pg_tid: string; amount: number; paid_at: string
  payment_method: string; pg_provider: string; status: string
}
export type RefundOrder = { order_id: string; pg_tid: string; amount: number; reservation_ids: string[] }
export type RefundEvidence = {
  tid: string; orderId: string; amount: number; balanceAmt: number
  status: 'paid' | 'cancelled' | 'partialCancelled'; paidAt: string; recordedPaidAt: string
  cancels: { tid: string; amount: number; cancelledAt: string }[]
  responseHash: string
}
const identifier = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(v)
const amount = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0
const instant = (v: unknown): v is string => typeof v === 'string'
  && /T.+(?:Z|[+-]\d{2}:?\d{2})$/.test(v) && Number.isFinite(Date.parse(v))
export async function sha256(value: string) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))]
    .map(b => b.toString(16).padStart(2, '0')).join('')
}
export async function verifySignature(data: Record<string, unknown>, config: GatewayConfig) {
  if (!identifier(data.tid) || !identifier(data.orderId) || !amount(data.amount) || !instant(data.ediDate)
    || typeof data.signature !== 'string' || !/^[a-fA-F0-9]{64}$/.test(data.signature)) throw new Error('invalid_signature')
  const expected = await sha256(`${data.tid}${data.amount}${data.ediDate}${config.secretKey}`)
  let mismatch = 0
  for (let i = 0; i < 64; i++) mismatch |= expected.charCodeAt(i) ^ data.signature.toLowerCase().charCodeAt(i)
  if (mismatch) throw new Error('invalid_signature')
}
export async function queryTransaction(tid: string, config: GatewayConfig, transport = fetch) {
  if (!identifier(tid) || !config.clientKey || !config.secretKey) throw new Error('invalid_configuration')
  const ediDate = new Date().toISOString()
  const url = new URL(`https://api.nicepay.co.kr/v1/payments/${encodeURIComponent(tid)}`)
  url.searchParams.set('ediDate', ediDate)
  url.searchParams.set('signData', await sha256(`${tid}${ediDate}${config.secretKey}`))
  const response = await transport(url, {
    method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Basic ${btoa(`${config.clientKey}:${config.secretKey}`)}`, 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error(`gateway_http_${response.status}`)
  const data = await response.json()
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid_gateway_response')
  return data as Record<string, unknown>
}
export async function verifyRefundTransaction(data: Record<string, unknown>, payment: RefundPayment, order: RefundOrder, config: GatewayConfig): Promise<RefundEvidence> {
  await verifySignature(data, config)
  if (data.resultCode !== '0000' || data.currency !== 'KRW' || data.tid !== payment.pg_tid
    || data.tid !== order.pg_tid || data.orderId !== order.order_id || data.amount !== payment.amount
    || data.amount !== order.amount || !amount(data.amount) || data.amount === 0
    || data.payMethod !== payment.payment_method || payment.pg_provider !== 'nicepay'
    || !['paid', 'cancelled'].includes(payment.status) || !instant(payment.paid_at)
    || !instant(data.paidAt)
    || order.reservation_ids.length !== 1 || order.reservation_ids[0] !== payment.reservation_id
    || !amount(data.balanceAmt) || data.balanceAmt > data.amount
    || !['paid', 'cancelled', 'partialCancelled'].includes(String(data.status))) throw new Error('transaction_mismatch')
  const status = data.status as RefundEvidence['status']
  if (data.cancels != null && !Array.isArray(data.cancels)) throw new Error('invalid_cancellations')
  const items = (data.cancels ?? []) as Record<string, unknown>[]
  const seen = new Set<string>()
  let total = 0
  const cancels = items.map(c => {
    if (!c || !identifier(c.tid) || seen.has(c.tid) || !amount(c.amount) || c.amount === 0
      || !instant(c.cancelledAt) || Date.parse(c.cancelledAt) < Date.parse(data.paidAt as string)
      || Date.parse(c.cancelledAt) > Date.now() + 300000) throw new Error('invalid_cancellations')
    seen.add(c.tid)
    total += c.amount
    if (!Number.isSafeInteger(total)) throw new Error('invalid_cancellations')
    return { tid: c.tid, amount: c.amount, cancelledAt: c.cancelledAt }
  }).sort((a, b) => Date.parse(a.cancelledAt) - Date.parse(b.cancelledAt) || a.tid.localeCompare(b.tid))
  if (total !== data.amount - data.balanceAmt
    || (status === 'paid' && (total !== 0 || items.length !== 0 || !['0', 0].includes(data.cancelledAt as string | number)))
    || (status === 'cancelled' && (data.balanceAmt !== 0 || !items.length))
    || (status === 'partialCancelled' && (data.balanceAmt <= 0 || !items.length))
    || (items.length > 0 && (!instant(data.cancelledAt)
      || Date.parse(data.cancelledAt) !== Date.parse(cancels[cancels.length - 1].cancelledAt)))) throw new Error('refund_total_mismatch')
  // Persist only financial evidence, never raw buyer/card information or secrets.
  return { tid: payment.pg_tid, orderId: order.order_id, amount: payment.amount, balanceAmt: data.balanceAmt,
    status, paidAt: data.paidAt, recordedPaidAt: payment.paid_at, cancels, responseHash: await sha256(JSON.stringify(data)) }
}
