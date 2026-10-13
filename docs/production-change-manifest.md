# Production Change Manifest — AI-Agent Migrations (Owner Authorization Request)

**Target:** shared Supabase project `bzxohkrxcwodllketcpz`
**Source:** PR #2, commit `5b756dd` (`test(agents): actual SQL migration validation on embedded Postgres (Phase 5)`)
**Scope of this document:** the two additive agent-suite migration files, for owner review and approval.

---

## 1. Summary + status

| Item | Status |
|---|---|
| Migrations applied to `bzxohkrxcwodllketcpz` | **NOT APPLIED.** Nothing has been executed against the shared production project. |
| Migrations applied to any live database | **NO.** No live-DB run of any kind has happened. |
| Migration files modified while preparing this manifest | **NO.** Files are reviewed as committed at `5b756dd`. |
| Purpose of this document | The owner's review artifact for the production SQL. **This document is NOT authorization** — see §10. |
| Current gate | **Awaiting explicit owner authorization** (§10). Do not run any SQL until signed off. |

The two migrations are reviewed in full at `supabase/migrations/20261014020000_agent_execution.sql` and
`supabase/migrations/20261014020100_agentx_crm.sql` (read in full for this manifest). They create
**10 additive tables**, all `agentx_`-namespaced. **No existing table is created, modified, dropped, or
renamed**, and neither file writes a single row. Every table carries
`tenant_id uuid not null references tenants(id)`, indexes, timestamps, and membership-based RLS.

**Approval consumption is atomic and single-use** with no DDL: it is the status-guarded UPDATE
`... where tenant_id=$1 and id = any($2) and status='approved'` (Postgres row locking; a replay
re-evaluates the predicate, matches 0 rows). **No pgcrypto extension is required**
(`gen_random_uuid()` is built-in on PostgreSQL ≥ 13) and there is **no FOREACH dependency** — every
policy is created explicitly inside a `do $$ ... exception when duplicate_object then null; end $$;`
block, which makes re-runs safe.

### 1.1 Actual staging results (embedded Postgres — 15/15 PASS)

From `tests/migrations.mjs`, executed against a real embedded Postgres (PGlite — Postgres compiled to
WASM), seeded with a replica of the verified dependency tables (`tenants`, `tenant_members`, and a
`workflow_runs` decoy) plus Supabase `auth.uid()` emulation. Result: **15 of 15 checks PASS**:

1. Both migrations execute cleanly on a fresh DB.
2. All 10 `agentx_*` tables were created.
3. Tenant FKs reference `tenants(id)` on every `agentx_*` table (10 of 10).
4. RLS enabled on all 10 tables, with membership policies present (10 tables RLS-on; ≥ 15 policies).
5. Idempotency + FK-supporting indexes exist; `agentx_tool_exec_idem_uidx` present.
6. The existing `workflow_runs` table is **untouched** — no collision (its `note` column intact;
   `agentx_workflow_runs` created separately with `steps`).
7. Cross-tenant SELECT isolation: user A sees only tenant A contacts.
8. Cross-tenant INSERT rejected by RLS `with check`.
9. A user with no membership sees zero rows.
10. Approval single-use: first consume = 1 row, replay = 0 rows, cross-tenant consume = 0 rows.
11. Duplicate `(tenant, tool, idempotency_key)` rejected (unique violation `23505`).
12. Bad tenant FK and orphan contact FK rejected (`23503`).
13. Contact delete sets `deal.contact_id` to null (`on delete set null`).
14. Tenant delete cascades its `agentx_*` rows — after the shared `tenant_members` rows are removed first.
15. Re-running both migrations is idempotent: no errors, still 10 tables, **0 duplicate policies**.

**CAVEAT — what this staging was and was not:** this was an embedded Postgres seeded with a
*replica of the verified dependency tables* (`tenants`, `tenant_members`, a `workflow_runs` decoy) —
**NOT the live shared DB**, and **no real customer data was copied**. Supabase dev branching was
**not available with the access provided**, so an isolated staging copy of the shared project could
not be spun up. A live-DB staging run on a Supabase branch is therefore **still recommended before
the production apply**.

---

## 2. Exact SQL to execute

Run the two files **once each, in this dependency order**, via the **Supabase Studio SQL editor**
(SQL Editor → New query → paste the full file → Run) or via **psql as the project admin**:

```bash
psql "$DB_URL" -f supabase/migrations/20261014020000_agent_execution.sql
psql "$DB_URL" -f supabase/migrations/20261014020100_agentx_crm.sql
```

Order rationale: file 1 (`20261014020000_agent_execution.sql`) creates the agent-execution tables and the
idempotency index; file 2 (`20261014020100_agentx_crm.sql`) creates the CRM tables, which reference
`tenants(id)` and `agentx_contacts(id)` among themselves. Both reference the pre-existing shared
tables `tenants(id)` and `tenant_members(user_id, tenant_id)`.

**Access discipline (unchanged from prior review):** use a properly scoped administrative connection
or the Studio SQL editor as the project admin — **never** a browser-exposed (anon/publishable) key;
**never** print or log secrets. The full file contents are in the repo; do not retype them by hand —
run the committed files verbatim.

---

## 3. New objects created

### 3.1 From `supabase/migrations/20261014020000_agent_execution.sql` (execution)

**Tables (5):** `agentx_runs`, `agentx_tool_executions`, `agentx_approvals`
(`status` default `pending`; values `pending | approved | consumed | rejected`),
`agentx_workflow_runs`, `agentx_email_drafts` (`status` default `draft`; values `draft | sent | failed`).

**Index (1):**

| Index | Definition |
|---|---|
| `agentx_tool_exec_idem_uidx` | **unique partial index** on `agentx_tool_executions (tenant_id, tool, idempotency_key) where idempotency_key is not null` — enforces one recorded execution per `(tenant, tool, idempotency_key)` so a retried consequential action cannot repeat a real send/update. |

**RLS policies (5, SELECT-only):** one `agentx member read` policy on each of
`agentx_runs`, `agentx_tool_executions`, `agentx_approvals`, `agentx_workflow_runs`,
`agentx_email_drafts`, each of the form:

```sql
exists (select 1 from tenant_members tm
        where tm.tenant_id = <table>.tenant_id and tm.user_id = auth.uid())
```

### 3.2 From `supabase/migrations/20261014020100_agentx_crm.sql` (CRM)

**Tables (5):** `agentx_contacts`, `agentx_deals`, `agentx_activities`, `agentx_lead_scores`,
`agentx_tasks`.

**Indexes (9):**

| Index | On | Columns |
|---|---|---|
| `agentx_contacts_tenant_idx` | `agentx_contacts` | `(tenant_id)` |
| `agentx_contacts_email_uidx` | `agentx_contacts` | `(tenant_id, lower(email)) where email is not null` (unique) |
| `agentx_deals_tenant_idx` | `agentx_deals` | `(tenant_id)` |
| `agentx_deals_contact_idx` | `agentx_deals` | `(contact_id)` |
| `agentx_activities_tenant_idx` | `agentx_activities` | `(tenant_id)` |
| `agentx_activities_contact_idx` | `agentx_activities` | `(contact_id)` |
| `agentx_lead_scores_contact_idx` | `agentx_lead_scores` | `(tenant_id, contact_id)` |
| `agentx_tasks_tenant_idx` | `agentx_tasks` | `(tenant_id)` |
| `agentx_tasks_contact_idx` | `agentx_tasks` | `(contact_id)` |

**RLS policies (15):** three per table — `member select` (USING), `member insert` (WITH CHECK),
`member update` (USING) — on each of `agentx_contacts`, `agentx_deals`, `agentx_activities`,
`agentx_lead_scores`, `agentx_tasks`, all of the same membership form as §3.1. There is **no delete
policy** — deletes remain service-role-only.

### 3.3 Totals

**10 tables, 10 explicitly named indexes (including the idempotency unique partial index), 20 RLS
policies, 0 rows written.** Postgres additionally auto-creates the 10 primary-key constraint indexes
(`agentx_*_pkey`) as part of `primary key` definitions. All DDL is `if not exists`-guarded and all
policy blocks swallow `duplicate_object`, so re-running either file is a no-op.

---

## 4. Existing dependencies

The migrations require these **pre-existing, verified-present** shared tables (verified by read-only
introspection in `docs/schema-compatibility.md`; re-confirm in §6 before apply):

| Dependency | Used for | Verified shape |
|---|---|---|
| `tenants(id)` | FK target of `tenant_id` on all 10 tables | `id` uuid PK, `name`, `slug`, `created_at`, `updated_at` |
| `tenant_members(user_id, tenant_id)` | The EXISTING membership table every RLS policy subqueries — a row is accessible only to members of its tenant | `id` uuid, `user_id` uuid, `tenant_id` uuid → `tenants.id`, `role`, `invited_by`, `invited_at`, `created_at` |

Runtime platform dependencies (not created by these files): `auth.uid()` (Supabase built-in) and
`gen_random_uuid()` (built-in on PostgreSQL ≥ 13). The service role, used for server-side writes,
bypasses RLS by design and is never browser-exposed.

---

## 5. Expected effect on other applications

**NONE.** Both migrations are purely additive and fully namespaced:

- Every created object is prefixed `agentx_`.
- No existing table is read, created, modified, dropped, or renamed; no existing column, index,
  policy, constraint, or row is touched. Neither file contains `drop`, `truncate`, `insert`,
  `update`, `delete`, or any reference to a non-`agentx_` table.
- RLS is enabled **only** on the 10 new tables.
- Intra-suite FKs point only at other new `agentx_`` tables (`agentx_deals.contact_id`,
  `agentx_activities.{contact_id,deal_id}`, `agentx_lead_scores.contact_id`, `agentx_tasks.contact_id`).

Note: `workflow_runs`, `tasks`, and `jobs` **already exist** in the shared project with foreign
shapes (other applications' tables). They are **untouched** by these migrations — this is precisely
why the agent suite uses `agentx_workflow_runs` and `agentx_tasks` instead. The staging run
(check #6) explicitly proved no collision with a `workflow_runs` decoy.

---

## 6. Pre-apply DB checks (read-only — owner runs FIRST)

Run all of these against `bzxohkrxcwodllketcpz` **before** applying anything. All are read-only.

```sql
-- (a) The 10 agentx_* table names must be ABSENT -> expect 0 rows
select table_name from information_schema.tables
 where table_schema = 'public' and table_name like 'agentx_%'
 order by table_name;

-- (a2) No agentx_* indexes or policies may pre-exist either -> expect 0 rows each
select indexname from pg_indexes
 where schemaname = 'public' and indexname like 'agentx_%';
select tablename, policyname from pg_policies
 where schemaname = 'public' and tablename like 'agentx_%';

-- (b) Dependencies present -> both non-null; the two columns must exist
select to_regclass('public.tenants')      as tenants,
       to_regclass('public.tenant_members') as tenant_members;
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'tenant_members'
   and column_name in ('user_id','tenant_id');

-- (c) PostgreSQL >= 13 (gen_random_uuid() built-in; no pgcrypto needed)
show server_version_num;   -- expect >= 130000

-- (d) No other migration in flight creating these names: no active DDL session,
--     and confirm only the two files under supabase/migrations/ create agentx_* objects
select pid, state, left(query, 100) as query
  from pg_stat_activity
 where datname = current_database() and state <> 'idle';
```

**Stop conditions:** if any of (a)/(a2) returns rows, or (b) is null/missing columns, or (c) is
below 130000 — **do not apply**; resolve first. For (d): confirm no other operator/migration is
concurrently creating `agentx_*` objects (in this repo, only
`supabase/migrations/20261014020000_agent_execution.sql` and `supabase/migrations/20261014020100_agentx_crm.sql`
define `agentx_*` objects; all other `agentx_*` references are runtime application code).

---

## 7. Post-apply verification (read-only, then live behavioral checks)

### 7.1 Object checks (read-only)

```sql
-- Count the 10 tables -> expect 10, and list them
select count(*)::int as tables_created from information_schema.tables
 where table_schema = 'public' and table_name like 'agentx_%';
select table_name from information_schema.tables
 where table_schema = 'public' and table_name like 'agentx_%' order by table_name;

-- RLS enabled on all 10 -> expect 10
select relname from pg_class
 where relname like 'agentx_%' and relkind = 'r' and relrowsecurity
 order by relname;

-- Policies -> expect 20 rows (5x "agentx member read" + 5x3 "member select/insert/update")
select tablename, policyname, cmd from pg_policies
 where schemaname = 'public' and tablename like 'agentx_%'
 order by tablename, policyname;

-- Idempotency unique index -> expect exactly 1, partial unique on (tenant_id, tool, idempotency_key)
select indexname, indexdef from pg_indexes where indexname = 'agentx_tool_exec_idem_uidx';
```

Expected rows: `agentx_runs`, `agentx_tool_executions`, `agentx_approvals`, `agentx_workflow_runs`,
`agentx_email_drafts`, `agentx_contacts`, `agentx_deals`, `agentx_activities`, `agentx_lead_scores`,
`agentx_tasks`.

### 7.2 Live behavioral checks

These write a small number of test rows inside the owner's own tenant and then verify isolation.
Run as the project admin; `set local role authenticated` is required because the SQL editor session
otherwise bypasses RLS as superuser. Substitute real uuids for `<tenant-a>`, `<tenant-b>`,
`<user-b-member-of-tenant-b>`.

**Cross-tenant read isolation (tenant B user cannot read tenant A's test contact):**

```sql
-- 1) create the test contact in tenant A (admin)
insert into agentx_contacts (tenant_id, first_name, last_name, email)
values ('<tenant-a>', 'RLS', 'Test', 'rls-isolation-check@example.test')
returning id;   -- remember this id

-- 2) view it AS a tenant-B member -> must NOT appear
begin;
set local role authenticated;
set local request.jwt.claim.sub = '<user-b-member-of-tenant-b>';
select count(*)::int as visible_rows from agentx_contacts
 where email = 'rls-isolation-check@example.test';   -- expect 0
rollback;
```

**Cross-tenant write rejection (RLS with-check):**

```sql
begin;
set local role authenticated;
set local request.jwt.claim.sub = '<user-b-member-of-tenant-b>';
insert into agentx_contacts (tenant_id, first_name)
values ('<tenant-a>', 'MustFail');   -- expect error 42501 (row-level security)
rollback;
```

**Approval single-use (a consumed approval cannot be replayed):**

```sql
-- create + approve (admin)
insert into agentx_approvals (tenant_id, action, status)
values ('<tenant-a>', 'crm:create_contact', 'approved')
returning id;   -- <approval-id>

-- first consume -> expect 1
with u as (update agentx_approvals set status = 'consumed'
            where tenant_id = '<tenant-a>' and id = '<approval-id>' and status = 'approved'
            returning id)
select count(*)::int as consumed from u;

-- replay the same approval -> expect 0
with u as (update agentx_approvals set status = 'consumed'
            where tenant_id = '<tenant-a>' and id = '<approval-id>' and status = 'approved'
            returning id)
select count(*)::int as replayed from u;
```

**Duplicate idempotency_key rejected:**

```sql
insert into agentx_tool_executions (tenant_id, tool, status, idempotency_key)
values ('<tenant-a>', 'send_approved_email', 'completed', 'live-idem-check-1');
-- second identical insert -> expect unique violation 23505 from agentx_tool_exec_idem_uidx
insert into agentx_tool_executions (tenant_id, tool, status, idempotency_key)
values ('<tenant-a>', 'send_approved_email', 'completed', 'live-idem-check-1');
```

**Cleanup (owner-run, after the checks):** delete the test rows created above
(the test contact, its related rows if any, the test approval, and the test tool-execution row) so
the tables are left empty of check artifacts.

---

## 8. Backup & recovery requirements

- **Take a Supabase backup / PITR snapshot before apply** (e.g. confirm PITR is enabled and note the
  recovery window, or trigger an on-demand backup where the plan allows). This is **recommended**.
- **Strict requirement analysis:** the migrations are **additive** — no existing data is read,
  modified, or deleted — so the data-preserving rollback in §9 is sufficient on its own, and a data
  backup of existing tables is **not strictly required** for these additive objects.
- After apply, a `pg_dump --schema-only` diff (before vs. after) should show **exactly** the objects
  in §3 and nothing else — the acceptance proof that nothing else changed.

---

## 9. Rollback (data-preserving, owner-approved)

Drops **only** the 10 `agentx_*` tables. Policies and indexes drop automatically with their tables;
`enable row level security` reverts with the table drop. All ten can be dropped in one statement:

```sql
drop table if exists
  agentx_runs, agentx_tool_executions, agentx_approvals, agentx_workflow_runs, agentx_email_drafts,
  agentx_tasks, agentx_lead_scores, agentx_activities, agentx_deals, agentx_contacts;
```

Or per file (execution and CRM have no cross-file FKs, so either order is dependency-safe; the
CRM group also drops cleanly on its own since `agentx_contacts` is dropped last within it):

```sql
-- execution (20261014020000_agent_execution.sql)
drop table if exists agentx_email_drafts, agentx_workflow_runs,
  agentx_approvals, agentx_tool_executions, agentx_runs;

-- CRM (20261014020100_agentx_crm.sql)
drop table if exists agentx_tasks, agentx_lead_scores, agentx_activities,
  agentx_deals, agentx_contacts;
```

**Data note:** dropping the tables drops their data — but these tables are **new**, so no
pre-existing (customer or co-tenant) data is lost; only data the agent suite itself created since
apply is removed. Every non-`agentx_` object (`tenants`, `tenant_members`, `workflow_runs`, `tasks`,
`jobs`, and the ~152 other tables of other applications) is never referenced by the rollback.

---

## 10. Sign-off block

**This document is the request for authorization, not the authorization itself. No production SQL
may be run until the owner explicitly approves below.**

| Field | Entry |
|---|---|
| Owner name | |
| Decision | ☐ APPROVE apply of both files (§2 order) &nbsp;&nbsp; ☐ REJECT &nbsp;&nbsp; ☐ APPROVE WITH CONDITIONS (state below) |
| Approved target project | `bzxohkrxcwodllketcpz` (shared) |
| Pre-apply checks ( §6 ) completed and passed | ☐ Yes — date/time: |
| Supabase backup / PITR snapshot taken (§8) | ☐ Yes — snapshot ref: |
| Conditions / notes | |
| Signature | |
| Date (UTC) | |

By signing, the owner confirms they have reviewed `supabase/migrations/20261014020000_agent_execution.sql`
and `supabase/migrations/20261014020100_agentx_crm.sql` in full and authorizes executing them once each,
in the §2 order, against the shared project `bzxohkrxcwodllketcpz`.

---

## Remaining live-execution steps (after apply)

After the migrations are applied and §7 verification passes, **the owner signs in to the site's AI
Agent Runtime panel and clicks "Run activation self-test"** (in-app email + password sign-in; the
session token is taken from the app's own Supabase session, held in memory only as an
`Authorization: Bearer …` header — **no token pasting**, never displayed or logged). The self-test
verifies the real stack end-to-end on test records: real OpenAI model call, the CRM write/read path
(runs / approvals / contacts / deals / lead scores / activities / tasks), and the multi-agent
`qualify_lead` workflow with single-use approval consumption. It writes only test records inside the
signed-in user's own tenant and sends no email.

**External providers — Gmail, Google Calendar, Twilio (SMS/WhatsApp/voice), ElevenLabs, and lead
enrichment — remain `integration_required` until connected**; those actions honestly fail closed and
nothing is fabricated. They do not block the CRM/approval path of the self-test.

---

## Explicit non-claims

- Nothing in this manifest was applied to `bzxohkrxcwodllketcpz` or to any other live database.
- No live-DB migration run, RLS test, or agent run against production data has occurred.
- The staging evidence in §1.1 comes from an embedded Postgres seeded with replicas of verified
  dependency tables — not the live shared DB — and no real customer data was used.
- No secrets, keys, tokens, or connection strings were read or printed while producing this document.
- No code, SQL, or migration file was modified while producing this document.

*Sources reviewed: `supabase/migrations/20261014020000_agent_execution.sql`,
`supabase/migrations/20261014020100_agentx_crm.sql`, `tests/migrations.mjs`,
`docs/schema-compatibility.md`, `docs/migration-dryrun.md`. Companion documents:
`docs/phase4-activation.md` (activation state and self-test procedure).*
