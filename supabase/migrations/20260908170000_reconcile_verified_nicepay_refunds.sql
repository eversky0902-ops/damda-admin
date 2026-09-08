-- Deploy only after review. No existing rows changed by this migration.
BEGIN;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS pg_cancel_tid text;
CREATE UNIQUE INDEX IF NOT EXISTS refunds_payment_cancel_tid_unique
  ON public.refunds(payment_id, pg_cancel_tid) WHERE pg_cancel_tid IS NOT NULL;
CREATE TABLE public.refund_reconciliation_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_id uuid NOT NULL REFERENCES public.payments(id),
  actor_id uuid REFERENCES public.admins(id), source text NOT NULL CHECK (source IN ('admin','webhook')),
  evidence jsonb NOT NULL, inserted_count integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.refund_reconciliation_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.refund_reconciliation_audit FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.reconcile_verified_nicepay_refund(
  p_payment_id uuid, p_actor_id uuid, p_source text, p_evidence jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  p public.payments%ROWTYPE; r public.reservations%ROWTYPE; o public.payment_orders%ROWTYPE;
  c jsonb; existing public.refunds%ROWTYPE; v_total bigint; v_count integer := 0;
  v_balance integer; v_last timestamptz; v_status text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server_only' USING ERRCODE='42501'; END IF;
  IF p_source IS NULL OR p_source NOT IN ('admin','webhook')
    OR (p_source = 'admin' AND NOT EXISTS (SELECT 1 FROM public.admins WHERE id=p_actor_id AND is_active))
    OR (p_source = 'webhook' AND p_actor_id IS NOT NULL) THEN
    RAISE EXCEPTION 'invalid_actor' USING ERRCODE='42501';
  END IF;
  SELECT * INTO STRICT p FROM public.payments WHERE id=p_payment_id FOR UPDATE;
  SELECT * INTO STRICT r FROM public.reservations WHERE id=p.reservation_id FOR UPDATE;
  SELECT * INTO STRICT o FROM public.payment_orders WHERE pg_tid=p.pg_tid FOR UPDATE;
  IF p.pg_provider <> 'nicepay' OR p.status NOT IN ('paid','cancelled') OR p.paid_at IS NULL
    OR (SELECT count(*) FROM public.payments WHERE pg_tid=p.pg_tid) <> 1
    OR cardinality(o.reservation_ids) <> 1 OR o.reservation_ids[1] IS DISTINCT FROM r.id
    OR o.amount <> p.amount OR r.total_amount <> p.amount OR o.daycare_id <> r.daycare_id
    OR r.status NOT IN ('paid','confirmed','completed','cancelled','refunded') THEN
    RAISE EXCEPTION 'payment_relationship_requires_review';
  END IF;
  IF p_evidence IS NULL OR jsonb_typeof(p_evidence) <> 'object'
    OR p_evidence->>'tid' IS DISTINCT FROM p.pg_tid OR p_evidence->>'orderId' IS DISTINCT FROM o.order_id
    OR (p_evidence->>'amount')::integer IS DISTINCT FROM p.amount
    OR (p_evidence->>'recordedPaidAt')::timestamptz IS DISTINCT FROM p.paid_at
    OR (p_evidence->>'paidAt')::timestamptz IS NULL
    OR jsonb_typeof(p_evidence->'cancels') IS DISTINCT FROM 'array'
    OR coalesce(p_evidence->>'responseHash','') !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_verified_evidence';
  END IF;
  v_balance := (p_evidence->>'balanceAmt')::integer;
  v_status := p_evidence->>'status';
  IF v_balance IS NULL OR v_balance < 0 OR v_balance > p.amount OR v_status IS NULL
    OR v_status NOT IN ('paid','cancelled','partialCancelled')
    OR (v_status='paid' AND (v_balance<>p.amount OR jsonb_array_length(p_evidence->'cancels')<>0))
    OR (v_status='cancelled' AND v_balance<>0)
    OR (v_status='partialCancelled' AND (v_balance=0 OR v_balance=p.amount)) THEN
    RAISE EXCEPTION 'invalid_refund_balance';
  END IF;
  SELECT coalesce(sum((x->>'amount')::bigint),0), max((x->>'cancelledAt')::timestamptz)
    INTO v_total,v_last FROM jsonb_array_elements(p_evidence->'cancels') x;
  IF v_total <> p.amount-v_balance OR (v_status<>'paid' AND v_total=0)
    OR (SELECT count(*)<>count(DISTINCT x->>'tid') FROM jsonb_array_elements(p_evidence->'cancels') x) THEN
    RAISE EXCEPTION 'refund_total_mismatch';
  END IF;
  -- Serialize refund rows too. Existing unmapped or in-flight refunds require manual
  -- review, NOT another insert that might duplicate a real cancellation.
  PERFORM 1 FROM public.refunds WHERE payment_id=p.id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.refunds WHERE payment_id=p.id AND
    (status='pending' OR (status='completed' AND (pg_cancel_tid IS NULL OR reservation_id<>r.id)))) THEN
    RAISE EXCEPTION 'existing_refund_requires_review';
  END IF;
  IF EXISTS (SELECT 1 FROM public.refunds f WHERE f.payment_id=p.id AND f.status='completed'
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_evidence->'cancels') x WHERE x->>'tid'=f.pg_cancel_tid)) THEN
    RAISE EXCEPTION 'stale_or_incomplete_gateway_history';
  END IF;
  FOR c IN SELECT x FROM jsonb_array_elements(p_evidence->'cancels') x LOOP
    IF coalesce(c->>'tid','') !~ '^[A-Za-z0-9_-]{1,100}$' OR (c->>'amount')::integer IS NULL
      OR (c->>'amount')::integer <= 0 OR (c->>'cancelledAt')::timestamptz IS NULL
      OR (c->>'cancelledAt')::timestamptz < (p_evidence->>'paidAt')::timestamptz OR (c->>'cancelledAt')::timestamptz > now()+interval '5 minutes' THEN
      RAISE EXCEPTION 'invalid_cancellation';
    END IF;
    SELECT * INTO existing FROM public.refunds WHERE payment_id=p.id AND pg_cancel_tid=c->>'tid';
    IF FOUND THEN
      IF existing.status<>'completed' OR existing.reservation_id<>r.id OR existing.original_amount<>p.amount
        OR existing.refund_amount IS DISTINCT FROM (c->>'amount')::integer
        OR existing.refunded_at IS DISTINCT FROM (c->>'cancelledAt')::timestamptz THEN
        RAISE EXCEPTION 'existing_refund_mismatch';
      END IF;
    ELSE
      INSERT INTO public.refunds(payment_id,reservation_id,original_amount,refund_amount,reason,admin_memo,status,refunded_at,processed_by,pg_cancel_tid)
        VALUES(p.id,r.id,p.amount,(c->>'amount')::integer,'NICEPAY 취소 내역 동기화',
          'PG 거래 조회로 확인된 기존 취소입니다. 취소 API를 재호출하지 않았습니다.',
          'completed',(c->>'cancelledAt')::timestamptz,p_actor_id,c->>'tid');
      v_count := v_count+1;
    END IF;
  END LOOP;
  IF (SELECT coalesce(sum(refund_amount),0) FROM public.refunds WHERE payment_id=p.id AND status='completed')<>v_total THEN
    RAISE EXCEPTION 'persisted_refund_mismatch';
  END IF;
  IF v_status='cancelled' THEN
    UPDATE public.payments SET status='cancelled' WHERE id=p.id AND status IS DISTINCT FROM 'cancelled';
    -- Preserve original cancellation request time and reason. Already-cancelled
    -- reservations do not trigger another cancellation notification.
    UPDATE public.reservations SET status='refunded',cancelled_at=coalesce(cancelled_at,v_last)
      WHERE id=r.id AND status IS DISTINCT FROM 'refunded';
  ELSIF p.status='cancelled' THEN
    RAISE EXCEPTION 'local_status_mismatch';
  END IF;
  INSERT INTO public.refund_reconciliation_audit(payment_id,actor_id,source,evidence,inserted_count)
    VALUES(p.id,p_actor_id,p_source,p_evidence,v_count);
  RETURN jsonb_build_object('insertedCount',v_count,'refundAmount',v_total,'balanceAmount',v_balance,'gatewayStatus',v_status);
END $$;
REVOKE ALL ON FUNCTION public.reconcile_verified_nicepay_refund(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_verified_nicepay_refund(uuid,uuid,text,jsonb) TO service_role;
COMMIT;
