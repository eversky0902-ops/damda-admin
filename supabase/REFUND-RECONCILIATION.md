# NICEPAY cancellation reconciliation — 2026-09-08

## Status

Production incident reconciliation completed on 2026-09-08 after the user reauthenticated.
Both payments now have one completed 1,000 KRW refund each. PG signature, original
TID/order/amount, full cancellation and timestamps were independently verified by GET.
No PG approval or cancellation POST was issued for this incident.
Repetition returned insertedCount 0 for both. Admin UI was verified with 2,000 KRW gross,
2,000 KRW refunds, 240 KRW fixed commission and -240 KRW estimated settlement under
the initial policy. The user subsequently clarified: FULL refunds waive the commission;
PARTIAL refunds retain 12% of the original payment (not the remaining balance).
The corrected dashboard reverses the original rounded fee exactly once on the date
cumulative completed refunds reach the original payment. Expected incident totals are
2,000 KRW gross / 2,000 KRW refunds / 0 KRW commission / 0 KRW estimated settlement.
Example: 100,000 KRW paid / 70,000 KRW refunded / 12,000 KRW commission / 18,000 KRW
estimated partner settlement. Cross-month reversals are reflected in the refund month;
historical payment dates and actual payouts are not rewritten.

Clarified-policy rollout: 63 tests passed (19 dashboard + existing 44 refund tests),
TypeScript, targeted ESLint and isolated Vite build passed. Deployed isolated admin
release 4db767f to Vercel dpl_53iZbNwt364ZFe2PaPogbWBtHpzo (production READY).
The live admin.withdamda.kr dashboard was reloaded and verified to show exactly
2,000 / 2,000 / 0 / 0 KRW, with the partial/full-refund explanatory text updated.
This follow-up only changes dashboard estimates: no PG calls, DB migrations,
historical settlement records or money-moving payout actions were executed.

Local verification: 59 tests passed (15 dashboard, 24 gateway/UI, 17 isolated SQL,
3 webhook forwarding). Admin TypeScript/targeted ESLint/Vite build and all three Edge
Function type checks passed. Live endpoint checks returned 401 for missing/invalid token,
400 for negative amount, 409 for mismatched reservation, and non-2xx for unsigned webhook.
These negative tests did not call the PG cancellation API. Live money-moving refund tests
were intentionally not performed. During UI QA, stale authentication restoration errors
required re-login; existing initial chart sizing warnings were also observed.

Deployed admin frontend: c7eac06 (isolated release from 8cb884b, unrelated edits excluded),
Vercel dpl_4516urbP9WhktfkKo7NKDVsTg2pq, https://admin.withdamda.kr.
Deployed Edge Functions: reconcile-nicepay-refund, nicepay-refund-webhook, process-refund.
Applied SQL: 20260908170000 and 20260908180000 via explicitly reviewed Management API SQL.
Automatic PG-console cancellation notification delivery is still **not verified/configured**.
The new webhook endpoint is ready but must be registered/routed in NICEPAY without
replacing the existing paid-event workflow. The separate damda-user payment-security
webhook work remains uncommitted/unreleased; it was not bundled into this deployment.
A production environment download was rejected by security review; no secrets were downloaded.
Do not fetch all production variables as a workaround. Required gateway credentials must stay
server-side (`NICEPAY_CLIENT_KEY`, `NICEPAY_SECRET_KEY` in the existing project secrets).

## Incident scope

| Reservation | Original NICEPAY TID | Original payment |
|---|---|---:|
| RES20260905133006931EEF94F | UT0026860m01012609052230053914 | 1,000 KRW |
| RES202609051116323921DC3FA | UT0026860m01012609051949543278 | 1,000 KRW |

Verified PG cancellation times (KST): TID ending 43278 at 2026-09-05 21:44:30;
TID ending 53914 at 2026-09-05 22:35:08. Both amounts are exactly 1,000 KRW.
These PG times, not the later reservation cancellation request timestamps, were saved.
NICEPAY returns compact +0900 timestamps; verification accepts both +0900 and +09:00
without modifying the original text used for cryptographic signature verification.
DB paid_at may be the old receipt-write timestamp with microseconds, so evidence retains
both recordedPaidAt (DB concurrency snapshot) and paidAt (signed PG time). DB paid_at is preserved.

## Deployment and recovery order

1. Restore Supabase CLI authentication (`npx supabase@latest login`). Never paste tokens in chat.
2. Read existing production `process-refund`, payment/refund schema, policies, triggers,
   and existing webhook configuration. Do not replace a paid-notification endpoint.
3. Review/apply only `20260908170000_reconcile_verified_nicepay_refunds.sql` in a transaction.
   This adds a nullable cancellation identifier, unique key, private audit and service-only RPC;
   it does not rewrite any historical rows. Do NOT deploy unrelated pending migrations.
4. Deploy `reconcile-nicepay-refund` and `nicepay-refund-webhook` to project
   `eifpjjoawsgdmeeuzhin`. Their handlers perform their own admin or signature verification.
   Confirm the named gateway credentials already exist server-side without exporting values.
5. Verify 401/403 and signed-webhook rejection against deployed handlers before admin rollout.
6. Deploy the admin changes, preserving/excluding unrelated working-tree changes.
   The refund preflight fails closed if its backend has not been deployed.
7. The `damda-user` webhook cancellation branch forwards signed cancellation events to the
   new boundary; paid events keep their existing path. That file already contained separate,
   uncommitted payment-security changes: coordinate/review them before its deployment.
   Verify the actual NICEPAY webhook URL and delivery; local source presence is not proof
   that a production webhook is configured. Do not claim automatic recovery until tested.
8. For each incident payment use **PG 취소내역 동기화**. The handler independently performs
   GET `/v1/payments/{tid}`, checks signature, currency, amount, order/reservation IDs,
   paid time, cancellation IDs/times, and balance. It calls no NICEPAY cancel/approval API.
9. Confirm recorded refund rows, timestamps, payment/reservation statuses and private audit.
   Repeat synchronization: insertedCount must be 0. Refresh dashboard and confirm totals
   in the refund-date period. Original payment amounts/dates remain. Partial refunds retain
   the original 12% fee; completed full refunds reverse that fee on the full-refund date.

## Safety boundaries / remaining verification

- Reconciliation is atomic and idempotent by payment + PG cancellation ID. Existing in-flight
  or untagged completed refunds stop for review; no guessed association or duplicate inserts.
- Multi-reservation orders stop for review; partial cancellations cannot be arbitrarily divided.
- Local PGlite tests verify transaction rollback, ACL, mapping, repeated/parallel-submitted calls.
  This is not a multi-connection production concurrency/load test.
- Existing production process-refund lacked caller authentication, could skip the PG when
  keys were missing, and saved refunds/statuses separately. It was replaced with active-admin
  authentication, payment/reservation validation, verified PG pre/post-GET and durable request
  claims. One active/review request per payment prevents retries from issuing a second POST.
  Database finalization is atomic. Failed/uncertain attempts remain blocked for operator review.
  Stored original commission policy, actual payouts and payment approvals were not changed.
- The actual money-moving cancellation path was reviewed and type/SQL tested, not invoked
  against live payments. A separate authorized sandbox payment is still required for live PG E2E.
- Full cancellation updates reservation to refunded while retaining its original cancellation
  request time. For the two already-cancelled incident reservations, existing notification
  trigger conditions do not resend cancellation notices. Verify live trigger definitions first.

## Local verification

From `damda-admin`:

```powershell
node --test tests/dashboard-revenue.test.mjs tests/refund-reconciliation.test.mjs tests/refund-reconciliation.database.test.mjs tests/refund-webhook-forwarding.test.mjs
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
```

Database tests reuse the existing workspace PGlite installation in
`damda-user/tests/payment-security/node_modules`; no live database is contacted.

Protocol reference: https://github.com/nicepayments/nicepay-manual/blob/main/api/status-transaction.md
