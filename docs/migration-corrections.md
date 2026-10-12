# Migration Corrections & Post-Apply Verification (Phase 7)

Status: **corrections complete and validated; NOT applied to production.** PR #2 commit `cbb5b05`→**next** (see PR). Admin preflight had verified PG 17.6, matching uuid keys/FKs, no `agentx_*` tables, existing apps intact — and that **backup recoverability was not yet established** (a hard precondition for apply).

## Corrections implemented
1. **Same-tenant integrity via composite foreign keys** — every `agentx_*` child now enforces `(tenant_id, x_id) → parent(tenant_id, id)`:
   - `agentx_deals.contact_id → agentx_contacts`; `agentx_activities.contact_id → agentx_contacts`, `.deal_id → agentx_deals`; `agentx_lead_scores.contact_id → agentx_contacts`; `agentx_tasks.contact_id → agentx_contacts`; `agentx_tool_executions.run_id → agentx_runs`; `agentx_approvals.run_id → agentx_runs`.
   - Required unique targets added: `agentx_contacts(tenant_id,id)`, `agentx_deals(tenant_id,id)`, `agentx_runs(tenant_id,id)`, `agentx_workflow_runs(tenant_id,id)`.
   - Verified: `composite same-tenant FK constraints exist (7, each 2 columns)`, `composite FK target unique(...) exist`, and behaviorally — cross-tenant `deal→contact` and `activity→contact` inserts rejected (`23503`); reassigning a referenced contact's tenant rejected; deleting a referenced contact rejected until dependents are removed; tool_execution cannot reference another tenant's run.
2. **Individually idempotent policies** — every policy is `drop policy if exists …; create policy …;` (no shared `exception` handler). Verified: 19 policies, zero duplicates after repeated runs.
3. **RLS select/insert/update/with-check** — verified for authenticated members (own-tenant select/insert/update OK), nonmembers (0 rows), cross-tenant insert (`42501`), cross-tenant update (0 rows), and `WITH CHECK` on insert.
4. **Grants** — `revoke all … from anon; grant select, insert, update … to authenticated;` on all 10 tables. Verified: anon has **zero** privileges on `agentx_*` (denied `42501`) while pre-existing anon grants on `tenants`/`tenant_members` are untouched; authenticated has exactly SELECT/INSERT/UPDATE (no DELETE).
5. **Service-role tenant scoping** — all agent CRM/persistence/approval queries filter `tenant_id` from the run context (resolved via `tenant_members`, never `auth.uid()`); no tool performs an unscoped read. Cross-tenant DB references are additionally blocked at the schema level (composite FKs), so even a filtering defect cannot cross tenants at the database.
6. **Atomic, action-bound, execution-bound approvals** — `consumeApprovals` performs a status-guarded `UPDATE … WHERE status='approved'` (atomic under Postgres row locking), sets `run_ref` to the current execution, and returns only the approved actions. Verified: first consume = 1, replay = 0, cross-tenant = 0, `run_ref` bound, and action scoping (approving one action never grants another).
7. **New SQL tests** — cross-tenant contact/deal references, partial migration re-runs (execution-only and CRM-only, each twice), tenant-reassignment attempts, anon grant denial, member CRUD, dependency-blocked deletes, run reference isolation. `tests/migrations.mjs` = **23/23**.
8. **Shared-database finding (NOT changed, owner action)** — during preflight the **existing `tenants` table is anon-readable** (`tenants?limit=0` returned a visible count of 1 demo tenant). Its permissive policy is pre-existing and shared by other applications, so it is intentionally **not modified in this PR**. The `agentx_*` policies do not depend on `tenants` being private (they authorize via `tenant_members`), so functionality is unaffected — but the owner should review those existing policies separately.
9. **Re-run** — embedded-Postgres migrations **23/23 PASS**; all agent suites **9/8/15/7/7/3**; functions **8/8**; `vite build`, `npm ci`-based build, and client-bundle/secrets isolation **4/4** PASS.

## Post-apply verification queries (run after applying, as admin)
```sql
-- objects
select count(*) from information_schema.tables where table_schema='public' and table_name like 'agentx_%';      -- 10
select count(*) from pg_policies where schemaname='public' and tablename like 'agentx_%';                     -- 19
select count(*) from pg_class where relname like 'agentx_%' and relkind='r' and relrowsecurity;              -- 10
select count(*) from pg_constraint where contype='f' and conname like 'agentx_%_fk';                          -- 7 composite
select count(*) from information_schema.role_table_grants where grantee='anon' and table_name like 'agentx_%'; -- 0
-- composite FK enforcement (expect 23503)
insert into agentx_deals (tenant_id, contact_id, title) values ('<tenantB>','<contactInTenantA>','cross');    -- must fail
-- single-use approval (admin): consume twice -> 1 then 0
```
Then run the app's in-app activation self-test (sign in → AI Agent Runtime → Run activation self-test) with `SELFTEST-` records in a dedicated test tenant, and verify with a second test identity that tenant isolation and approval replay protection hold.

## Apply preconditions (owner)
1. **Establish a recovery point** (backup/PITR snapshot) — preflight confirmed recoverability is NOT yet established; do not apply without it.
2. Apply `20261011_agent_execution.sql` then `20261012_agentx_crm.sql` (read-only rehearsal already run on embedded PG).
3. Rollback **only before records exist**: `drop table if exists` the 10 `agentx_*` tables. After real records, forward-fix or restore from snapshot — never drop.
