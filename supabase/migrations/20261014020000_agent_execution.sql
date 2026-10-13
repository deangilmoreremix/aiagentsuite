-- AI Agent Suite: durable execution persistence (corrected).
--
-- Owner-authorized (pending), ADDITIVE migration for the SHARED project
-- bzxohkrxcwodllketcpz (PostgreSQL 17.6). Nothing existing is modified.
--
-- Corrections in this version:
--   * Same-tenant referential integrity via COMPOSITE foreign keys
--     (child.tenant_id is forced to equal the parent's tenant_id).
--   * Policy creation is INDIVIDUALLY idempotent (drop policy if exists + create),
--     so one failure cannot silently skip other policies.
--   * Explicit grants: `authenticated` gets only select/insert/update on its own
--     tenant's rows (enforced by RLS); `anon` gets NO access.
--   * Approvals bind to an action AND an execution (run_ref) at consumption.
--
-- Requires existing tables: tenants(id uuid), tenant_members(user_id, tenant_id).
--
-- ROLLBACK (owner, pre-records only): drop table if exists the agentx_* tables.

create table if not exists agentx_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid,
  agent_key text not null,
  status text not null,
  mode text not null default 'real',
  input text,
  result jsonb,
  error text,
  trace_id text,
  idempotency_key text,
  run_ref text,
  created_at timestamptz not null default now(),
  constraint agentx_runs_tenant_uq unique (tenant_id, id)  -- target for composite FKs
);

create table if not exists agentx_tool_executions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  run_id uuid,
  agent_key text,
  tool text not null,
  args jsonb,
  result jsonb,
  status text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  -- a tool execution can only belong to the SAME tenant as its run
  constraint agentx_tool_exec_run_fk foreign key (tenant_id, run_id) references agentx_runs (tenant_id, id) on delete cascade
);

-- Idempotency: a given (tenant, tool, idempotency_key) can only be recorded once,
-- so retries never repeat a consequential action.
create unique index if not exists agentx_tool_exec_idem_uidx
  on agentx_tool_executions (tenant_id, tool, idempotency_key)
  where idempotency_key is not null;

create table if not exists agentx_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  run_id uuid,
  run_ref text,
  agent_key text,
  action text not null,
  payload jsonb,
  status text not null default 'pending', -- pending | approved | consumed | rejected
  resolved_by uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint agentx_approvals_run_fk foreign key (tenant_id, run_id) references agentx_runs (tenant_id, id) on delete set null
);

create table if not exists agentx_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid,
  workflow_key text not null,
  status text not null,
  steps jsonb,
  mode text not null default 'real',
  created_at timestamptz not null default now(),
  constraint agentx_workflow_runs_tenant_uq unique (tenant_id, id)
);

create table if not exists agentx_email_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contact_id uuid,
  recipient text,
  subject text,
  body text,
  status text not null default 'draft',
  provider_id text,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------- RLS --
alter table agentx_runs enable row level security;
alter table agentx_tool_executions enable row level security;
alter table agentx_approvals enable row level security;
alter table agentx_workflow_runs enable row level security;
alter table agentx_email_drafts enable row level security;

-- Individually idempotent: each policy is dropped-then-created on its own.
drop policy if exists "member select" on agentx_runs;
create policy "member select" on agentx_runs for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_runs.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member select" on agentx_tool_executions;
create policy "member select" on agentx_tool_executions for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_tool_executions.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member select" on agentx_approvals;
create policy "member select" on agentx_approvals for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_approvals.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member update" on agentx_approvals;
create policy "member update" on agentx_approvals for update using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_approvals.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member select" on agentx_workflow_runs;
create policy "member select" on agentx_workflow_runs for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_workflow_runs.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member select" on agentx_email_drafts;
create policy "member select" on agentx_email_drafts for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_email_drafts.tenant_id and tm.user_id = auth.uid()));

-- ------------------------------------------------------------------ grants --
revoke all on agentx_runs, agentx_tool_executions, agentx_approvals, agentx_workflow_runs, agentx_email_drafts from anon;
grant select, insert, update on agentx_runs, agentx_tool_executions, agentx_approvals, agentx_workflow_runs, agentx_email_drafts to authenticated;

-- ============================ ROLLBACK (owner) ============================
--   drop table if exists agentx_email_drafts, agentx_workflow_runs,
--     agentx_approvals, agentx_tool_executions, agentx_runs;
