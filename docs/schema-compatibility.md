# Schema-Compatibility Report: AI-Agent CRM Tools vs. Existing Shared Supabase DB

**Scope:** Static analysis of the new AI-agent server tools (`server/agents/tools/crm.mjs`, `server/agents/tools/integrations.mjs`, `server/agents/persistence.mjs`) against the EXISTING shared Supabase schema used by the Vite/React app. **No live DB access was used.** Every claim below is either grounded in repo code (cited with `file:line`) or explicitly marked ASSUMED / MUST-VERIFY.

## Method & evidence sources

| Evidence | What it proves |
|---|---|
| `src/services/supabaseClient.ts:125-151` (`getContacts` select) | Live production column list for `contacts` (the app's main read path, used by 8+ services) |
| `src/services/supabaseClient.ts:189-215` (`getDeals` select) | Live production column list for `deals` |
| `src/services/supabaseClient.ts:267-290` (`logActivity`) | The existing activity table is named **`sales_activities`**, with `title`/`description`/`customer_id` |
| `src/services/supabaseClient.ts:121` comment + `supabase/migrations/20250819145252_shy_lantern.sql:1-102` | `contacts` has **no `customer_id`/tenant column**; its RLS is `USING (true)` for `authenticated` AND `anon` (wide open). `deals` has `customer_id`, also `USING (true)` |
| `netlify/functions/agents.mjs:49` | In the NEW system, `tenantId = user.id` (the Supabase auth uid) |
| `src/components/CRMWorkspace.tsx` | **Local mock data only** — contains NO Supabase queries. Not usable as schema evidence (its `contact.name` / `deal.stage` / `deal.value` are TypeScript interface fields, not DB columns) |
| `supabase/migrations/*` (5 earlier files) | Base CRM tables (`contacts`, `deals`, `customers`, `sales_activities`) are **not created in any repo migration** — they were created out-of-band (dashboard or an earlier unreleased migration). Their definitive shape MUST be read from the live DB |

---

## 1. Per-tool column inventory (table + columns; ASSUMED vs CONFIRMED)

Legend: **C** = confirmed by existing app code (live read path); **A** = assumed only; **FIXED** = mismatch corrected in this review (see §5).

### `contacts` tools

| Tool | Table | Columns referenced | Filters | Verdict |
|---|---|---|---|---|
| `search_contacts` | `contacts` | `id`, `first_name` (FIXED), `last_name` (FIXED), `email`, `phone`, `company`, `status`, `lead_score` (FIXED), `created_at` | `.eq('tenant_id')` (**A**), `.or(first_name/last_name/email/company ilike)` | id/email/phone/company/status/created_at **C**; `name`→`first_name/last_name` and `score`→`lead_score` **A→FIXED**; `tenant_id` **A** |
| `get_contact` | `contacts` | `select('*')` — schema-tolerant, no column assumptions | `.eq('tenant_id')` (**A**), `.eq('id')` (**C**) | Safe shape; tenant filter **A** |
| `create_contact` | `contacts` | Insert: `tenant_id` (**A**), `name` (**A**), `email` (**C**), `phone` (**C**), `company` (**C**) | — | `name` will **error** if only `first_name`/`last_name` exist (honest failure, no corruption) |
| `update_contact` | `contacts` | Update: `status` (**C**), `notes` (**C**) | `.eq('tenant_id')` (**A**), `.eq('id')` | Writes are to confirmed columns ✓ |
| `update_lead_score` | `contacts` | Update: `lead_score` (FIXED from `score`); Select: `id`, `lead_score` (FIXED) | `.eq('tenant_id')` (**A**), `.eq('id')` | `score` was **wrong**; `lead_score` **C** |

### `deals` tools

| Tool | Table | Columns referenced | Filters | Verdict |
|---|---|---|---|---|
| `search_deals` | `deals` | `id`, `contact_id`, `title`, `stage_id` (FIXED), `value` (FIXED), `created_at` | `.eq('tenant_id')` (**A**), `.eq('stage_id')` (FIXED), `.ilike('title')` | `stage`→`stage_id`, `amount`→`value` **A→FIXED**; existing app uses `stage_id`/`value` **C**; tenant filter **A** |
| `update_deal` | `deals` | Update passthrough of LLM args: `stage` (**A**), `amount` (**A**) | `.eq('tenant_id')` (**A**), `.eq('id')` | **STILL UNMAPPED** — writes `stage`/`amount`, which the confirmed schema does not have; update will error honestly under `stage_id`/`value`. Needs mapping (see §5) |

### `tasks` tools

| Tool | Table | Columns referenced | Filters | Verdict |
|---|---|---|---|---|
| `create_task` | `tasks` | Insert: `tenant_id`, `title`, `contact_id`, `due_date`, `status='pending'` | — | **ALL ASSUMED.** No `tasks` table exists anywhere in the app or migrations. Nearest real tables: `task_executions` (`task_title`, `execution_status`, `customer_id`, `deadline`) and `enhanced_task_executions`. MUST verify table name/shape — a separate additive migration may be required |
| `get_tasks` | `tasks` | `id`, `title`, `status`, `due_date`, `contact_id` | `.eq('tenant_id')` (**A**), `.eq('status')` | **ALL ASSUMED** |

### `activities` tool

| Tool | Table | Columns referenced | Verdict |
|---|---|---|---|
| `record_activity` | `activities` | Insert: `tenant_id` (**A**), `contact_id` (**C for `sales_activities` only**), `deal_id` (**C for `sales_activities` only**), `type` (**C for `sales_activities`**), `note` (**A**) | Table name `activities` and `note` are **unconfirmed**; the existing app writes `sales_activities` with `title`/`description`/`metadata`/`customer_id` (supabaseClient.ts:267-290). If only `sales_activities` exists, this insert fails (honest error) |

### Integration tools (new, self-consistent)

| Tool | Table | Columns | Verdict |
|---|---|---|---|
| `create_email_draft` (integrations.mjs:37) | `email_drafts` | `tenant_id`, `recipient`, `subject`, `body`, `contact_id`, `status` | **Matches migration exactly** ✓ (new table) |
| `send_approved_email` / `recordTool` (integrations.mjs:19-22) | `tool_executions` | `tenant_id`, `agent_key`, `tool`, `args`, `result`, `status`, `idempotency_key` | **Matches migration exactly** ✓ |
| `get_email_status` (integrations.mjs:85) | `tool_executions` select `tool, status, result, created_at` | ✓ | **Matches migration exactly** ✓ |
| `persistence.mjs` (agent_runs / approval_requests / workflow_runs inserts+selects) | New tables | All columns checked line-by-line against migration | **Match exactly** ✓ |

---

## 2. Assumed vs. confirmed columns — mismatch list

| # | Domain | Agent tool assumes | Existing app actually uses | Evidence | Severity |
|---|---|---|---|---|---|
| 1 | **Tenant key** | `tenant_id` on `contacts`/`deals`/`tasks`/`activities` (every query filters `.eq('tenant_id', …)`) | `contacts`: **no tenant column at all** (code comment: "contacts table doesn't have customer_id"; RLS `USING(true)` for authenticated+anon). `deals`: **`customer_id`**. `sales_activities`: **`customer_id`** | supabaseClient.ts:121, 30-63, 267-275; migration shy_lantern:20-102 | **CRITICAL / UNKNOWN.** If `tenant_id` does not exist on these tables, every CRM tool errors with `column … does not exist` (fail-closed, no data exposure — but tools are non-functional). If `tenant_id` exists with different semantics (e.g., FK to `customers.id`), inserts will violate FK or mis-scope data. **Must verify before enabling** |
| 2 | **Lead score** | `score` | **`lead_score`** (also `ai_score`, `engagement_score`; no `score` anywhere) | supabaseClient.ts:26,135,150; proactiveAssistantService.ts:180; contextualMemoryService.ts:292; personalizedGoalService.ts:386 | **CONFIRMED MISMATCH** — app-wide consumers read `c.lead_score`. Corrected in code (§5) |
| 3 | **Contact name** | `name` (select, `or` filter, insert) | **`first_name` + `last_name`** | supabaseClient.ts:13-14, 127-128; enhancedNLUService.ts:197-199; dataValidationService.ts:194 | **CONFIRMED MISMATCH** — corrected in the read path (§5); `create_contact` insert still sends `name` (see §5) |
| 4 | **Deal stage** | `stage` | **`stage_id`** | supabaseClient.ts:47, 198 (Deal interface + getDeals select) | **CONFIRMED MISMATCH** — fixed in `search_deals`; `update_deal` still writes `stage` unmapped |
| 5 | **Deal amount** | `amount` | **`value`** | supabaseClient.ts:45, 196 | **CONFIRMED MISMATCH** — fixed in `search_deals`; `update_deal` still writes `amount` unmapped |
| 6 | **Activities table** | `activities` table, `note` column | **`sales_activities`** table with `title`, `description`, `metadata`, `customer_id` | supabaseClient.ts:267-290 | **CONFIRMED MISMATCH (probable)** — unless a separate `activities` table also exists |
| 7 | **Tasks table** | `tasks` (title/due_date/status/tenant_id) | No `tasks` table in app/migrations; only `task_executions`, `enhanced_task_executions` (different shapes) | migrations 20250818151037, 20250818161747 | **UNKNOWN** — new table may be needed (additive migration) |
| 8 | Deal stage semantics | stage is a plain text enum (`'discovery'`, `'demo'`, …) | `stage_id` may be a text key or an FK to a `stages` table | not determinable statically | Minor — `.eq('stage_id', <text>)` works if text; MUST verify if it is a uuid FK (then LLM-supplied stage strings cannot be used directly) |

**Bottom line on the two headline questions:** the tenant column is **NOT `tenant_id` on existing CRM tables** (contacts has none; deals uses `customer_id`) — this is the #1 uncertainty; and the lead-score column is **`lead_score`, not `score`** — confirmed by five independent app files.

---

## 3. Additive-safety review of `supabase/migrations/20261011_agent_execution.sql`

**Verdict: ADDITIVE-SAFE.** Full line-by-line check (86 lines):

- Creates exactly five **new** tables: `agent_runs`, `tool_executions`, `approval_requests`, `workflow_runs`, `email_drafts`.
- **No name collisions** with existing shared tables. Existing table inventory from prior migrations + app code: `contacts`, `deals`, `customers`, `communications`, `sales_activities`, `task_executions`, `enhanced_task_executions`, `enhanced_task_templates`, `agent_task_logs`, `agent_coordination_logs`, `agent_coordination_events`, `task_business_outcomes`, `task_templates`, `conversation_contexts`, `conversation_messages`, `user_business_profiles`, `proactive_suggestions`, `ai_insights_enhanced`, `personalized_goal_recommendations`, `app_content_metadata`. Note `tool_executions` (new) vs `task_executions` (existing) are distinct names — no overlap.
- `create extension if not exists "pgcrypto"` ✓ (line 6).
- `create table if not exists` on all five tables ✓ (lines 8, 23, 37, 50, 61) + `create index if not exists tool_executions_idem_idx` ✓ (line 35).
- Idempotent policy guard: all five policies wrapped in `do $$ begin … exception when duplicate_object then null; end $$;` ✓ (lines 80-86).
- RLS is enabled **only on the five new tables** (lines 74-78) — it does not touch `contacts`/`deals` policies; other apps' behavior is unchanged.
- **No `drop table`, no `drop policy`, no `alter table … drop column`, no renames anywhere in the file.** It does NOT drop or rename anything.

Caveats (do not affect additive-safety, but matter pre-flight):

1. `create table if not exists` **silently no-ops** if a table of the same name already exists in the live DB with a different shape (generic names like `tool_executions` are plausible). If that happens, inserts will fail at runtime with column errors. **MUST verify pre-existence (with authorization) before applying.**
2. `alter table … enable row level security` is idempotent by nature (no guard needed).
3. The `do $$` block assumes the `public` schema/default `search_path` — consistent with all prior migrations.

---

## 4. RLS assessment

- The migration uses **per-user tenancy**: `auth.uid() = tenant_id` on all five new tables, with the migration's own comment "Tenant model here is per-user (tenant_id = auth.uid()); adjust if multi-tenant" (line 4).
- This is **internally consistent with the new agent system**: `netlify/functions/agents.mjs:49` sets `tenantId = user.id` (the verified auth uid), and service-role writes bypass RLS while browser clients are SELECT-only per policy.
- **It must NOT be assumed to match the existing CRM schema's tenant model**, which is materially different: `contacts` has no tenant column and is readable by `authenticated` **and `anon`** roles (`USING (true)`), and `deals` is likewise `USING (true)` with a `customer_id` column. The shared DB therefore mixes a permissive/open legacy model with the new per-user model.
- **If the live schema uses a different tenant model** (e.g., organizations with a membership table), two adjustments are needed: (a) migration policies should join the membership table (e.g., `organization_id in (select org_id from memberships where user_id = auth.uid())`) instead of `auth.uid() = tenant_id`; (b) the CRM tools' `.eq('tenant_id', …)` filters must target the real tenant column (§2, row 1). Until verified, the current fail-closed behavior (errors when the column is missing) is the safe default — do not weaken the filters.
- Recommendations (safe, optional): add `to authenticated` to the new policies to make intent explicit; keep writes service-role-only; do **not** retrofit tenant columns onto shared CRM tables in this migration (that would be a breaking change for other applications).

---

## 5. Defensive code changes

### 5a. Already applied to `server/agents/tools/crm.mjs` (minimal, additive — no other file touched)

1. **`search_contacts`** (crm.mjs:41-42): select and `or`-filter narrowed to columns the existing app already relies on — `id, first_name, last_name, email, phone, company, status, lead_score, created_at`, filtering on `first_name/last_name/email/company` instead of the unconfirmed `name`/`score`.
2. **`search_deals`** (crm.mjs:104-105): select/filter uses `stage_id`/`value` (confirmed app columns) instead of `stage`/`amount`.
3. **`update_lead_score`** (crm.mjs:176-178): writes and confirms **`lead_score`** instead of `score`, matching every existing consumer of the column.

Rationale: all three edits use only columns present in the existing app's live queries, so they fail-closed (honest DB error) rather than silently writing to columns nothing reads. Tool contracts, approval gating, and error handling are unchanged. `tests/agents-tools.mjs` exercises only the unconfigured-Supabase path (blocked before any query), so it is unaffected.

### 5b. Recommended next defensive changes (NOT applied — require live verification or a behavior decision)

- **`update_deal`**: map `stage`→`stage_id` and `amount`→`value` in the update patch (mirroring §5a-2), so writes land on confirmed columns. Deferred because the mapping direction should be confirmed against the live schema first.
- **`create_contact`**: either split the LLM `name` arg into `first_name`/`last_name`, or verify a `name` column exists. Never insert a column that may not exist.
- **`record_activity`**: verify whether `activities` exists or the target should be `sales_activities` (`title`/`description`/`customer_id`); do not insert `note` until confirmed.
- **`create_task`/`get_tasks`**: verify `tasks` exists (name + columns); if not, add it via a **separate additive migration** (`create table if not exists tasks …`) — do not overload `task_executions`.
- **Keep the `.eq('tenant_id', …)` filters on all tools** until the real tenant column is verified (§2 row 1). Removing them would be a security regression; keeping them fails closed.
- Reads/writes already confirm rows via `.select()` after insert/update; `.single()` surfaces a PostgREST error when 0 rows match, which the tools return honestly — keep this pattern.
- Minor hardening (out of scope, noted): `args.query` is interpolated directly into the `or(...)` filter string (crm.mjs:42); `,`/`(`/`)` in the input can distort the filter. Prefer escaping or per-field `.or()` calls.

---

## 6. Rollback

Because the migration is **additive-only** (five new tables, no drops/renames/alters to anything existing), rollback is simply dropping the new tables — policies and the index are dropped automatically with their tables:

```sql
drop table if exists email_drafts;
drop table if exists workflow_runs;
drop table if exists approval_requests;
drop table if exists tool_executions;
drop table if exists agent_runs;
```

No foreign keys are defined between the new tables, so order is irrelevant. `pgcrypto` may remain (it may be used by other tables; dropping it is optional). Rolling back loses only agent-execution data (drafts/runs/approvals) since apply — no CRM table, policy, or column belonging to other applications is touched.

---

## 7. MUST verify against the live DB (with authorization, least privilege, no secrets printed)

1. Column lists (via `information_schema.columns`) for: `contacts`, `deals`, `customers`, `sales_activities`, and whether `tasks` / `activities` exist at all.
2. The real tenant key on each existing CRM table: `tenant_id`? `customer_id`? `organization_id`? none (§2 row 1 — highest priority).
3. `contacts`: `name` vs `first_name`/`last_name`; `score` vs `lead_score`/`ai_score`.
4. `deals`: `stage` vs `stage_id`; `amount` vs `value`; whether `stage_id` is text or a uuid FK to a stages table.
5. `tasks`: existence and shape (columns, NOT NULLs, tenant key).
6. Activities: `activities` vs `sales_activities`; `note` vs `description`/`title`; NOT NULL columns and defaults.
7. Whether the five new tables (`agent_runs`, `tool_executions`, `approval_requests`, `workflow_runs`, `email_drafts`) **already exist** (created out-of-band) and, if so, that their columns/types match the migration — otherwise `create table if not exists` will skip creation and all agent inserts will fail.
8. Key types (`id`, `contact_id`, `tenant_id`: uuid vs text) so the code's uuid-shaped values line up.
9. The intended production tenant model (per-user `auth.uid()` vs organization/membership) before trusting the RLS policies.
10. Whether `contacts` is intentionally readable by `anon` in the shared DB (security posture; informs whether agent CRM tools should additionally scope by tenant in SQL).
11. Existing policy names on the new tables (the `duplicate_object` guard makes re-runs safe, but confirm no conflicting pre-existing policies).
12. Confirm applying migration `20261011_agent_execution.sql` in a staging/staging-copy first, then production; never from a browser-exposed key.

---

*Prepared by static analysis only. No migrations were run, no secrets read or printed, and no files other than this report and `server/agents/tools/crm.mjs` (three minimal edits, §5a) were modified.*
