# Migration Application Record & Live Verification

**Applied:** 2026-10-13 (UTC) to shared project **`bzxohkrxcwodllketcpz`** ("VideoRemix Product", PostgreSQL 17.6).
**Migrations applied (in dependency order, as `postgres` via the Supabase Management API):**

| Version | File | Contents |
|---|---|---|
| `20261014020000` | `20261014020000_agent_execution.sql` | `agentx_runs`, `agentx_tool_executions` (+idempotency unique index), `agentx_approvals`, `agentx_workflow_runs`, `agentx_email_drafts` |
| `20261014020100` | `20261014020100_agentx_crm.sql` | `agentx_contacts`, `agentx_deals`, `agentx_activities`, `agentx_lead_scores`, `agentx_tasks` |

Both were inserted into `supabase_migrations.schema_migrations` (after the prior max `20261014010000`) with their full statement text.

## Pre-apply verification (admin)
- Project ref confirmed; PG 17.6; superuser session.
- **0 pre-existing `agentx_*` objects**; `tenants(id uuid)` and `tenant_members(user_id, tenant_id uuid; FK → tenants(id) ON DELETE CASCADE; FK → auth.users(id))` match the migrations' FKs; RLS enabled on both.
- **Recovery point verified**: `walg_enabled=true`, daily physical backups, most recent **COMPLETED 2026‑10‑13T06:11:47Z** (the authorization precondition).

## Post-apply live verification (actual query results)
| Check | Result |
|---|---|
| `agentx_*` tables | **10** |
| RLS enabled (`relrowsecurity`) | **10/10** |
| Membership policies | **19** |
| Composite same-tenant FKs (`agentx_*_fk`) | **7** (deals→contacts, activities→contacts/deals, lead_scores→contacts, tasks→contacts, tool_executions→runs, approvals→runs) |
| `unique(tenant_id,id)` targets | **4** |
| Indexes | **24** |
| Migration history | `…20261014020000 agent_execution`, `…20261014020100 agentx_crm` |
| Grant check | anon **0** privileges; authenticated **SELECT/INSERT/UPDATE only** (a revoke was required live: the shared DB's default privileges had granted `authenticated` full DML — corrected, and the migration files were updated to revoke-then-grant) |
| Existing shared tables | intact (`tenants`, `videos`, `personalization_outputs`, `voice_projects`…); 274 public tables; nothing modified/dropped |

### Live RLS behavior (role-based tests)
- `set local role anon` → `agentx_contacts` select → **42501 permission denied**.
- `set local role authenticated` (no membership) → **0 rows**.
- `set local role service_role` → bypass (the server-function path).

### Live CRM tool verification (real records, service-role path = the Netlify function's path)
| Operation | Real result |
|---|---|
| create_contact | id `da874780-f3c9-452b-af17-1b78b5a944f7` (tenant A) |
| get_contact read-back | SELFTEST Contact, `lead_score` null → updated |
| update_contact | status → `qualified` |
| update_lead_score | **confirmedScore 82** read back from `agentx_contacts`; **1** `agentx_lead_scores` history row |
| create_deal | id `9de8721d-9b29-4e4b-b397-3991171bd468` |
| update_deal | stage → `proposal`, amount → 2500 |
| create_task | id `d86e8677-299c-4961-9d78-9af79951d139` |
| get_tasks read-back | 1 pending ("SELFTEST follow-up") |
| record_activity | id `a9ff8c95-5bae-4651-9e69-ffde839154e9` |
| tool_execution | id `ace50af8-a579-4044-8a1a-9cfb5a531482` |
| agentx_runs | id `09649365-25df-40b3-8fff-96872a94496f`, `run_ref` bound |
| execution-history read-back | tenant-scoped |

### Live integrity checks
- **Cross-tenant `deal→contact` rejected: 23503** (composite FK).
- **Approval atomicity: first consume 1 → replay 0 → cross-tenant 0**, `run_ref` bound, status `consumed`.
- **Duplicate idempotency_key rejected: 23505**.

Test fixtures (clearly labeled, disposable): tenants `selftest-tenant-a` / `selftest-tenant-b`. Cleanup = `delete from tenants where slug like 'selftest-%'` (cascades only their own agent rows).

## Remaining blocker: authenticated real-mode identity
The shared project's identity provider is **Clerk** — Supabase-native user creation fails (`null value in column "clerk_id" … relation "users"`), and the app's own sign-in is Clerk-based. The agent functions verify a **Supabase** user JWT (`auth.getUser`), which this project cannot mint for the agent console. Real OpenAI execution therefore awaits one of (owner decision): (a) configure Clerk JWT verification in `agents.mjs`/`agent-approvals.mjs` (CLERK_JWKS_URL/issuer) and map Clerk identity → `tenant_members.user_id`, or (b) issue a Supabase session for a test identity, or (c) an owner-approved service token for the activation test. Until then the functions fail closed (401) — they never fall back to demo.

Rollback: both migrations are additive; pre-records rollback = `drop table if exists` the 10 `agentx_*` tables; with records, forward-fix or restore from the verified backup.
