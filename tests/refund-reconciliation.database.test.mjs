import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
// Reuse the workspace's existing isolated PostgreSQL test runtime. No remote DB.
const require = createRequire(new URL('../../damda-user/tests/payment-security/package.json', import.meta.url))
const { PGlite } = require('@electric-sql/pglite')
const admin = '44444444-4444-4444-8444-444444444444'
const owner = '11111111-1111-4111-8111-111111111111'
const payment = '55555555-5555-4555-8555-555555555555'
const reservation = '66666666-6666-4666-8666-666666666666'
let db
const evidence = (amount = 600, overrides = {}) => ({ tid: 'pg1', orderId: 'o1', amount: 1000,
  balanceAmt: 1000 - amount, status: amount === 1000 ? 'cancelled' : 'partialCancelled', paidAt: '2026-09-01T10:00:00+09:00', recordedPaidAt: '2026-09-01T10:00:00+09:00',
  cancels: [{ tid: 'cancel1', amount, cancelledAt: '2026-09-03T10:00:00+09:00' }], responseHash: 'a'.repeat(64), ...overrides })
test.before(async () => {
  db = new PGlite()
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.role',true),'') $$;
    CREATE TABLE admins(id uuid PRIMARY KEY,is_active boolean);
    CREATE TABLE reservations(id uuid PRIMARY KEY,daycare_id uuid,total_amount integer,status text,cancelled_at timestamptz);
    CREATE TABLE payments(id uuid PRIMARY KEY,reservation_id uuid REFERENCES reservations,pg_provider text,pg_tid text,amount integer,paid_at timestamptz,status text);
    CREATE TABLE payment_orders(order_id text PRIMARY KEY,pg_tid text,amount integer,daycare_id uuid,reservation_ids uuid[]);
    CREATE TABLE refunds(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),payment_id uuid REFERENCES payments,reservation_id uuid REFERENCES reservations,
      original_amount integer,refund_amount integer,reason text,admin_memo text,status text,refunded_at timestamptz,processed_by uuid REFERENCES admins);
    INSERT INTO admins VALUES('${admin}',true);`)
  await db.exec(await readFile(new URL('../supabase/migrations/20260908170000_reconcile_verified_nicepay_refunds.sql', import.meta.url), 'utf8'))
  await db.exec(await readFile(new URL('../supabase/migrations/20260908180000_guard_nicepay_refund_attempts.sql', import.meta.url), 'utf8'))
})
test.after(async () => db?.close())
test.beforeEach(async () => {
  await db.exec(`RESET ROLE; TRUNCATE nicepay_refund_attempts,refund_reconciliation_audit,refunds,payments,reservations,payment_orders CASCADE;
    SELECT set_config('request.jwt.claim.role','service_role',false);
    INSERT INTO reservations VALUES('${reservation}','${owner}',1000,'cancelled','2026-09-02T10:00:00+09:00');
    INSERT INTO payments VALUES('${payment}','${reservation}','nicepay','pg1',1000,'2026-09-01T10:00:00+09:00','paid');
    INSERT INTO payment_orders VALUES('o1','pg1',1000,'${owner}',ARRAY['${reservation}']::uuid[]);`)
})
const reconcile = async (e = evidence(), actor = admin, source = 'admin') => (await db.query(
  'SELECT reconcile_verified_nicepay_refund($1,$2,$3,$4) result', [payment, actor, source, JSON.stringify(e)])).rows[0].result
const refundCount = async () => (await db.query('SELECT count(*)::int n FROM refunds')).rows[0].n
test('전액 복구: 금액·완료일 저장, 원결제일·취소요청일 보존', async () => {
  const result = await reconcile(evidence(1000))
  assert.deepEqual(result, { insertedCount: 1, refundAmount: 1000, balanceAmount: 0, gatewayStatus: 'cancelled' })
  const row = (await db.query('SELECT p.status ps,r.status rs,refund_amount,refunded_at,paid_at,cancelled_at FROM refunds f JOIN payments p ON p.id=f.payment_id JOIN reservations r ON r.id=f.reservation_id')).rows[0]
  assert.equal(row.ps, 'cancelled'); assert.equal(row.rs, 'refunded')
  assert.equal(new Date(row.refunded_at).toISOString(), '2026-09-03T01:00:00.000Z')
  assert.equal(new Date(row.paid_at).toISOString(), '2026-09-01T01:00:00.000Z')
  assert.equal(new Date(row.cancelled_at).toISOString(), '2026-09-02T01:00:00.000Z')
})
test('같은 취소 반복·동시 요청은 환불 1건만 유지', async () => {
  const results = await Promise.all(Array.from({ length: 8 }, () => reconcile(evidence(1000))))
  assert.equal(results.reduce((n, r) => n + r.insertedCount, 0), 1)
  assert.equal(await refundCount(), 1)
})
test('순차 부분환불 및 전액 완료, 이전 취소를 중복 반영하지 않음', async () => {
  await reconcile(evidence(600))
  const e = evidence(1000)
  e.cancels = [evidence(600).cancels[0], { tid: 'cancel2', amount: 400, cancelledAt: '2026-09-04T10:00:00+09:00' }]
  assert.equal((await reconcile(e)).insertedCount, 1)
  assert.equal(await refundCount(), 2)
})
test('과거 PG 응답이 최신 환불 기록을 덮어쓰지 않음', async () => {
  await reconcile(evidence(1000))
  await assert.rejects(reconcile(evidence(600)), /mismatch/)
  assert.equal((await db.query('SELECT sum(refund_amount)::int n FROM refunds')).rows[0].n, 1000)
})
test('웹훅 재수신 시 중복 환불 없음, 처리자는 조작하지 않음', async () => {
  await reconcile(evidence(1000), null, 'webhook')
  assert.equal((await reconcile(evidence(1000), null, 'webhook')).insertedCount, 0)
  assert.equal((await db.query('SELECT processed_by FROM refunds')).rows[0].processed_by, null)
})
test('익명·회원/사업주 JWT 및 직접 SQL RPC 호출 차단', async () => {
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`RESET ROLE; SET ROLE ${role}`)
    await assert.rejects(reconcile(), /permission denied/)
  }
  await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.role','authenticated',false)")
  await assert.rejects(reconcile(), /server_only/)
})
test('NULL 역할·비관리자·조작된 webhook 처리자 차단', async () => {
  await assert.rejects(reconcile(evidence(), owner), /invalid_actor/)
  await assert.rejects(reconcile(evidence(), admin, 'webhook'), /invalid_actor/)
  await db.exec("SELECT set_config('request.jwt.claim.role','',false)")
  await assert.rejects(reconcile(), /server_only/)
})
test('기존 완료 환불에 PG 취소번호 없으면 중복 생성 대신 검토', async () => {
  await db.exec(`INSERT INTO refunds(payment_id,reservation_id,original_amount,refund_amount,status) VALUES('${payment}','${reservation}',1000,600,'completed')`)
  await assert.rejects(reconcile(), /existing_refund_requires_review/)
  assert.equal(await refundCount(), 1)
})
test('진행중 환불은 자동 매칭하지 않음', async () => {
  await db.exec(`INSERT INTO refunds(payment_id,reservation_id,original_amount,refund_amount,status) VALUES('${payment}','${reservation}',1000,600,'pending')`)
  await assert.rejects(reconcile(), /existing_refund_requires_review/)
})
test('1원 불일치·음수·다른 주문·예약 매핑은 전체 롤백', async () => {
  for (const e of [evidence(600, { amount: 1001 }), evidence(600, { balanceAmt: -1 }), evidence(600, { orderId: 'other' })]) {
    await assert.rejects(reconcile(e)); assert.equal(await refundCount(), 0)
  }
  await db.exec(`UPDATE payment_orders SET reservation_ids=ARRAY['${owner}']::uuid[]`)
  await assert.rejects(reconcile(), /relationship/)
})
test('부분 저장 후 오류가 발생해도 환불·결제 전체 롤백', async () => {
  const e = evidence(1000)
  e.cancels = [evidence(600).cancels[0], { tid: 'invalid!', amount: 400, cancelledAt: '2026-09-04T10:00:00+09:00' }]
  await assert.rejects(reconcile(e), /invalid_cancellation/)
  assert.equal(await refundCount(), 0)
  assert.equal((await db.query('SELECT status FROM payments')).rows[0].status, 'paid')
})
const request1='77777777-7777-4777-8777-777777777777'
const request2='88888888-8888-4888-8888-888888888888'
const noRefund=()=>evidence(0,{status:'paid',cancels:[]})
const claim=async(id=request1,amount=600,e=noRefund())=>(await db.query('SELECT claim_nicepay_refund_attempt($1,$2,$3,$4,$5,$6,$7) result',
  [payment,admin,id,amount,'test reason',null,JSON.stringify(e)])).rows[0].result
const finish=async(e=evidence(600))=>(await db.query('SELECT finish_nicepay_refund_attempt($1,$2,$3) result',[request1,admin,JSON.stringify(e)])).rows[0].result
test('PG 취소 전에 영구 요청 잠금: 같은 요청/다른 요청 중복 실행 차단',async()=>{
  assert.equal((await claim()).claimed,true)
  assert.equal((await claim()).claimed,false)
  assert.equal((await claim(request2)).claimed,false)
  await assert.rejects(claim(request1,700),/request_mismatch/)
})
test('타임아웃 또는 서버 재시작 후 재요청해도 PG 재실행 불가',async()=>{
  await claim()
  await db.query('SELECT review_nicepay_refund_attempt($1,$2)',[request1,admin])
  assert.equal((await claim()).state,'review')
  assert.equal((await claim(request2)).claimed,false)
})
test('검증된 부분환불 저장과 요청 완료는 원자적, 재응답도 같은 환불 ID',async()=>{
  await claim()
  const first=await finish()
  const replay=await finish()
  assert.equal(first.refund.id,replay.refund.id)
  assert.equal(first.refund.refund_amount,600)
  assert.equal(first.refund.reason,'test reason')
  assert.equal((await claim()).result.refund.id,first.refund.id)
  assert.equal(await refundCount(),1)
})
test('실제로 요청한 금액과 PG 취소 결과 불일치 시 성공 처리 안 함',async()=>{
  await claim()
  await assert.rejects(finish(evidence(1000)),/refund_outcome_uncertain/)
  assert.equal(await refundCount(),0)
  assert.equal((await claim()).claimed,false)
})
test('웹훅이 먼저 저장해도 요청 완료 시 환불 중복 생성 없음',async()=>{
  await claim()
  await reconcile(evidence(),null,'webhook')
  await finish()
  assert.equal(await refundCount(),1)
})
test('PG 선취소 발견 시 동기화만 하고 추가 취소 요청 잠금 생성 안 함',async()=>{
  const result=await claim(request1,1000,evidence(1000))
  assert.equal(result.claimed,false)
  assert.equal(result.state,'reconciled')
  assert.equal(await refundCount(),1)
  assert.equal((await db.query('SELECT count(*)::int n FROM nicepay_refund_attempts')).rows[0].n,0)
})
