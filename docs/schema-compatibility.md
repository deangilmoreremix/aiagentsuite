# Schema-Compatibility Report: Agent CRM Tools vs. Shared Supabase Project `bzxohkrxcwodllketcpz`

**Status: LIVE-VERIFIED (read-only).** This revision REPLACES all prior static-analysis content in
this file. Every table/column claim below was confirmed against the live shared Supabase project
via read-only introspection. No code was changed, no migration was applied, no rows were read,
and no secrets/keys were printed while producing this report.

---

## 1. How this was verified

| Aspect | Detail |
|---|---|
| Method | Read-only schema introspection of the shared project `bzxohkrxcwodllketcpz` via its anon-accessible PostgREST endpoint (OpenAPI/Swagger schema description). Only table existence and column→type maps were retrieved. |
| Data exposure | None. No table rows were queried; no keys, tokens, or connection strings were read or printed. |
| Result | ~152 tables exist in the project. It hosts a DIFFERENT application (observed: `business_cards`, `voice_projects`, `os_leads`, `jobs`, `node_runs`, …). The repo's assumed CRM tables are absent. |
| Known limitation | The `auth` schema is NOT exposed via anon REST — `auth.users` is not introspectable this way. Nothing below depends on it. |
| Repo cross-checks | Tool/table targets cited from code (`server/agents/tools/crm.mjs`, `server/agents/tools/integrations.mjs`, `server/agents/tools/workflow.mjs`, `server/agents/persistence.mjs`, `server/agents/approvals.mjs`, `netlify/functions/agents.mjs`); migration under review: `supabase/migrations/20261011_agent_execution.sql`. |

**Consequence of the limitation:** claims about `auth.users` structure are explicitly *not* made;
the tenancy model is derived from the public tables in §3 instead.

---

## 2. Verified schema matrix

### 2.1 Tables PRESENT in the shared project (verified columns → types)

| Table | Verified columns → types | Role for this repo |
|---|---|---|
| `tenants` | `id` uuid PK, `name`, `slug`, `created_at`, `updated_at` | **Root tenancy table.** The FK target for every new agent-execution table. |
| `tenant_members` | `id` uuid, `user_id` uuid, `tenant_id` uuid → `tenants.id`, `role`, `invited_by`, `invited_at`, `created_at` | **The user↔tenant membership link.** The ONLY verified way to resolve which tenant(s) an authenticated user belongs to. |
| `user_roles` | `user_id`, `tenant_id` uuid, `role`, `created_at` | Per-tenant role assignment (parallel to `tenant_members`). |
| `workspaces` | `id` text, `name`, `slug`, `settings` json, `owner_id`, `tenant_id` uuid → `tenants.id`, `plan`, … | Workspaces belong to a tenant. |
| `tasks` | `id` text, `workspace_id`, `content`, `is_completed` bool, `completed_at`, `created_by`, `created_at` | **EXISTS but with a foreign shape** (see §2.3 / §4). Task ownership chains `workspace_id → workspaces.tenant_id → tenants.id`. |
| `profiles` | `id` uuid, `tenant_id` uuid, `email`, `full_name`, `role`, … | Tenant-scoped user profile. |
| `leads` | `id` uuid, `tenant_id` uuid, `user_id` uuid, `name`, `email`, `phone`, `message`, `data` json | **EXISTS and is tenant-scoped.** No agent tool currently targets it. |
| `workflow_runs` | `id` uuid, `workflow_id`, `status`, `cost` numeric, `started_at`, `completed_at` | **EXISTS — belonging to another application, with a DIFFERENT SHAPE** than the `workflow_runs` the repo's migration plans to create. Collision — see §4 and `docs/migration-dryrun.md`. |
| `jobs`, `node_runs` | (present; not used by this repo's tools) | Co-tenant application tables; leave untouched. |

### 2.2 Tables ABSENT but EXPECTED by the repo (all return PGRST205)

| Expected table | Expected by | Live status |
|---|---|---|
| `contacts` | crm.mjs tools `search_contacts`, `get_contact`, `create_contact`, `update_contact`, `update_lead_score` | **ABSENT (PGRST205)** |
| `deals` | crm.mjs tools `search_deals`, `update_deal` | **ABSENT (PGRST205)** |
| `sales_activities` | legacy app code (`supabaseClient.ts` `logActivity`) | **ABSENT (PGRST205)** |
| `customers` | legacy migrations (`task_executions.customer_id → customers(id)`, `enhanced_task_executions`) | **ABSENT (PGRST205)** |
| `task_executions` | migration `20250818151037_falling_moon.sql` | **ABSENT (PGRST205)** |
| `enhanced_task_executions` | migration `20250818161747_blue_king.sql` | **ABSENT (PGRST205)** |
| `activities` | crm.mjs `record_activity` (crm.mjs:193) | **Not present in the verified set — treat as ABSENT** until proven otherwise (it was not observed; the repo historically wrote to `sales_activities`, also absent). |
| `agent_runs`, `tool_executions`, `approval_requests`, `email_drafts` | `server/agents/persistence.mjs`, `approvals.mjs`, `integrations.mjs` | **Absent pending the additive migration** (`supabase/migrations/20261011_agent_execution.sql`, NOT yet applied). They were not observed during verification; pre-flight must re-confirm absence before any apply (see migration dry-run doc). |

### 2.3 What this invalidates in the repo's assumptions

1. The entire CRM data model (`contacts`/`deals`/`sales_activities`/`customers`) does not exist in this
   project. Repo code that reads/writes those tables cannot work here as-is.
2. `tasks` exists, but its live shape is `(id text, workspace_id, content, is_completed bool,
   completed_at, created_by, created_at)`. The agent tools assume `tenant_id`, `title`, `status`,
   `due_date`, `contact_id` (crm.mjs:142, 158) — **none of those columns exist** in the live table.
   A `tasks` insert/select from the agent tools fails with column errors, not PGRST205.
3. `workflow_runs` exists with a foreign shape — the migration's `create table if not exists
   workflow_runs (…)` would **silently skip creation** (see migration dry-run doc, §Pre-flight).

---

## 3. Verified ownership model

```
tenants (id uuid PK)                         ← root of all tenancy
  ├──< tenant_members (tenant_id → tenants.id, user_id)   ← user↔tenant membership link
  ├──< user_roles    (tenant_id, user_id, role)
  ├──< workspaces    (tenant_id → tenants.id)
  │     └──< tasks   (workspace_id → workspaces.tenant_id → tenants.id)   ← task ownership chain
  ├──< profiles      (tenant_id)
  └──< leads         (tenant_id, user_id)
```

- **Tenant resolution is membership-based.** An authenticated user's tenant is resolved through
  `tenant_members(user_id, tenant_id)` — *not* by equating the user's id with a tenant id.
- **`auth.users` is not exposed** via anon REST, so no assumption is made about its structure; the
  public `tenant_members` table is the authoritative link.
- **Conclusive: `tenant_id ≠ auth.uid()`.** There is no `customer_id` on `contacts` (the table does
  not exist), and `customers` does not exist. Therefore the repo's current model —
  `tenantId = user.id` (`netlify/functions/agents.mjs:50`, with the comment "per-user tenant
  isolation" at :44) — is **INCORRECT for this project**. Every `.eq('tenant_id', ctx.tenantId)`
  filter in the agent tools currently compares against the auth uid, which matches nothing in this
  schema's tenancy model.
- **Required correction (code-side, separate from any migration):** resolve the tenant for the
  authenticated user via `tenant_members` (e.g. `select tenant_id from tenant_members where
  user_id = auth.uid()`), and use that value everywhere the tools currently pass `ctx.tenantId`.

---

## 4. Impact on the agent CRM tool suite (16 agents; all DB-touching tools)

### 4.1 Tools targeting ABSENT tables → must be treated as PROVISIONING-REQUIRED (PGRST205)

| Tool | Target table (code) | Live result | Handling |
|---|---|---|---|
| `search_contacts` | `contacts` (crm.mjs:41) | PGRST205 | Do not query as if present. Surface `provisioning_required`. |
| `get_contact` | `contacts` (crm.mjs:57) | PGRST205 | Same. |
| `create_contact` | `contacts` (crm.mjs:73) | PGRST205 | Same; already approval-gated, fail-closed. |
| `update_contact` | `contacts` (crm.mjs:90) | PGRST205 | Same. |
| `update_lead_score` | `contacts` (crm.mjs:176) | PGRST205 | Same. |
| `search_deals` | `deals` (crm.mjs:104) | PGRST205 | Same. |
| `update_deal` | `deals` (crm.mjs:124) | PGRST205 | Same. |
| `record_activity` | `activities` (crm.mjs:193) | absent/unverified | Same; note repo's legacy target was `sales_activities`, also absent. |

These 8 tools must **not** be enabled against this project until an **approved provisioning
migration** creates the missing tables (§5). Until then they fail closed with an honest error,
which is the safe default.

### 4.2 Tools targeting a PRESENT table with an INCOMPATIBLE shape

| Tool | Target table | Live reality | Handling |
|---|---|---|---|
| `create_task` | `tasks` (crm.mjs:140-144) | Table EXISTS; columns `workspace_id, content, is_completed, completed_at, created_by` — no `tenant_id`/`title`/`status`/`due_date`/`contact_id` | Insert fails with column errors (not PGRST205). Do **not** alter the shared `tasks` table; repoint/mapping is an owner decision. |
| `get_tasks` | `tasks` (crm.mjs:158) | Same mismatch; `.eq('tenant_id', …)` also fails | Same. |

### 4.3 Tools targeting the new agent-execution tables (absent until the additive migration is approved + applied)

| Tool | Table | Status until migration |
|---|---|---|
| `create_email_draft` | `email_drafts` (integrations.mjs:37) | Absent; tool already degrades to `integration_required`/`draft_unsaved`. |
| `send_approved_email`, `get_email_status`, `record_execution_result` | `tool_executions` (integrations.mjs:19,85; workflow.mjs:52) | Absent; persistence degrades to `{persisted:false}` — fail-closed, no fabricated sends. |
| `create_workflow`, `get_workflow_status` | `workflow_runs` (persistence.mjs:73,89) | **COLLISION:** table exists with a foreign shape (`workflow_id`, `cost`, `started_at`, `completed_at`); `create table if not exists` would no-op and runtime inserts would fail. Must be resolved pre-flight (see migration dry-run doc). |
| `request_approval` | `approval_requests` (persistence.mjs:58) | Absent; client-facing approval flow inert until migration. |

### 4.4 Tables that DO exist and are compatible

- **`tasks`** and **`leads`** exist. `leads` in particular already carries the correct tenancy
  shape (`tenant_id` + `user_id`) and is a natural, schema-compatible target for lead-oriented
  agents — but no agent tool targets it today; adding one is an owner decision, not assumed here.

### 4.5 Required behavior for read-only tools

Read-only actions must surface a **clear `provisioning_required` status** instead of leaking raw
driver errors. Mirror the existing honest-status pattern (`blocked()` at crm.mjs:17-19):

```json
{ "ok": false, "status": "provisioning_required", "table": "contacts", "action": "search_contacts" }
```

Applies to: `search_contacts`, `get_contact`, `search_deals`, `get_tasks` (shape-mismatch — may use
a distinct `schema_mismatch` status), `get_email_status`, `get_workflow_status`. Mutating tools
remain approval-gated and fail-closed regardless. (This is a recommendation; no code was changed.)

### 4.6 Tenancy correction is a blocker for ALL tools

Even after provisioning, the `tenant_id` value written/filtered must be the **tenant resolved via
`tenant_members`**, not `auth.uid()` (§3). Two separate approvals are therefore needed: (a) tenancy
fix in `netlify/functions/agents.mjs`, (b) provisioning migration for the CRM tables.

---

## 5. Compatibility checklist — approval gates before any prod migration

All items require **explicit owner authorization** before any change is applied to the shared
production project:

- [ ] **Owner authorization** to run anything against the shared production DB at all (migrations
      are additive and co-tenant-safe only after the gates below pass; see `docs/migration-dryrun.md`).
- [ ] **Tenancy decision:** approve resolving tenant via `tenant_members(user_id, tenant_id)` and
      the corresponding code change in `netlify/functions/agents.mjs:44-53` (currently
      `tenantId = user.id` — incorrect per §3).
- [ ] **CRM provisioning decision (SEPARATE migration):** approve creating `contacts`, `deals`,
      `sales_activities` — each with `tenant_id uuid references tenants(id)` and membership-based
      RLS — as their own owner-approved step. This is explicitly NOT part of the agent-execution
      migration.
- [ ] **`workflow_runs` collision resolution:** the name already exists in the project with a
      foreign shape; choose rename (e.g. `agent_workflow_runs`, requires a code update in
      `persistence.mjs`) or explicit, owner-approved reuse before any apply.
- [ ] **`tasks` shape decision:** either repoint `create_task`/`get_tasks` to the real
      `tasks`/`workspaces` shape (via `workspace_id` → `workspaces.tenant_id`) or provision a
      distinct agent table. The shared `tasks` table must not be altered.
- [ ] **Pre-flight absence checks** for the five new tables (`agent_runs`, `tool_executions`,
      `approval_requests`, `workflow_runs`, `email_drafts`) — `create table if not exists` silently
      no-ops on a foreign-shaped pre-existing table.
- [ ] **Staging first:** apply to a staging copy of the project, verify, then production.
- [ ] **Least privilege:** run the migration with a properly scoped connection; never from a
      browser-exposed key; never print secrets.
- [ ] **Rollback plan reviewed and rehearsed on staging** (non-destructive, drops only the new
      tables — see `docs/migration-dryrun.md`).
- [ ] **RLS review:** membership-based policies of the form
      `exists (select 1 from tenant_members tm where tm.tenant_id = <table>.tenant_id and
      tm.user_id = auth.uid())`; writes remain service-role-only.

---

*Prepared from live, read-only schema verification. No code, migrations, or configuration were
changed; no secrets were read or printed. Companion document: `docs/migration-dryrun.md`.*
