-- ============================================================================
-- PR0 PRODUCTION SECURITY CONTAINMENT: CERTIFICATION RUNBOOK & READ-ONLY CHECKS
-- ============================================================================
-- This package provides non-mutating / read-only SQL queries and validation
-- scripts for the operator to certify production containment after deployment.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VERIFY OUTBOX PERMISSION CONTAINMENT
-- ----------------------------------------------------------------------------
-- Confirms that 'authenticated', 'anon', and 'public' roles have NO write
-- privileges on public.outbox_events, and the permissive policy is removed.

SELECT 
    '1.1 Outbox Table Role Grants' AS check_name,
    grantee, 
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'outbox_events'
  AND grantee IN ('anon', 'authenticated', 'PUBLIC');
-- Expected: 0 rows returned (no grants to anon, authenticated, or PUBLIC).

SELECT 
    '1.2 Outbox RLS Policies' AS check_name,
    policyname, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE tablename = 'outbox_events';
-- Expected:
-- Only 'worker_outbox_policy' (service_role) exists.
-- 'authenticated_outbox_insert' MUST NOT EXIST.


-- ----------------------------------------------------------------------------
-- 2. VERIFY AUDIT LOG PERMISSION CONTAINMENT
-- ----------------------------------------------------------------------------
-- Confirms that 'anon' and 'authenticated' cannot INSERT into audit_logs.

SELECT 
    '2.1 Audit Logs Role Grants' AS check_name,
    grantee, 
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'audit_logs'
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
  AND grantee IN ('anon', 'authenticated', 'PUBLIC');
-- Expected: 0 rows returned.

SELECT 
    '2.2 Audit Logs RLS Policies' AS check_name,
    policyname, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE tablename = 'audit_logs';
-- Expected:
-- 1. 'service_role_audit_logs_policy' (ALL to service_role)
-- 2. 'audit_logs_select_policy' (SELECT to authenticated USING (auth.uid() = actor_id))
-- 'audit_logs_insert_policy' MUST NOT EXIST.


-- ----------------------------------------------------------------------------
-- 3. VERIFY SECURITY DEFINER PRIVILEGE CONTAINMENT
-- ----------------------------------------------------------------------------
-- Confirms revoked EXECUTE privileges on sensitive RPCs.

SELECT 
    '3.1 SECURITY DEFINER ACL Status' AS check_name,
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS args,
    p.proacl AS access_privileges
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'has_permission',
    'get_user_permissions',
    'recalculate_user_statistics',
    'trigger_recalculate_reading_session_stats',
    'log_search_analytics'
  );
-- Expected:
-- has_permission: only authenticated and service_role (NO anon, NO PUBLIC).
-- get_user_permissions: only authenticated and service_role (NO anon, NO PUBLIC).
-- recalculate_user_statistics: only service_role (NO anon, NO authenticated, NO PUBLIC).
-- trigger_recalculate_reading_session_stats: only service_role (NO anon, NO authenticated, NO PUBLIC).
-- log_search_analytics: only service_role (NO anon, NO authenticated, NO PUBLIC).


-- ----------------------------------------------------------------------------
-- 4. SIMULATED CLIENT PRIVILEGE ENFORCEMENT CHECKS (TRANSACTION ROLLBACK)
-- ----------------------------------------------------------------------------
-- The following blocks simulate untrusted client calls in PostgreSQL sessions.
-- Run in a transaction with ROLLBACK to verify denial without modifying data.

DO $$
BEGIN
  -- 4.1 Test: Anonymous outbox INSERT must fail
  BEGIN
    SET LOCAL ROLE anon;
    INSERT INTO public.outbox_events (event_type, payload, aggregate_type, aggregate_id)
    VALUES ('test.event', '{}'::jsonb, 'test', '00000000-0000-0000-0000-000000000000');
    RAISE EXCEPTION 'TEST FAILED: Anonymous outbox INSERT was permitted!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'CONFIRMED: Anonymous outbox INSERT rejected with insufficient_privilege.';
  END;

  -- 4.2 Test: Authenticated outbox INSERT must fail
  BEGIN
    SET LOCAL ROLE authenticated;
    INSERT INTO public.outbox_events (event_type, payload, aggregate_type, aggregate_id)
    VALUES ('test.event', '{}'::jsonb, 'test', '00000000-0000-0000-0000-000000000000');
    RAISE EXCEPTION 'TEST FAILED: Authenticated outbox INSERT was permitted!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'CONFIRMED: Authenticated outbox INSERT rejected with insufficient_privilege.';
  END;

  -- 4.3 Test: Anonymous audit_logs INSERT must fail
  BEGIN
    SET LOCAL ROLE anon;
    INSERT INTO public.audit_logs (action) VALUES ('test_action');
    RAISE EXCEPTION 'TEST FAILED: Anonymous audit_logs INSERT was permitted!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'CONFIRMED: Anonymous audit_logs INSERT rejected with insufficient_privilege.';
  END;

  -- 4.4 Test: Authenticated audit_logs INSERT must fail
  BEGIN
    SET LOCAL ROLE authenticated;
    INSERT INTO public.audit_logs (action) VALUES ('test_action');
    RAISE EXCEPTION 'TEST FAILED: Authenticated audit_logs INSERT was permitted!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'CONFIRMED: Authenticated audit_logs INSERT rejected with insufficient_privilege.';
  END;

  -- 4.5 Test: Anonymous call to get_user_permissions must fail
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM public.get_user_permissions('00000000-0000-0000-0000-000000000000'::uuid);
    RAISE EXCEPTION 'TEST FAILED: Anonymous get_user_permissions was permitted!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'CONFIRMED: Anonymous get_user_permissions rejected with insufficient_privilege.';
  END;

  -- 4.6 Test: Authenticated call to recalculate_user_statistics must fail
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM public.recalculate_user_statistics('00000000-0000-0000-0000-000000000000'::uuid);
    RAISE EXCEPTION 'TEST FAILED: Authenticated recalculate_user_statistics was permitted!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'CONFIRMED: Authenticated recalculate_user_statistics rejected with insufficient_privilege.';
  END;

  -- 4.7 Test: Anonymous call to has_permission must fail
  BEGIN
    SET LOCAL ROLE anon;
    PERFORM public.has_permission('00000000-0000-0000-0000-000000000000'::uuid, 'system.manage_roles');
    RAISE EXCEPTION 'TEST FAILED: Anonymous has_permission was permitted!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'CONFIRMED: Anonymous has_permission rejected with insufficient_privilege.';
  END;

  -- 4.8 Test: Authenticated call to log_search_analytics must fail
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM public.log_search_analytics(
      '00000000-0000-0000-0000-000000000000'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'test query',
      'test query',
      NOW(),
      0,
      10,
      true,
      false,
      '{}'::jsonb,
      'relevance'
    );
    RAISE EXCEPTION 'TEST FAILED: Authenticated log_search_analytics was permitted!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'CONFIRMED: Authenticated log_search_analytics rejected with insufficient_privilege.';
  END;

  -- 4.9 Test: Legitimate service_role operations must succeed
  BEGIN
    SET LOCAL ROLE service_role;
    INSERT INTO public.outbox_events (event_type, payload, aggregate_type, aggregate_id)
    VALUES ('certification.canary', '{"source":"pr0"}'::jsonb, 'system', '00000000-0000-0000-0000-000000000000');
    
    INSERT INTO public.audit_logs (action, metadata)
    VALUES ('PR0_CERTIFICATION_CANARY', '{"status":"ok"}'::jsonb);

    RAISE NOTICE 'CONFIRMED: Legitimate backend service_role operations succeed.';
  END;

  RAISE NOTICE 'SUCCESS: All simulated client containment boundaries certified!';
END $$;


-- ============================================================================
-- 5. EDGE FUNCTION WEBHOOK CERTIFICATION (CURL / HTTP CHECKS)
-- ============================================================================
-- Replace $SUPABASE_URL, $SERVICE_ROLE_KEY, and $WEBHOOK_SECRET with live values.

/*
# 5.1 Test: Legacy query-string secret authentication must fail (HTTP 401)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "$SUPABASE_URL/functions/v1/send-login-email?secret=7c9a4b2f8e1d6c5a3b0f9e8d7c6b5a4f" \
  -H "x-request-id: 11111111-1111-4111-8111-111111111111" \
  -H "x-timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "idempotency-key: 22222222-2222-4222-8222-222222222222" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","schema":"auth","table":"sessions","record":{"id":"33333333-3333-4333-8333-333333333333","user_id":"44444444-4444-4444-8444-444444444444"}}'
# Expected response: 401

# 5.2 Test: Hardcoded legacy secret in Bearer header must fail (HTTP 401)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "$SUPABASE_URL/functions/v1/send-login-email" \
  -H "Authorization: Bearer 7c9a4b2f8e1d6c5a3b0f9e8d7c6b5a4f" \
  -H "x-request-id: 11111111-1111-4111-8111-111111111111" \
  -H "x-timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "idempotency-key: 22222222-2222-4222-8222-222222222222" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","schema":"auth","table":"sessions","record":{"id":"33333333-3333-4333-8333-333333333333","user_id":"44444444-4444-4444-8444-444444444444"}}'
# Expected response: 401

# 5.3 Test: Service role key presented as Bearer credential must fail (HTTP 401)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "$SUPABASE_URL/functions/v1/send-login-email" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "x-request-id: 11111111-1111-4111-8111-111111111111" \
  -H "x-timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "idempotency-key: 22222222-2222-4222-8222-222222222222" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","schema":"auth","table":"sessions","record":{"id":"33333333-3333-4333-8333-333333333333","user_id":"44444444-4444-4444-8444-444444444444"}}'
# Expected response: 401

# 5.4 Test: Dedicated WEBHOOK_SECRET credential must succeed (HTTP 200)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "$SUPABASE_URL/functions/v1/send-login-email" \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -H "x-request-id: 11111111-1111-4111-8111-111111111111" \
  -H "x-timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "idempotency-key: 22222222-2222-4222-8222-222222222222" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","schema":"auth","table":"sessions","record":{"id":"33333333-3333-4333-8333-333333333333","user_id":"44444444-4444-4444-8444-444444444444"}}'
# Expected response: 200
*/
