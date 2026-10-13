# Production Preflight, Recovery & Authorization Boundary (Phase 6)

**Status: NOTHING has been applied to the shared production database.** This document is the preflight record and the request for authorization — it is **not** authorization.

## 1. Production database preflight (anonymous-verifiable) — PASS
Performed read-only against live project `bzxohkrxcwodllketcpz` (no keys/rows printed, no writes):

| Check | Result | Evidence |
|---|---|---|
| `tenants` exists; `id` = **uuid**; `name`/`slug` text; `created_at`/`updated_at` timestamptz | **PASS** | `?limit=0` → 200; `?id=eq.zzz` → `22P02 … type uuid` |
| `tenant_members` exists; `id`/`user_id`/`tenant_id` = **uuid**; `tenant_id` → `tenants(id)` | **PASS** | 3× `22P02 uuid`; embed `?select=tenant_id(id)` → 200; negative control `?select=user_id(id)` → PGRST200 (FK edge is real) |
| All 10 `agentx_*` target tables absent | **PASS** | 20/20 probes → `404 PGRST205` (two signals each) |
| No `agentx%` table visible | **PASS** | 13 fuzzy probes → all `404 PGRST205` |
| RLS allows anon query shape; no customer data visible to anon | **PASS** | `tenants`/`tenant_members` `?limit=0` → 200; `tenant_members?select=user_id(id)` with `limit=1` → 0 rows; `tenants` shows a single demo tenant |
| Embedded-Postgres validation of both migrations | **PASS 15/15** | `tests/migrations.mjs` (real SQL; incl. cross-tenant isolation, single-use approvals, idempotency, collision guard, re-run safety) |

## 2. Items that REQUIRE owner admin / service-role access (not verifiable anonymously)
These must be confirmed with admin SQL **before** apply (information_schema and `pg_catalog` are not exposed to the `anon` key):
- **Grants/ACLs** (`information_schema.role_table_grants`, `pg_class.relacl`) — confirm the migration role can create tables/indexes/policies and that `authenticated`/`anon` grants on the new tables are as intended.
- **RLS policy bodies** on existing CRM tables (`pg_policies.qual`/`with_check`) — confirm co-existing apps are unaffected.
- **Constraint definitions** (PK/FK `ON DELETE`, CHECK, nullability) on `tenants`/`tenant_members` — confirm the assumed `on delete cascade` semantics of my `tenant_id` FKs are safe in this DB (my tables cascade from `tenants`; deleting a tenant also requires removing `tenant_members` rows first — verified in staging).
- **Backup / PITR state** and any last-minute concurrent migrations.

## 3. Verified migration & recovery plan
- **Order (run once each):** `20261014020000_agent_execution.sql` → `20261014020100_agentx_crm.sql`.
- **Idempotent:** `create table if not exists` + guarded policies; re-execution verified safe (staging). No `pgcrypto` extension required (built-in `gen_random_uuid()` on PG13+); no `FOREACH` dependency.
- **Additive only:** 10 new `agentx_*` tables + indexes + RLS; nothing existing is created, modified, renamed, or dropped. Co-tenant apps (`workflow_runs`, `tasks`, `jobs`, `leads`, …) are untouched (proven by the decoy test).
- **Recovery:** take a **Supabase backup / PITR snapshot immediately before apply** (recommended even though the change is additive). **After real records exist, do NOT use `DROP TABLE` as a rollback** — that would delete agent data. Rollback in that case is a **forward fix** (or an archive-out-then-drop), plus restore-from-snapshot if a hard revert is required. Pre-records-only rollback = `drop table if exists` the 10 `agentx_*` tables (documented in `docs/production-change-manifest.md`).

## 4. Exact operations awaiting your authorization
1. (Admin) confirm §2 items.
2. Snapshot/backup.
3. Run the two SQL files in order in the Supabase SQL editor (or `psql` as the project admin).
4. Post-apply: create one `SELFTEST` contact in a test tenant, confirm a second tenant cannot read it, confirm a consumed approval cannot be replayed, confirm duplicate `idempotency_key` is rejected, and confirm the 10 tables exist with `relrowsecurity = true`.
5. If anything fails, restore from the snapshot.

## 5. Real agent activation test (ready, not executed)
The in-app **Owner activation self-test** (site → AI Agent Runtime panel → sign in with the app's own form → **Run activation self-test**) is ready and covers: tenant membership resolution, real OpenAI Agents SDK call (rejects simulated output), server-verified approvals, contact creation/retrieval, lead-score update, deal creation/update, task creation, the `qualify_lead` workflow, **read-back of durable `agentx_runs` / `agentx_tool_executions` (real DB IDs)** via `/api/agent-history`, and per-step real tool outputs. All test records are tagged `SELFTEST-<id>` in a dedicated tenant — no customer data. Cross-tenant isolation and approval replay are then verified with a second authorized identity.

**Executing it requires the migrations applied (Step 4) + a signed-in member account.** Neither exists in this environment, so no live results are claimed here — that is the exact remaining owner action.

## 6. Remaining external integrations
Gmail, Google Calendar, Twilio (SMS/WhatsApp/telephony), ElevenLabs voice, and enrichment remain `integration_required` until genuine provider actions succeed.
