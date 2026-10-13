# Migration Dry-Run + Rollback Plan — `supabase/migrations/20261014020000_agent_execution.sql` (tenancy-corrected)

**Companion to `docs/schema-compatibility.md`.** This document is a PLAN only. It does not create,
modify, or apply any migration, and no secrets are printed.

> ## ⛔ ACTION GATE — READ FIRST
> **DO NOT apply this (or any) migration to the shared production DB (`bzxohkrxcwodllketcpz`)
> without explicit owner authorization.** The migration, as corrected below, is **additive and safe
> for co-tenant applications** — it creates only new tables and never touches existing ones —
> **but** pre-flight has already verified one **blocking condition**: a table named `workflow_runs`
> **already exists** in this project with a different shape (see §3). That collision MUST be
> resolved by the owner before any apply. Test on a staging copy first.

---

## 1. What the current committed migration does — and the deltas required

### 1.1 Current file (`20261014020000_agent_execution.sql`, 86 lines) — as committed

- `create extension if not exists "pgcrypto"` (line 6).
- Five new tables via `create table if not exists`: `agent_runs`, `tool_executions`,
  `approval_requests`, `workflow_runs`, `email_drafts` (lines 8, 23, 37, 50, 61); one non-unique
  index `tool_executions_idem_idx` (line 35).
- `tenant_id uuid` on each table — **no FK, nullable**; no FK anywhere between the new tables
  (`run_id`, `contact_id` are bare `uuid`).
- RLS enabled on the five new tables only (lines 74-78); SELECT-only policies guarded by
  `do $$ … exception when duplicate_object then null; end $$;` (lines 80-86).
- **Per-user tenancy:** every policy is `using (auth.uid() = tenant_id)`, and the header comment
  (line 4) states "Tenant model here is per-user (tenant_id = auth.uid()); adjust if
  multi-tenant." — **the "adjust" is now required** (see below).

### 1.2 Required deltas for the tenancy-corrected version

| # | Delta | Why (verified evidence) |
|---|---|---|
| 1 | `tenant_id uuid not null references tenants(id)` on all five tables | `tenants` exists (verified) and is the root tenancy table; FK makes mis-scoped inserts impossible. `not null` because every row is tenant-owned. |
| 2 | Replace `auth.uid() = tenant_id` policies with membership-based policies: a row is accessible to `auth.uid()` iff `exists (select 1 from tenant_members tm where tm.tenant_id = <table>.tenant_id and tm.user_id = auth.uid())` | Verified ownership model: `tenant_id ≠ auth.uid()`; membership via `tenant_members` (`docs/schema-compatibility.md` §3). |
| 3 | Keep `email_drafts.contact_id` a **bare nullable `uuid` — no FK** | `contacts` does **not exist** (PGRST205). A `references contacts(id)` constraint would make the whole migration **fail**. The corrected version intentionally adds no reference to any CRM table. |
| 4 | Do **not** create/modify `contacts`, `deals`, `sales_activities` (or `customers`) | Those remain a separate, owner-approved provisioning step (`docs/schema-compatibility.md` §5). This migration is not that step. |
| 5 | (Recommended) Upgrade the idempotency index to a **unique partial** index | Enforces tool-level single-use at the storage layer, not just in application code (`alreadyPerformed`, persistence.mjs:103-118). |
| 6 | (Blocking pre-flight, not a SQL delta) Resolve the `workflow_runs` name collision | A foreign `workflow_runs` already exists (§3); `create table if not exists` silently no-ops and every runtime insert then fails on missing columns. |

`user_id` columns on `agent_runs`/`workflow_runs` stay bare `uuid` (no FK to `auth.users`): the auth
schema is not exposed to introspection, and the existing `tenant_members.user_id` likewise declares
no auth FK — the corrected migration follows the project's established pattern.

---

## 2. Corrected SQL to dry-run (for owner review — NOT written to the repo by this document)

```sql
-- AI Agent Suite: durable agent-execution persistence (tenancy-corrected).
-- Writes use the service role (RLS bypassed); clients are SELECT-only, scoped
-- to tenants the user is a member of via tenant_members.
-- Depends on EXISTING (verified) tables: tenants, tenant_members.
-- Does NOT create or modify contacts / deals / sales_activities / customers.

create extension if not exists "pgcrypto";   -- gen_random_uuid(); no-op if present

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  user_id uuid,
  agent_key text not null,
  status text not null,
  mode text not null default 'real',
  input text,
  result jsonb,
  error text,
  trace_id text,
  idempotency_key text,
  created_at timestamptz not null default now()
);

create table if not exists tool_executions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  run_id uuid,
  agent_key text,
  tool text not null,
  args jsonb,
  result jsonb,
  status text,
  idempotency_key text,
  created_at timestamptz not null default now()
);
-- Storage-enforced single-use for idempotent actions (delta #5).
create unique index if not exists tool_executions_idem_uidx
  on tool_executions (tenant_id, tool, idempotency_key)
  where idempotency_key is not null;

create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  run_id uuid,
  agent_key text,
  action text not null,
  payload jsonb,
  status text not null default 'pending',
  resolved_by uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ⚠ COLLISION GUARD: a foreign-shaped `workflow_runs` already exists in this
-- project. See §3 — resolve (rename to `agent_workflow_runs` is recommended)
-- BEFORE this statement ever runs against the shared DB.
create table if not exists workflow_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  user_id uuid,
  workflow_key text not null,
  status text not null,
  steps jsonb,
  mode text not null default 'real',
  created_at timestamptz not null default now()
);

-- contact_id intentionally has NO foreign key: `contacts` does not exist (PGRST205).
create table if not exists email_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  contact_id uuid,
  recipient text,
  subject text,
  body text,
  status text not null default 'draft',
  provider_id text,
  created_at timestamptz not null default now()
);

-- RLS: clients (authenticated) may SELECT only rows of tenants they belong to.
-- Writes remain service-role-only (bypasses RLS by design, server-side only).
alter table agent_runs        enable row level security;
alter table tool_executions   enable row level security;
alter table approval_requests enable row level security;
alter table workflow_runs     enable row level security;
alter table email_drafts      enable row level security;

-- Guarded policy creation (create policy has no IF NOT EXISTS; the exception
-- guard makes re-runs safe, matching the repo's existing migration style).
do $$ begin
  create policy "tenant read agent_runs" on agent_runs for select to authenticated
    using (exists (select 1 from tenant_members tm
                   where tm.tenant_id = agent_runs.tenant_id
                     and tm.user_id = auth.uid()));
  create policy "tenant read tool_executions" on tool_executions for select to authenticated
    using (exists (select 1 from tenant_members tm
                   where tm.tenant_id = tool_executions.tenant_id
                     and tm.user_id = auth.uid()));
  create policy "tenant read approval_requests" on approval_requests for select to authenticated
    using (exists (select 1 from tenant_members tm
                   where tm.tenant_id = approval_requests.tenant_id
                     and tm.user_id = auth.uid()));
  create policy "tenant read workflow_runs" on workflow_runs for select to authenticated
    using (exists (select 1 from tenant_members tm
                   where tm.tenant_id = workflow_runs.tenant_id
                     and tm.user_id = auth.uid()));
  create policy "tenant read email_drafts" on email_drafts for select to authenticated
    using (exists (select 1 from tenant_members tm
                   where tm.tenant_id = email_drafts.tenant_id
                     and tm.user_id = auth.uid()));
exception when duplicate_object then null; end $$;
```

---

## 3. Dependency order

Execution order is safe because every dependency already exists (verified):

```
1. create extension if not exists pgcrypto          (self-contained; no-op if present)
2. tenants          — EXISTS (verified) ─────────┐  FK target for tenant_id
3. tenant_members   — EXISTS (verified) ─────────┴  RLS policy subquery target
4. create tables: agent_runs → tool_executions → approval_requests → workflow_runs → email_drafts
   (no FKs BETWEEN the new tables — run_id/contact_id stay bare uuid — so intra-batch
    order and rollback order are trivial)
5. index (unique partial) on tool_executions
6. enable RLS on the five new tables (idempotent by nature)
7. create policies (guarded do-block; no drops of anything)
```

No step reads or writes any pre-existing table. No `drop`, `alter … drop column`, or rename
appears anywhere in the plan.

---

## 4. Pre-flight checklist (read-only — run ALL before any apply)

1. **Right target:** confirm the project ref is `bzxohkrxcwodllketcpz` and you are on a
   **staging copy**, not the shared production DB.
2. **Dependencies present:** `select to_regclass('public.tenants'), to_regclass('public.tenant_members');`
   → both must be non-null; confirm `tenant_members` has columns `user_id`, `tenant_id`.
3. **Name collisions (CRITICAL):**
   ```sql
   select to_regclass('public.agent_runs'), to_regclass('public.tool_executions'),
          to_regclass('public.approval_requests'), to_regclass('public.workflow_runs'),
          to_regclass('public.email_drafts');
   ```
   `workflow_runs` is **already verified to exist with a foreign shape**
   (`workflow_id`, `status`, `cost numeric`, `started_at`, `completed_at` — no `tenant_id`/
   `workflow_key`/`steps`). If it remains present at apply time, `create table if not exists`
   silently skips creation and `recordWorkflowRun`/`getWorkflowStatus` (persistence.mjs:73,89)
   fail at runtime with column errors. **Resolve first:** recommended rename of the new table to
   `agent_workflow_runs` (owner decision — it implies a matching one-line code update in
   `persistence.mjs`, which is a code change outside this migration's scope), or explicit
   owner-approved reuse. Reusing the existing table is **not** additive-safe and is not
   recommended.
4. **All five names must otherwise be absent** (any pre-existing foreign-shaped table among the
   other four has the same silent-no-op failure mode).
5. **Policy name check:** `select tablename, policyname from pg_policies where schemaname='public'
   and tablename in ('agent_runs','tool_executions','approval_requests','workflow_runs','email_drafts');`
   — the `duplicate_object` guard tolerates re-runs, but pre-existing foreign policies on these
   names must be reviewed.
6. **Snapshot for diff + rollback proof:** `pg_dump --schema-only` before the dry-run; the
   after-state must differ by exactly the new objects (and nothing else).
7. **Access discipline:** least-privilege administrative connection; never a browser-exposed key;
   never print secrets.

---

## 5. Dry-run procedure (fully reversible — Postgres DDL is transactional)

Run on the staging copy, in one transaction, then **roll back**:

```sql
begin;

-- 1..7 from §2, in order (with the workflow_runs collision resolved per §4.3)
create extension if not exists "pgcrypto";
create table if not exists agent_runs ( ... );          -- etc., as in §2
create unique index if not exists tool_executions_idem_uidx on tool_executions (tenant_id, tool, idempotency_key) where idempotency_key is not null;
alter table agent_runs enable row level security;        -- etc.
do $$ begin create policy ... ; exception when duplicate_object then null; end $$;

-- Inspect while still inside the transaction:
select table_name, column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public'
   and table_name in ('agent_runs','tool_executions','approval_requests','workflow_runs','email_drafts')
 order by table_name, ordinal_position;

select tablename, policyname, cmd, qual
  from pg_policies
 where schemaname = 'public'
   and tablename in ('agent_runs','tool_executions','approval_requests','workflow_runs','email_drafts');

-- Prove tenancy semantics with a scratch check (no real rows required):
--   insert into agent_runs (tenant_id, agent_key, status) values (<real tenant id>, 'dryrun', 'ok');
--   set local role authenticated; set local request.jwt.claim.sub = '<member user id>';
--   select count(*) from agent_runs;                       -- visible: member of that tenant
--   set local request.jwt.claim.sub = '<non-member user id>';
--   select count(*) from agent_runs;                       -- 0 rows: correctly hidden

rollback;   -- DDL is transactional: tables, index, policies, RLS, and the extension
            -- (if it was created by this transaction) all revert. Nothing persists.
```

**Acceptance criteria for the dry-run:** all five `to_regclass` checks non-null after the DDL; the
five `tenant read …` policies present with the membership `EXISTS` qual; the member/non-member
visibility probe returns rows / 0 rows respectively; the post-rollback schema snapshot is identical
to the pre-flight snapshot.

---

## 6. Atomic, single-use approval consumption (documented)

Consequential actions are authorized only by a real `approval_requests` row that (a) belongs to the
caller's tenant, (b) is in state `approved`, and (c) is consumed exactly once
(`server/agents/approvals.mjs:1-26`, `consumeApprovals`). The consumption statement is:

```sql
update approval_requests
   set status = 'consumed', resolved_by = :userId, resolved_at = now()
 where tenant_id = :tenantId
   and id in (:approvalIds)
   and status = 'approved'
 returning id, action, tenant_id;
```

**Why this is atomic and single-use under concurrency:**

1. It is a **single SQL statement**, so Postgres treats it as one atomic unit — there is no
   read-then-write race window between the check and the update.
2. Under the default **READ COMMITTED** isolation, when the `UPDATE` matches a row it takes a
   **row-level lock**. A concurrent transaction attempting the same row blocks on that lock until
   the first transaction commits or aborts.
3. When the blocked transaction acquires the lock, Postgres **re-evaluates the `WHERE` qual
   against the new row version** (EvalPlanQual). The row's `status` is now `consumed`, so
   `status = 'approved'` no longer matches → that transaction updates **0 rows** for it.
4. Therefore **exactly one caller can transition each approval row** `approved → consumed`; the
   others get zero returned rows and their action set stays empty. No `SELECT … FOR UPDATE`,
   advisory lock, or serializable isolation is required.
5. The server counts only the rows actually returned by `returning` (via PostgREST
   `return=representation`), so a forged, cross-tenant, already-consumed, or unknown approval id
   authorizes nothing — the failure mode is **fail-closed** (`consumeApprovals` returns `[]` on any
   error, approvals.mjs:21-24).

**Second layer (delta #5):** the unique partial index on
`tool_executions (tenant_id, tool, idempotency_key) where idempotency_key is not null` makes
idempotent sends (`send_approved_email`, `send_approved_sms`, `send_approved_whatsapp`) single-use
at the storage layer too, complementing the application-level `alreadyPerformed` check
(persistence.mjs:103-118) — a duplicate insert attempt raises a unique violation instead of a
second send record. (Caveat: if any environment already has the non-unique
`tool_executions_idem_idx` from the committed file, drop that index first or use the new name —
noted for the pre-flight review.)

---

## 7. Rollback (NON-DESTRUCTIVE)

**Rule: drop exactly the set of tables this migration CREATED — nothing else, ever.** Because
`create table if not exists` silently no-ops on a pre-existing table, the rollback set is the five
names **minus any that pre-existed** in the §4.3 pre-flight snapshot.

**Clean-case rollback** (valid only when pre-flight confirmed none of the five pre-existed):

```sql
drop table if exists email_drafts;
drop table if exists workflow_runs;       -- only if THIS migration created it (§4.3!)
drop table if exists approval_requests;
drop table if exists tool_executions;
drop table if exists agent_runs;
```

**Collision-safe rollback (recommended):** guard each drop so a pre-existing foreign table is
never touched — for `workflow_runs`, drop only if it carries this migration's marker column:

```sql
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'workflow_runs'
                and column_name = 'workflow_key') then
    drop table workflow_runs;   -- our shape (had workflow_key) → created by us → safe to drop
  end if;                       -- otherwise: pre-existing co-tenant table → LEAVE IT UNTOUCHED
end $$;
```

Properties of the rollback:

- Policies and the index drop **automatically** with their tables; `enable row level security`
  reverts with the table drop.
- No FKs exist between the new tables, so order is irrelevant (reverse-creation order shown anyway).
- `contacts`, `deals`, `sales_activities`, `customers`, `tasks`, `leads`, `tenants`,
  `tenant_members`, `workspaces`, `profiles`, and every other co-tenant table are **never
  referenced** by the rollback.
- `pgcrypto` may remain (it may be used by other objects; dropping it is optional and out of scope).
- Rollback loses only agent-execution data created since apply (runs/tool records/approvals/drafts).

---

## 8. Co-tenant safety statement

The corrected migration is **additive**: it creates only new objects in the `public` schema,
enables RLS only on its own five new tables, touches no existing table/policy/column, and contains
no drops or renames. Co-tenant applications in the shared project are unaffected. Two conditions
nonetheless gate any apply: **(1) explicit owner authorization** — this plan must not be applied to
the shared production DB without it — and **(2) resolution of the pre-existing `workflow_runs`
collision** (§4.3), after which the migration can be dry-run on staging (§5) and, with approval,
applied once, with the §7 rollback available if needed.

---

*Documentation only: no migration was created, modified, or applied; no code was changed; no
secrets were read or printed.*
