import { createClient } from 'npm:@supabase/supabase-js@2.89.0'
import { queryTransaction, verifyRefundTransaction } from '../_shared/nicepay-refund.ts'

const headers = { 'Access-Control-Allow-Origin': 'https://admin.withdamda.kr',
  'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info', 'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Cache-Control': 'no-store', 'Content-Type': 'application/json', Vary: 'Origin' }
const response = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers })
const uuid = (s: unknown): s is string => typeof s==='string' && /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(s)

Deno.serve(async request => {
  if (request.method==='OPTIONS') return new Response(null,{ headers })
  if (request.method!=='POST') return response({ success:false,error:'허용되지 않은 요청입니다.' },405)
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if (!token) return response({ success:false,error:'관리자 로그인이 필요합니다.' },401)
  const service=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{ auth:{persistSession:false,autoRefreshToken:false} })
  let actor:string|null=null
  let requestId:string|null=null
  let claimed=false
  try {
    const {data:{user},error}=await service.auth.getUser(token)
    if (error||!user) return response({success:false,error:'관리자 로그인이 필요합니다.'},401)
    const {data:admin}=await service.from('admins').select('id').eq('id',user.id).eq('is_active',true).maybeSingle()
    if (!admin) return response({success:false,error:'관리자 권한이 필요합니다.'},403)
    actor=user.id
    const raw=await request.text()
    if(raw.length>8192) return response({success:false,error:'요청 크기를 초과했습니다.'},413)
    const body=JSON.parse(raw)
    if(!body || !uuid(body.paymentId)||!uuid(body.reservationId)||!uuid(body.requestId)
      ||!Number.isSafeInteger(body.refundAmount)||body.refundAmount<=0||typeof body.reason!=='string'||!body.reason.trim()||body.reason.length>500
      ||(body.adminMemo!=null&&(typeof body.adminMemo!=='string'||body.adminMemo.length>1000))) return response({success:false,error:'환불 요청값을 확인하고 새로고침해주세요.'},400)
    requestId=body.requestId
    const {data:payment}=await service.from('payments').select('id,reservation_id,pg_tid,amount,paid_at,payment_method,pg_provider,status').eq('id',body.paymentId).single()
    if(!payment||payment.reservation_id!==body.reservationId) return response({success:false,error:'결제와 예약 정보가 일치하지 않습니다.'},409)
    const {data:order}=await service.from('payment_orders').select('order_id,pg_tid,amount,reservation_ids').eq('pg_tid',payment.pg_tid).single()
    if(!order) return response({success:false,error:'원결제 주문을 확인할 수 없습니다.'},409)
    const config={clientKey:Deno.env.get('NICEPAY_CLIENT_KEY')??'',secretKey:Deno.env.get('NICEPAY_SECRET_KEY')??''}
    const before=await verifyRefundTransaction(await queryTransaction(payment.pg_tid,config),payment,order,config)
    const {data:claim,error:claimError}=await service.rpc('claim_nicepay_refund_attempt',{
      p_payment_id:payment.id,p_actor_id:actor,p_request_id:requestId,p_amount:body.refundAmount,p_reason:body.reason.trim(),p_memo:body.adminMemo??null,p_evidence:before,
    })
    if(claimError||!claim) return response({success:false,error:'환불금액 또는 진행 중인 요청을 확인해주세요. 새 환불은 실행하지 않았습니다.'},409)
    if(!claim.claimed) {
      if(claim.state==='completed') return response(claim.result)
      return response({success:false,error:'이미 취소되었거나 확인 중인 환불입니다. PG 취소내역을 동기화하고 확인해주세요. 새 환불은 실행하지 않았습니다.'},409)
    }
    claimed=true
    // Durable claim precedes the ONLY PG POST. Never retry after an uncertain response.
    const cancelBody:Record<string,unknown>={orderId:`refund-${requestId}`,reason:body.reason.trim()}
    if(body.refundAmount!==before.amount) cancelBody.cancelAmt=body.refundAmount
    try {
      await fetch(`https://api.nicepay.co.kr/v1/payments/${encodeURIComponent(payment.pg_tid)}/cancel`,{
        method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),headers:{'Content-Type':'application/json',Authorization:`Basic ${btoa(`${config.clientKey}:${config.secretKey}`)}`},
        body:JSON.stringify(cancelBody),
      })
    } catch { /* GET below resolves the outcome, not a second POST. */ }
    const after=await verifyRefundTransaction(await queryTransaction(payment.pg_tid,config),payment,order,config)
    const {data:result,error:finishError}=await service.rpc('finish_nicepay_refund_attempt',{p_request_id:requestId,p_actor_id:actor,p_evidence:after})
    if(finishError||!result) throw new Error('refund_outcome_uncertain')
    return response(result)
  } catch {
    if(claimed&&requestId&&actor) await service.rpc('review_nicepay_refund_attempt',{p_request_id:requestId,p_actor_id:actor})
    return response({success:false,error:'PG 결과 또는 저장 상태 확인이 필요합니다. 중복 환불을 방지하기 위해 다시 요청하지 말고 PG 취소내역을 확인해주세요.'},503)
  }
})
