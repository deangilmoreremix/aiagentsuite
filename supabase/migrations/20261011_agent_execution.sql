-- AI Agent Suite: durable execution persistence (VERIFIED tenancy model).
--
-- Owner-approved, ADDITIVE migration against the SHARED project
-- bzxohkrxcwodllketcpz. Do NOT create unrelated tables; do NOT touch existing
-- app tables. All agent-execution tables are namespaced `agentx_` to avoid
-- collisions with the ~152 existing tables in this shared database
-- (verified collision: `workflow_runs`, `tasks`, `jobs`, etc. already exist).
--
-- Requires existing tables: tenants(id uuid), tenant_members(user_id, tenant_id).
-- RLS is membership-based: auth.uid() may access a row iff they are a member of
-- the row's tenant (NOT the naive tenant_id = auth.uid()).
--
-- ROLLBACK (non-destructive): drop table the agentx_* tables only (see bottom).


create table if not exists agentx_runs (
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

create table if not exists agentx_tool_executions (
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

-- Idempotency for consequential actions: a given (tenant, tool, idempotency_key)
-- can only be recorded once, so retries never repeat a real send/update.
create unique index if not exists agentx_tool_exec_idem_uidx
  on agentx_tool_executions (tenant_id, tool, idempotency_key)
  where idempotency_key is not null;

create table if not exists agentx_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  run_id uuid,
  agent_key text,
  action text not null,
  payload jsonb,
  status text not null default 'pending', -- pending | approved | consumed | rejected
  resolved_by uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists agentx_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  user_id uuid,
  workflow_key text not null,
  status text not null,
  steps jsonb,
  mode text not null default 'real',
  created_at timestamptz not null default now()
);

create table if not exists agentx_email_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  contact_id uuid,
  recipient text,
  subject text,
  body text,
  status text not null default 'draft', -- draft | sent | failed
  provider_id text,
  created_at timestamptz not null default now()
);

-- Row Level Security: accessible only to members of the row's tenant. The
-- server functions also WRITE with the service role (bypasses RLS); these
-- policies protect authenticated/anon client reads.
alter table agentx_runs enable row level security;
alter table agentx_tool_executions enable row level security;
alter table agentx_approvals enable row level security;
alter table agentx_workflow_runs enable row level security;
alter table agentx_email_drafts enable row level security;

do $$ begin
  -- reads scoped to membership in the row's tenant
  create policy "agentx member read" on agentx_runs for select using (
    exists (select 1 from tenant_members tm where tm.tenant_id = agentx_runs.tenant_id and tm.user_id = auth.uid()));
  create policy "agentx member read" on agentx_tool_executions for select using (
    exists (select 1 from tenant_members tm where tm.tenant_id = agentx_tool_executions.tenant_id and tm.user_id = auth.uid()));
  create policy "agentx member read" on agentx_approvals for select using (
    exists (select 1 from tenant_members tm where tm.tenant_id = agentx_approvals.tenant_id and tm.user_id = auth.uid()));
  create policy "agentx member read" on agentx_workflow_runs for select using (
    exists (select 1 from tenant_members tm where tm.tenant_id = agentx_workflow_runs.tenant_id and tm.user_id = auth.uid()));
  create policy "agentx member read" on agentx_email_drafts for select using (
    exists (select 1 from tenant_members tm where tm.tenant_id = agentx_email_drafts.tenant_id and tm.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- NOTE: consequential-action approval consumption is made atomic + single-use
-- by the guarded UPDATE in server/agents/approvals.mjs:
--   update agentx_approvals set status='consumed'
--   where tenant_id=$1 and id = any($2) and status='approved'  -- row-locked
-- Two concurrent transactions cannot both match a row once the first commits
-- (the second re-evaluates status='approved' and matches 0 rows), so an
-- approval cannot be replayed. This SQL assumes no DDL required.

-- ============================ ROLLBACK (owner) ============================
-- Non-destructive: drops ONLY the agent execution tables created above.
--   drop table if exists agentx_email_drafts, agentx_workflow_runs,
--     agentx_approvals, agentx_tool_executions, agentx_runs;
