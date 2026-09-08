import { createClient } from 'npm:@supabase/supabase-js@2.89.0'
import { queryTransaction, verifyRefundTransaction, verifySignature } from './nicepay-refund.ts'

const headers = { 'Access-Control-Allow-Origin': 'https://admin.withdamda.kr',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store', Vary: 'Origin' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...headers, 'Content-Type': 'application/json' },
})

export function refundHandler(webhook = false) {
  return async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response(null, { headers })
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
    let previewAuthorized = false
    let gatewayDiagnostic: Record<string, unknown> | undefined
    try {
      if (Number(request.headers.get('content-length')) > 32768) return json({ error: 'body_too_large' }, 413)
      const raw = await request.text()
      if (raw.length > 32768) return json({ error: 'body_too_large' }, 413)
      const body = JSON.parse(raw)
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'invalid_request' }, 400)
      const config = { clientKey: Deno.env.get('NICEPAY_CLIENT_KEY') ?? '', secretKey: Deno.env.get('NICEPAY_SECRET_KEY') ?? '' }
      if (!config.clientKey || !config.secretKey) return json({ error: 'gateway_configuration_required' }, 503)
      const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      let actor: string | null = null
      if (webhook) {
        await verifySignature(body, config)
        if (!['cancelled', 'partialCancelled'].includes(body.status)) return json({ error: 'refund_events_only' }, 400)
      } else {
        const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
        if (!token) return json({ error: 'unauthorized' }, 401)
        const { data: { user }, error } = await service.auth.getUser(token)
        if (error || !user) return json({ error: 'unauthorized' }, 401)
        const { data: admin } = await service.from('admins').select('id').eq('id', user.id).eq('is_active', true).maybeSingle()
        if (!admin) return json({ error: 'forbidden' }, 403)
        actor = user.id
        previewAuthorized = body.preview === true
        if (typeof body.paymentId !== 'string' || !/^[a-f\d-]{36}$/i.test(body.paymentId)) return json({ error: 'invalid_payment' }, 400)
      }
      let payments = service.from('payments').select('id,reservation_id,pg_tid,amount,paid_at,payment_method,pg_provider,status')
      payments = webhook ? payments.eq('pg_tid', body.tid) : payments.eq('id', body.paymentId)
      const { data: payment, error } = await payments.single()
      if (error || !payment || !payment.pg_tid) return json({ error: 'payment_not_found_or_ambiguous' }, 409)
      const { data: order } = await service.from('payment_orders').select('order_id,pg_tid,amount,reservation_ids').eq('pg_tid', payment.pg_tid).single()
      if (!order) return json({ error: 'order_not_found_or_ambiguous' }, 409)
      // Never trust a webhook payload alone. Independently query the live transaction.
      const gateway = await queryTransaction(payment.pg_tid, config)
      if (previewAuthorized) gatewayDiagnostic = Object.fromEntries(
        ['resultCode', 'status', 'tid', 'orderId', 'amount', 'balanceAmt', 'paidAt', 'cancelledAt', 'currency', 'payMethod']
          .map(key => [key, gateway[key]]))
      const evidence = await verifyRefundTransaction(gateway, payment, order, config)
      if (webhook && (body.orderId !== evidence.orderId || body.amount !== evidence.amount)) return json({ error: 'transaction_mismatch' }, 409)
      if (!webhook && body.preview === true) return json({ success: true, preview: true, paymentId: payment.id, evidence })
      const { data: result, error: writeError } = await service.rpc('reconcile_verified_nicepay_refund', {
        p_payment_id: payment.id, p_actor_id: actor, p_source: webhook ? 'webhook' : 'admin', p_evidence: evidence,
      })
      if (writeError || !result) return json({ error: 'refund_reconciliation_requires_review' }, 409)
      if (webhook) return new Response('OK', { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } })
      return json({ success: true, ...result })
    } catch (error) {
      // Do not leak gateway responses, credentials or PII; failure is never a success.
      const reason = error instanceof Error && /^(invalid_signature|invalid_configuration|invalid_gateway_response|transaction_mismatch|invalid_cancellations|refund_total_mismatch|gateway_http_\d{3})$/.test(error.message) ? error.message : 'unavailable'
      return json({ error: 'gateway_verification_failed', ...(previewAuthorized ? { reason, gateway: gatewayDiagnostic } : {}) }, 503)
    }
  }
}
