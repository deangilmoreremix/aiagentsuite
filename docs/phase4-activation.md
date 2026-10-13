# Phase 4 — Agent Activation: Schema Verification, Migrations, Tests, and Production Gating

**Scope of this document:** the verified database state, the two additive (not-yet-applied)
migrations, the updated namespaced CRM tool suite, the static migration dry-run, local test
results, the owner live-test procedure, and the exact production operations that still require
authorization.

**Status of every claimed change below:**

| Claim | Actual state |
|---|---|
| Tables created in project `bzxohkrxcwodllketcpz` | **NONE.** Nothing was applied. |
| `supabase/migrations/20261014020000_agent_execution.sql` | File exists, reviewed, **NOT applied** to any live database. |
| `supabase/migrations/20261014020100_agentx_crm.sql` | File exists, reviewed, **NOT applied** to any live database. |
| A live agent run against production data | **DID NOT HAPPEN.** No live RLS test and no live-DB test was executed. |
| Live verification of the production schema | Read-only introspection only (no rows, no writes, no secrets read or printed). |

The shared project `bzxohkrxcwodllketcpz` hosts ~152 tables belonging to **other** applications
(`business_cards`, `voice_projects`, `os_leads`, `jobs`, `node_runs`, …). Every object the agent
suite adds is therefore namespaced `agentx_` so it can neither collide with nor alter them.

---

## 1. Actual database schema verification

### 1.1 How it was verified

| Aspect | Detail |
|---|---|
| Method | Read-only schema introspection of the shared project `bzxohkrxcwodllketcpz` through its anon-accessible PostgREST endpoint (OpenAPI/Swagger schema description), plus direct `select` probes that return `PGRST205` ("table not found in schema cache") for absent tables. |
| Writes | **None.** Anon reads returned 0 rows; all agent writes must use the service role, which is server-only and never browser-exposed. |
| Secrets | None read, none printed. `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are read from non-`VITE_` server env only (`server/agents/config.mjs:25-26`). |
| Known limitation | `auth.users` is **not exposed** via anon REST. No claim in this document depends on its structure; the tenancy model is derived from the public `tenants` / `tenant_members` tables instead. |
| Result | ~152 tables exist. They belong to a different application. The repo's previously assumed CRM tables (`contacts`, `deals`, `sales_activities`, `activities`, `customers`) are **ABSENT**. |

### 1.2 Tables verified PRESENT

| Table | Verified shape (columns → types) | Relevance |
|---|---|---|
| `tenants` | `id` uuid PK, `name`, `slug`, `created_at`, `updated_at` | **Root tenancy table.** FK target for every `agentx_*` table. |
| `tenant_members` | `id` uuid, `user_id` uuid, `tenant_id` uuid → `tenants.id`, `role`, `invited_by`, `invited_at`, `created_at` | **The user↔tenant membership link** — the authoritative way to resolve an authenticated user's tenant, and the basis of every RLS policy in §2. |
| `workspaces` | `id` **text**, `name`, `slug`, `settings` json, `owner_id`, `tenant_id` uuid → `tenants.id`, `plan`, … | Tenant-scoped. Note `id` is **text**, not uuid — no agentx table references it. |
| `profiles` | `id` uuid, `tenant_id` uuid, `email`, `full_name`, `role`, … | Tenant-scoped user profile. |
| `leads` | `id` uuid, `tenant_id` uuid, `user_id` uuid, `name`, `email`, `phone`, `message`, `data` json | Exists and is tenant-scoped; **no agent tool targets it** (left untouched). |
| `tasks` | `id` text, `workspace_id`, `content`, `is_completed` bool, `completed_at`, `created_by`, `created_at` | **EXISTS with a foreign shape** (no `tenant_id`/`title`/`status`/`due_date`/`contact_id`). This is exactly why the agent suite uses its own `agentx_tasks` instead of the shared `tasks`. |

### 1.3 Tables verified ABSENT (two independent signals each)

| Table | Signal 1 | Signal 2 |
|---|---|---|
| `contacts` | Not in the anon OpenAPI schema description | `select` → `PGRST205` |
| `deals` | Not in the anon OpenAPI schema description | `select` → `PGRST205` |
| `sales_activities` | Not in the anon OpenAPI schema description | `select` → `PGRST205` |
| `activities` | Not in the anon OpenAPI schema description | `select` → `PGRST205` |
| `customers` | Not in the anon OpenAPI schema description | `select` → `PGRST205` |
| **all ten `agentx_*` names** (§2) | Not in the anon OpenAPI schema description | `select` → `PGRST205` |

> **Count note.** An earlier verification pass reported "nine `agentx_*` names absent". That pass
> predates the finalized CRM migration. The complete set of names created by the two files in §2
> is **ten** (`5 + 5`), and all ten are absent. No name collision exists.

**Consequence:** because no `agentx_*` name exists, `create table if not exists` will genuinely
create these tables rather than silently no-op'ing on a foreign-shaped pre-existing table (the
failure mode that the pre-existing, differently shaped `workflow_runs` table would have caused).

### 1.4 Verified tenant model

```
tenants (id uuid PK)                                  ← root of all tenancy
  ├──< tenant_members (user_id uuid, tenant_id uuid → tenants.id, role)
  ├──< user_roles    (user_id, tenant_id uuid, role)         ← fallback resolver
  ├──< workspaces    (tenant_id → tenants.id)
  │     └──< tasks   (workspace_id → workspaces.tenant_id)   ← NOT used by the agent suite
  ├──< profiles      (tenant_id)
  └──< leads         (tenant_id, user_id)                    ← NOT used by the agent suite
```

- Tenant resolution is **membership-based**, implemented in `server/supabase/tenancy.mjs:6-26`:
  `tenant_members` first (oldest membership wins), then `user_roles` as fallback, and `null` when
  the user belongs to no tenant (no silent default tenant is ever invented).
- **`tenant_id` is never assumed equal to `auth.uid()`.** The pre-existing bug described in
  `docs/schema-compatibility.md` §3 (using `user.id` as the tenant id) is corrected: the Netlify
  entry point resolves the tenant via `getTenantIdForUser(user.id)` and returns `403 no_tenant`
  when the authenticated user is a member of no tenant
  (`netlify/functions/agents.mjs:50-58`).

---

## 2. Final additive SQL migrations (both files — NOT applied)

Both files are **purely additive**: they only create `agentx_*` objects, reference the existing
`tenants(id uuid)` table, and enable membership-based RLS. Neither file alters, renames, or drops
any pre-existing object, and neither file writes any row.

### 2.1 `supabase/migrations/20261014020000_agent_execution.sql` — durable execution persistence

`create extension if not exists "pgcrypto";` (for `gen_random_uuid()`).

| # | Object | Kind | Key columns | FK / constraints |
|---|---|---|---|---|
| 1 | `agentx_runs` | table | `id uuid PK default gen_random_uuid()`, `tenant_id uuid not null`, `user_id uuid`, `agent_key text not null`, `status text not null`, `mode text not null default 'real'`, `input text`, `result jsonb`, `error text`, `trace_id text`, `idempotency_key text`, `created_at timestamptz not null default now()` | `tenant_id → tenants(id)` |
| 2 | `agentx_tool_executions` | table | `id uuid PK`, `tenant_id uuid not null`, `run_id uuid`, `agent_key text`, `tool text not null`, `args jsonb`, `result jsonb`, `status text`, `idempotency_key text`, `created_at` | `tenant_id → tenants(id)` |
| 3 | `agentx_tool_exec_idem_uidx` | **unique partial index** on `(tenant_id, tool, idempotency_key) where idempotency_key is not null` | — | **Idempotency:** one row per `(tenant, tool, key)` so a retried consequential action is never re-executed. Queried by `alreadyPerformed()` (`server/agents/persistence.mjs:103-119`). |
| 4 | `agentx_approvals` | table | `id uuid PK`, `tenant_id uuid not null`, `run_id uuid`, `agent_key text`, `action text not null`, `payload jsonb`, `status text not null default 'pending'` (`pending \| approved \| consumed \| rejected`), `resolved_by uuid`, `created_at`, `resolved_at` | `tenant_id → tenants(id)` |
| 5 | `agentx_workflow_runs` | table | `id uuid PK`, `tenant_id uuid not null`, `user_id uuid`, `workflow_key text not null`, `status text not null`, `steps jsonb`, `mode text not null default 'real'`, `created_at` | `tenant_id → tenants(id)` |
| 6 | `agentx_email_drafts` | table | `id uuid PK`, `tenant_id uuid not null`, `contact_id uuid`, `recipient text`, `subject text`, `body text`, `status text not null default 'draft'` (`draft \| sent \| failed`), `provider_id text`, `created_at` | `tenant_id → tenants(id)` |

**RLS (file 1):** `enable row level security` on all five tables. One `agentx member read`
(SELECT) policy per table of the exact form:

```sql
exists (select 1 from tenant_members tm
       where tm.tenant_id = <table>.tenant_id and tm.user_id = auth.uid())
```

The policies are created inside a `do $$ ... exception when duplicate_object then null; end $$;`
block, so the block is re-runnable. The server functions **write** with the service role, which
bypasses RLS; the policies protect authenticated/anon client access.

### 2.2 `supabase/migrations/20261014020100_agentx_crm.sql` — namespaced agent CRM schema

`create extension if not exists "pgcrypto";`

| # | Object | Kind | Key columns | FK / constraints |
|---|---|---|---|---|
| 1 | `agentx_contacts` | table | `id uuid PK`, `tenant_id uuid not null`, `first_name text`, `last_name text`, `email text`, `phone text`, `company text`, `status text not null default 'new'`, **`lead_score int`**, `notes text`, `created_at`, `updated_at timestamptz not null default now()` | `tenant_id → tenants(id) on delete cascade` |
| — | `agentx_contacts_tenant_idx` | index | `(tenant_id)` | — |
| — | `agentx_contacts_email_uidx` | unique index | `(tenant_id, lower(email)) where email is not null` | Per-tenant email uniqueness |
| 2 | `agentx_deals` | table | `id uuid PK`, `tenant_id uuid not null`, `contact_id uuid`, `title text not null`, `stage text not null default 'prospecting'`, `amount numeric`, `created_at`, `updated_at` | `tenant_id → tenants(id) on delete cascade`; `contact_id → agentx_contacts(id) on delete set null` |
| — | `agentx_deals_tenant_idx`, `agentx_deals_contact_idx` | indexes | `(tenant_id)`, `(contact_id)` | — |
| 3 | `agentx_activities` | table | `id uuid PK`, `tenant_id uuid not null`, `contact_id uuid`, `deal_id uuid`, `type text not null`, `note text`, `created_at` | `tenant_id → tenants(id) on delete cascade`; `contact_id → agentx_contacts(id) on delete set null`; `deal_id → agentx_deals(id) on delete set null` |
| — | `agentx_activities_tenant_idx`, `agentx_activities_contact_idx` | indexes | `(tenant_id)`, `(contact_id)` | — |
| 4 | `agentx_lead_scores` | table | `id uuid PK`, `tenant_id uuid not null`, `contact_id uuid not null`, `score int not null`, `reason text`, `created_at` | `tenant_id → tenants(id) on delete cascade`; `contact_id → agentx_contacts(id) on delete cascade` |
| — | `agentx_lead_scores_contact_idx` | index | `(tenant_id, contact_id)` | History lookup |
| 5 | `agentx_tasks` | table | `id uuid PK`, `tenant_id uuid not null`, `contact_id uuid`, `title text not null`, `status text not null default 'pending'`, `due_date date`, `created_at` | `tenant_id → tenants(id) on delete cascade`; `contact_id → agentx_contacts(id) on delete set null` |
| — | `agentx_tasks_tenant_idx`, `agentx_tasks_contact_idx` | indexes | `(tenant_id)`, `(contact_id)` | — |

**RLS (file 2):** `enable row level security` on all five tables, then a `do $$ ... foreach ... $$`
loop that creates **three** policies per table — `member select` (USING), `member insert` (WITH
CHECK), `member update` (USING) — all of the membership form quoted in §2.1. There is **no delete
policy** (deletes remain service-role-only). `exception when duplicate_object then null` makes the
block re-runnable.

### 2.3 Idempotency and atomicity of approval consumption

- **DDL idempotency:** every `create table` / `create index` uses `if not exists`, and every policy
  block swallows `duplicate_object`. Re-running either file is a no-op.
- **Approval atomicity / single-use:** no DDL is required. It is enforced by the guarded UPDATE in
  `server/agents/approvals.mjs:14-25`:

  ```js
  db.from('agentx_approvals')
    .update({ status: 'consumed', resolved_by: userId || null, resolved_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .in('id', ids)
    .eq('status', 'approved')      // row-locked re-evaluation
    .select('id, action, tenant_id')
  ```

  Two concurrent transactions cannot both match the same row: once the first commits `consumed`,
  the second's `status='approved'` predicate matches 0 rows. An approval id therefore cannot be
  replayed, is scoped to the caller's tenant (cross-tenant ids match nothing), and forged/unknown
  ids yield no rows. `resolveApprovals()` returns only the action names of rows actually consumed
  (`server/agents/approvals.mjs:30-38`).

### 2.4 Documented rollback (non-destructive, owner-run)

```sql
-- file 20261014020100_agentx_crm.sql (reverse order to respect FKs)
drop table if exists agentx_tasks, agentx_lead_scores, agentx_activities,
  agentx_deals, agentx_contacts;

-- file 20261014020000_agent_execution.sql
drop table if exists agentx_email_drafts, agentx_workflow_runs,
  agentx_approvals, agentx_tool_executions, agentx_runs;
```

Nothing outside the `agentx_` namespace is touched.

---

## 3. Updated CRM tools (`server/agents/tools/crm.mjs`)

The CRM tool suite now targets **only** `agentx_*` tables. This is mechanically enforced by
`tests/agents-schema.mjs:13-17`, which parses every `.from('…')` call in the file and asserts each
table name matches `/^agentx_/`.

### 3.1 Tool inventory

| Tool | Table(s) | Read / Write | Approval gate |
|---|---|---|---|
| `search_contacts` | `agentx_contacts` | read | — |
| `get_contact` | `agentx_contacts` | read | — |
| `create_contact` | `agentx_contacts` | write | `crm:create_contact` |
| `update_contact` | `agentx_contacts` | write | `crm:update_contact` |
| `search_deals` | `agentx_deals` | read | — |
| `update_deal` | `agentx_deals` | write | `crm:update_deal` |
| **`create_deal`** | `agentx_deals` | write | `crm:create_deal` |
| `create_task` | `agentx_tasks` | write | `crm:create_task` |
| `get_tasks` | `agentx_tasks` | read | — |
| `update_lead_score` | `agentx_contacts` **+** `agentx_lead_scores` | write ×2 | `crm:update_lead_score` |
| `record_activity` | `agentx_activities` | write | `crm:record_activity` |

### 3.2 Namespaced schema and field mapping

- `create_contact` takes a single `name` string and **splits it into `first_name` / `last_name`**
  (`server/agents/tools/crm.mjs:73-81`) to match the `agentx_contacts` columns, instead of writing
  a non-existent `name` column.
- `create_deal` uses `stage` (default `prospecting`) and numeric `amount`, and accepts
  `contactId` → `contact_id` (`crm.mjs:148-154`). It replaces the previous deal-less CRM, where
  only an update path existed.
- `create_task` writes `agentx_tasks` (`tenant_id`, `title`, `status: 'pending'`, `due_date`,
  `contact_id`) — the shared, differently shaped `tasks` table (§1.2) is **never** touched.
- Every query is tenant-scoped with `.eq('tenant_id', ctx.tenantId)`; a missing tenant short-circuits
  with `{ ok:false, status:'error', error:'tenant_required' }` rather than scanning cross-tenant.

### 3.3 Lead-score history

`update_lead_score` (`crm.mjs:197-211`) performs **two** writes:

1. `agentx_contacts.update({ lead_score })` filtered by tenant **and** contact id, returning the
   DB-confirmed value (`select('id, lead_score').single()`), reported as `confirmedScore` — the
   score is only ever reported from what the database actually persisted, never from the model.
2. `agentx_lead_scores.insert({ tenant_id, contact_id, score, reason })` appends the history row.

Honest caveat: the history insert is awaited but its result is not checked, so a history write
failure does not fake or roll back the confirmed contact score (fail-open on history only; the
authoritative score still comes from the DB).

### 3.4 Approval gating (all mutations)

- Every mutating tool calls `needsApproval(ctx, action)` **before** any DB call
  (`crm.mjs:21-26`); without a server-verified approval it returns
  `{ ok:false, status:'awaiting_approval', approvalAction:<action> }` and does **not** write.
- Authorization comes only from `ctx.approvedActions`, which is a `Set` built from
  `consumeApprovals()` — server-verified, tenant-scoped, single-use (`server/agents/approvals.mjs`).
  A client-supplied action-name array is never trusted; `tests/agents-approvals.mjs` includes a
  "client-supplied action-name array is IGNORED (bypass attempt)" case.
- Approvals are created and approved in-app by the owner through
  `netlify/functions/agent-approvals.mjs` (Bearer token → `auth.getUser` → tenant via
  `tenant_members`; only `pending` rows can transition; service-role writes). Approved ids are
  passed as `approvalIds` and consumed server-side inside the run.
- Tools never fabricate a row: if Supabase is not configured they return
  `{ ok:false, status:'integration_required', integration:'supabase', action }` (`crm.mjs:17-19`).

---

## 4. Staging / migration dry-run results

**No isolated staging database is available in this environment.** No staging Supabase project,
no local Postgres with a copy of the shared schema, and no production apply were performed. The
results below are therefore **static verification only**, and an isolated staging run is
**recommended before any apply** (see §7).

| Check | Result | Evidence |
|---|---|---|
| **Name collision** | **PASS — no collision.** All ten `agentx_*` table names, the unique index name `agentx_tool_exec_idem_uidx`, and the nine CRM index names are absent from the project (~152 tables), verified by two independent signals (anon OpenAPI schema description + `PGRST205` select probes). | §1.3 |
| **FK type match** | **PASS.** Every `tenant_id uuid … references tenants(id)` matches the verified `tenants.id uuid` PK. Intra-migration FKs (`agentx_deals.contact_id → agentx_contacts.id`, `agentx_activities.{contact_id,deal_id}`, `agentx_lead_scores.contact_id`, `agentx_tasks.contact_id`) are all uuid→uuid. Note `workspaces.id` is **text** and is deliberately not referenced by any agentx table. | §1.2, §2.1, §2.2 |
| **Dependency order** | **PASS.** `20261014020000_agent_execution.sql` (execution tables) must be applied **before** `20261014020100_agentx_crm.sql`, which references `tenants(id)` and creates `agentx_contacts` (itself referenced by the other four CRM tables). Within file 2, `agentx_contacts` is created before `agentx_deals` / `agentx_activities` / `agentx_lead_scores` / `agentx_tasks`. `pgcrypto` is created idempotently in both files. | §2.2 |
| **Idempotency / re-runnability** | **PASS.** All DDL uses `if not exists`; both policy blocks swallow `duplicate_object`; the unique index is `create unique index if not exists`. Re-running either file is a no-op. | §2.3 |
| **No destructive statements** | **PASS.** Neither file contains `alter table … drop`, `drop table`, `truncate`, `delete`, `insert`, `update`, or any reference to a non-`agentx_` table. `grep` for `create table` returns only the ten `agentx_*` tables. | §2 |
| **RLS enablement** | **PASS (static).** All ten tables get `enable row level security` plus membership-based policies; no policy uses `tenant_id = auth.uid()`. | §2.1, §2.2 |
| **Rollback script** | **PASS (static).** Each file documents a rollback that drops only its own tables, in FK-safe order. | §2.4 |
| **Staging execution** | **NOT PERFORMED — unavailable in this environment.** Requires a throwaway/branch copy of project `bzxohkrxcwodllketcpz` (or a local Postgres seeded with `tenants` + `tenant_members`). | §7 |

---

## 5. RLS & approval test results

### 5.1 Local unit tests (all PASS — executed in this environment)

| Suite | Command | Result |
|---|---|---|
| Agent registry | `node tests/agents-registry.mjs` | **9/9 passed** |
| Orchestrator / workflows | `node tests/agents-orchestrator.mjs` | **8/8 passed** |
| Tools (incl. all 11 CRM tools, gating, honest statuses) | `node tests/agents-tools.mjs` | **15/15 passed** |
| Approvals | `node tests/agents-approvals.mjs` | **7/7 passed** |
| Tenancy | `node tests/agents-tenancy.mjs` | **7/7 passed** |
| Schema contracts | `node tests/agents-schema.mjs` | **3/3 passed** |
| Netlify functions | `node tests/functions.mjs` | **6/6 passed** |
| Secrets / bundle isolation | `node tests/no-secrets.mjs` | **4/4 passed** |
| Production build | `npm run build` | **PASS** (Vite build succeeded; no server/Agents-SDK/service-role code and no source maps in `dist`) |

Key approval cases that pass locally: a valid `tenant + approved` approval authorizes the action
**once**; a **replayed** (already-consumed) approval is **rejected**; a **cross-tenant** approval
id is **rejected**; a forged/unknown id yields nothing; no `approvalIds`/no db yields nothing;
`getRunContext` authorizes only from server-verified `approvedActions`; and a client-supplied
action-name array is ignored. Tenancy cases that pass: resolves from `tenant_members`, falls back
to `user_roles`, returns `null` when the user is in no tenant, and never assumes
`tenant_id = auth.uid()`.

### 5.2 NOT run — must be verified live after the migration is applied

**No live RLS test and no live-DB test was executed** (the migrations are not applied anywhere).

1. **Cross-tenant read isolation:** as a member of tenant A, insert a test `agentx_contacts` row,
   then attempt to read it as a member of tenant B → must return **0 rows**, not the row.
2. **RLS on every table:** repeat the above for `agentx_deals`, `agentx_activities`,
   `agentx_lead_scores`, `agentx_tasks`, `agentx_runs`, `agentx_tool_executions`,
   `agentx_approvals`, `agentx_workflow_runs`, `agentx_email_drafts`.
3. **Write path:** an anon/authenticated-client insert without membership must fail; a
   service-role insert must succeed (service role bypasses RLS by design).
4. **Approval single-use:** approve, consume once (run succeeds), then replay the same id →
   `awaiting_approval`, no second mutation.
5. **Approval cross-tenant:** an approval id minted in tenant A must not authorize any action in
   tenant B.
6. **Idempotency:** replay the same `(tenant, tool, idempotency_key)` →
   `alreadyPerformed()` returns true and no duplicate send/update occurs.
7. **Migration idempotency re-check on the live copy:** apply the files twice and confirm the
   second apply is a no-op and creates no duplicate policies.

---

## 6. Live test instructions (owner)

Pre-requisites, all owner-controlled:

1. The two migrations in §2 are **applied** to the target project (`bzxohkrxcwodllketcpz`), in the
   order in §4. The `agentx_*` tables do not exist in that project today.
2. Server env is configured on the deployment (Netlify env — **never** `VITE_`-prefixed, never
   committed): `OPENAI_API_KEY` (with an allowed model, default `gpt-4o`),
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (`server/agents/config.mjs:7-45`).
3. The signed-in user is a **member of a tenant** in `tenant_members` (otherwise the function
   returns `403 no_tenant`).
4. External providers (Gmail, Google Calendar, Twilio, ElevenLabs, enrichment) remain
   `integration_required` — see §8. They do not block the CRM/approval path of this test.

Procedure:

1. Open the deployed site (the AI Agent Runtime panel is rendered on the home route `/`, in
   `src/pages/CoreInteractionPage.tsx:355`).
2. In the **Owner activation self-test** card, sign in with **email + password** using the in-app
   form. The session token is taken from the app's own Supabase session, held **in memory only** as
   an `Authorization: Bearer …` header, never displayed and never logged.
   (`src/components/AgentRuntimePanel.tsx:74-84`, `src/agents/agentClient.ts:20-27`)
3. Click **Run activation self-test** (`AgentRuntimePanel.tsx:97-133`). It performs, in order:
   1. Creates **six** pending approvals and approves them in-app, one per consequential action the
      test uses: `crm:create_contact`, `crm:update_lead_score`, `crm:create_deal`,
      `crm:update_deal`, `crm:create_task`, `crm:record_activity`. Each row is persisted in
      `agentx_approvals` and consumed server-side exactly once.
   2. Runs a **real** OpenAI check with the `objection_handler` agent (an expensive-product
      objection) and flags the answer **SIMULATED** if it matches `[Demo mode]` or returns
      `completed_demo`.
   3. Runs the multi-agent `qualify_lead` workflow (`ai_sdr` → `lead_scoring` → `ai_ae` →
      `personalized_email`, `server/agents/orchestrator.mjs:122-127`) in `real` mode with the
      approved ids, on a single test contact (Dana Rivera, dana@example.com, +1-555-0100, Acme).
      It scores the lead, opens a test deal and prepares a follow-up email; **no email is sent**.
   4. Prints per-step status, run ids (truncated), tool outputs and any `blockedIntegrations`.

How to read each result:

| Result shown | Meaning | Action |
|---|---|---|
| `completed` on a step | The DB write/read really happened (`confirmedScore` is the value the DB returned). | None. |
| `completed_demo`, or the **SIMULATED — not a real model response!** flag | The model was **not** actually called; `OPENAI_API_KEY` or an allowed model is missing. | Set server env; no production credit was spent. |
| `llm_required` | OpenAI env not configured. | Set `OPENAI_API_KEY`. |
| `integration_required` | An external provider is not configured (e.g. `gmail`, `supabase`). Honest fail-closed, nothing fabricated. | Configure that provider (see §8) or accept the limit. |
| `awaiting_approval` | That consequential action had no server-verified approval at the moment the tool ran (single-use approvals must be fresh for the action being performed). | Re-run so fresh approvals are created and consumed. |
| `unauthenticated` | No Bearer token / invalid session. | Sign in again. |
| `no_tenant` (403) | The signed-in user is not a member of any tenant in `tenant_members`. | Add membership (owner action). |
| `failed` / `error` | Real failure; the message is printed. | Read the message; nothing was faked. |

The self-test writes only test records inside the signed-in user's **own** tenant. It is a
self-contained activation check; it is not a substitute for the cross-tenant RLS checks in §5.2.

---

## 7. Exact production migration operations requiring approval

**Only 13 objects are described in the request; the verified object count is 10 tables plus 10
indexes.** The exact inventory below is taken from the files themselves and is authoritative —
**10 `agentx_*` tables across 2 files** (5 + 5), not 13. The earlier "13 tables" figure is
incorrect and is corrected here so the apply operation is unambiguous.

### 7.1 Objects that will be created

**File `supabase/migrations/20261014020000_agent_execution.sql` (5 tables + 1 index + 5 RLS policies):**
`agentx_runs`, `agentx_tool_executions`, `agentx_approvals`, `agentx_workflow_runs`,
`agentx_email_drafts`, index `agentx_tool_exec_idem_uidx`.

**File `supabase/migrations/20261014020100_agentx_crm.sql` (5 tables + 9 indexes + 15 RLS policies):**
`agentx_contacts`, `agentx_deals`, `agentx_activities`, `agentx_lead_scores`, `agentx_tasks`,
indexes `agentx_contacts_tenant_idx`, `agentx_contacts_email_uidx`, `agentx_deals_tenant_idx`,
`agentx_deals_contact_idx`, `agentx_activities_tenant_idx`, `agentx_activities_contact_idx`,
`agentx_lead_scores_contact_idx`, `agentx_tasks_tenant_idx`, `agentx_tasks_contact_idx`.

**Total: 10 tables, 10 indexes, 20 policies, 1 extension guard. Zero rows. Zero changes to any
existing object.**

### 7.2 Affected database

| Item | Value |
|---|---|
| Project | `bzxohkrxcwodllketcpz` (**shared** — hosts ~152 tables of other applications) |
| Apply method | Owner-run migration / SQL editor with a properly scoped connection; **never** from a browser-exposed key; never print secrets. Apply order: file 1 → file 2. |
| Blast radius | Strictly additive; every created object is prefixed `agentx_`; every table has `tenant_id → tenants(id)` and RLS. Other applications' tables are not referenced. |

### 7.3 Verification plan after apply

1. Create **one test contact** in tenant A (e.g. via `create_contact` with a fresh
   `crm:create_contact` approval, or a direct service-role insert).
2. As a member of **tenant B**, read `agentx_contacts` (and the other nine tables): the test row
   must be **invisible**. Then attempt a write as tenant B: it must be **rejected**.
3. Create+approve an approval in tenant A, consume it once in a real run, then replay the same id:
   the second run must report `awaiting_approval` and produce **no** second mutation row.
4. Confirm `agentx_tool_executions` records the tool call and that a replayed
   `(tenant, tool, idempotency_key)` is blocked by the unique index / `alreadyPerformed()`.
5. Confirm `update_lead_score` writes the contact's `lead_score` **and** appends one
   `agentx_lead_scores` history row.
6. Re-run both migration files and confirm the second apply is a no-op (idempotency).
7. Confirm zero rows exist in every `agentx_*` table other than the intended test records.

### 7.4 Rollback

Non-destructive, owner-run, drops **only** the `agentx_*` tables in FK-safe order (§2.4). No
existing table, column, policy, index, or row of the shared project is affected by either the apply
or the rollback.

---

## 8. Final blockers to real production activation

| # | Blocker | State | Owner action |
|---|---|---|---|
| 1 | **Migration apply authorization.** Neither file has been applied to `bzxohkrxcwodllketcpz` (or anywhere). No staging copy exists in this environment. | **BLOCKING** | Approve and run §7 (ideally staging first, then production), in the documented order. |
| 2 | **A member test account.** A signed-in user who is a row in `tenant_members` is required — otherwise every real run returns `401 unauthenticated` or `403 no_tenant`, and no tenant-scoped RLS/live-DB check can be performed. | **BLOCKING** | Provide/invite one test account with a known `tenant_id`; record it for the §5.2 live checks. |
| 3 | **OpenAI + Supabase server env.** `OPENAI_API_KEY` (model in the allowlist, default `gpt-4o`), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` must be set as non-`VITE_` server env on the deployment. Without them: `llm_required` / `integration_required` and no real run. | **BLOCKING** | Set the three variables; confirm the status chips in the panel read `connected`. |
| 4 | **External providers still `integration_required`:** Gmail (email send), Google Calendar, Twilio (SMS/WhatsApp/telephony), ElevenLabs (voice), lead enrichment. No credentials are configured, so email/SMS/calendar/voice/enrichment actions return honest `integration_required` and never fabricate a send. | **Non-blocking for the CRM/approval path** — blocking only for those specific agents' provider actions. | Decide per provider: configure credentials (OAuth tokens for Gmail/Calendar; API keys/SIDs for Twilio/ElevenLabs/enrichment) or leave the agents gated. |
| 5 | **Live verification after apply.** §5.2 (cross-tenant RLS, approval single-use, idempotency) has not been executed and cannot be until blocker 1 is cleared. | **Pending** | Run §7.3 immediately after apply. |

### Explicit non-claims

- Nothing in this document was applied to production; no migration was executed against any live
  database in this environment.
- No live agent run against production data occurred; the OpenAI check and the `qualify_lead`
  workflow have been executed **only in local unit tests** and are awaiting the owner's live
  self-test (§6).
- No secrets, keys, tokens, or connection strings were read or printed at any point.
- No code, SQL, or migration file was modified while producing this document.

---

*Companion documents: `docs/schema-compatibility.md` (live schema verification),*
*`docs/migration-dryrun.md` (static migration dry-run). This document supersedes both for the*
*`agentx_*`-namespaced CRM migration state described in §2.*
