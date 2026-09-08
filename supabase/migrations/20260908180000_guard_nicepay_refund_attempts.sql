BEGIN;
CREATE TABLE public.nicepay_refund_attempts (
  id uuid PRIMARY KEY, payment_id uuid NOT NULL REFERENCES public.payments(id),
  actor_id uuid NOT NULL REFERENCES public.admins(id), amount integer NOT NULL CHECK (amount>0),
  balance_before integer NOT NULL, evidence_before jsonb NOT NULL, reason text NOT NULL, admin_memo text,
  state text NOT NULL DEFAULT 'started' CHECK (state IN ('started','review','completed')),
  result jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX nicepay_one_open_refund ON public.nicepay_refund_attempts(payment_id) WHERE state IN ('started','review');
ALTER TABLE public.nicepay_refund_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.nicepay_refund_attempts FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.claim_nicepay_refund_attempt(p_payment_id uuid,p_actor_id uuid,p_request_id uuid,p_amount integer,p_reason text,p_memo text,p_evidence jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a public.nicepay_refund_attempts%ROWTYPE; p public.payments%ROWTYPE; sync jsonb;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' OR NOT EXISTS (SELECT 1 FROM public.admins WHERE id=p_actor_id AND is_active) THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR p_amount IS NULL OR p_amount<=0 OR length(trim(coalesce(p_reason,'')))=0 OR length(p_reason)>500 OR length(p_memo)>1000 THEN
    RAISE EXCEPTION 'invalid_refund_request'; END IF;
  SELECT * INTO STRICT p FROM public.payments WHERE id=p_payment_id FOR UPDATE;
  SELECT * INTO a FROM public.nicepay_refund_attempts WHERE id=p_request_id;
  IF FOUND THEN
    IF a.payment_id<>p_payment_id OR a.actor_id<>p_actor_id OR a.amount<>p_amount THEN RAISE EXCEPTION 'request_mismatch'; END IF;
    RETURN jsonb_build_object('claimed',false,'state',a.state,'result',a.result);
  END IF;
  sync:=public.reconcile_verified_nicepay_refund(p_payment_id,p_actor_id,'admin',p_evidence);
  IF (sync->>'insertedCount')::integer>0 OR (sync->>'balanceAmount')::integer=0 THEN
    RETURN jsonb_build_object('claimed',false,'state','reconciled'); END IF;
  IF p.status<>'paid' OR (sync->>'balanceAmount')::integer<p_amount THEN RAISE EXCEPTION 'insufficient_refundable_balance'; END IF;
  IF EXISTS(SELECT 1 FROM public.nicepay_refund_attempts WHERE payment_id=p_payment_id AND state IN ('started','review')) THEN
    RETURN jsonb_build_object('claimed',false,'state','review'); END IF;
  INSERT INTO public.nicepay_refund_attempts(id,payment_id,actor_id,amount,balance_before,evidence_before,reason,admin_memo)
    VALUES(p_request_id,p_payment_id,p_actor_id,p_amount,(sync->>'balanceAmount')::integer,p_evidence,p_reason,p_memo);
  RETURN jsonb_build_object('claimed',true,'state','started');
END $$;

CREATE FUNCTION public.finish_nicepay_refund_attempt(p_request_id uuid,p_actor_id uuid,p_evidence jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a public.nicepay_refund_attempts%ROWTYPE; new_cancel jsonb; n integer; f public.refunds%ROWTYPE; sync jsonb;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' OR NOT EXISTS(SELECT 1 FROM public.admins WHERE id=p_actor_id AND is_active) THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  SELECT * INTO STRICT a FROM public.nicepay_refund_attempts WHERE id=p_request_id FOR UPDATE;
  IF a.actor_id<>p_actor_id THEN RAISE EXCEPTION 'actor_mismatch'; END IF;
  IF a.state='completed' THEN RETURN a.result; END IF;
  IF a.balance_before-a.amount IS DISTINCT FROM (p_evidence->>'balanceAmt')::integer THEN RAISE EXCEPTION 'refund_outcome_uncertain'; END IF;
  SELECT count(*) INTO n FROM jsonb_array_elements(p_evidence->'cancels') c WHERE NOT EXISTS
    (SELECT 1 FROM jsonb_array_elements(a.evidence_before->'cancels') old WHERE old->>'tid'=c->>'tid');
  IF n<>1 THEN RAISE EXCEPTION 'refund_outcome_uncertain'; END IF;
  SELECT c INTO new_cancel FROM jsonb_array_elements(p_evidence->'cancels') c WHERE NOT EXISTS
    (SELECT 1 FROM jsonb_array_elements(a.evidence_before->'cancels') old WHERE old->>'tid'=c->>'tid');
  IF (new_cancel->>'amount')::integer IS DISTINCT FROM a.amount THEN RAISE EXCEPTION 'refund_outcome_uncertain'; END IF;
  sync:=public.reconcile_verified_nicepay_refund(a.payment_id,p_actor_id,'admin',p_evidence);
  SELECT * INTO STRICT f FROM public.refunds WHERE payment_id=a.payment_id AND pg_cancel_tid=new_cancel->>'tid';
  UPDATE public.refunds SET reason=a.reason,admin_memo=a.admin_memo WHERE id=f.id RETURNING * INTO f;
  UPDATE public.nicepay_refund_attempts SET state='completed',result=jsonb_build_object('success',true,'refund',to_jsonb(f)),updated_at=now() WHERE id=a.id;
  RETURN jsonb_build_object('success',true,'refund',to_jsonb(f));
END $$;

CREATE FUNCTION public.review_nicepay_refund_attempt(p_request_id uuid,p_actor_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' OR NOT EXISTS(SELECT 1 FROM public.admins WHERE id=p_actor_id AND is_active) THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE='42501'; END IF;
  UPDATE public.nicepay_refund_attempts SET state='review',updated_at=now() WHERE id=p_request_id AND actor_id=p_actor_id AND state='started';
END $$;
REVOKE ALL ON FUNCTION public.claim_nicepay_refund_attempt(uuid,uuid,uuid,integer,text,text,jsonb),public.finish_nicepay_refund_attempt(uuid,uuid,jsonb),public.review_nicepay_refund_attempt(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_nicepay_refund_attempt(uuid,uuid,uuid,integer,text,text,jsonb),public.finish_nicepay_refund_attempt(uuid,uuid,jsonb),public.review_nicepay_refund_attempt(uuid,uuid) TO service_role;
COMMIT;
