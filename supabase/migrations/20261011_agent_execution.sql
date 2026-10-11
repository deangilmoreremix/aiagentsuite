-- AI Agent Suite: durable agent-execution persistence.
-- Server-side functions write with the service role (RLS bypassed); the
-- client (anon/authenticated) is limited to SELECT of its own tenant rows.
-- Tenant model here is per-user (tenant_id = auth.uid()); adjust if multi-tenant.

create extension if not exists "pgcrypto";

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
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
  tenant_id uuid,
  run_id uuid,
  agent_key text,
  tool text not null,
  args jsonb,
  result jsonb,
  status text,
  idempotency_key text,
  created_at timestamptz not null default now()
);
create index if not exists tool_executions_idem_idx on tool_executions (tenant_id, tool, idempotency_key);

create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  run_id uuid,
  agent_key text,
  action text not null,
  payload jsonb,
  status text not null default 'pending',
  resolved_by uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists workflow_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  workflow_key text not null,
  status text not null,
  steps jsonb,
  mode text not null default 'real',
  created_at timestamptz not null default now()
);

create table if not exists email_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  contact_id uuid,
  recipient text,
  subject text,
  body text,
  status text not null default 'draft',
  provider_id text,
  created_at timestamptz not null default now()
);

-- Row Level Security: clients can read their own tenant's rows only.
alter table agent_runs enable row level security;
alter table tool_executions enable row level security;
alter table approval_requests enable row level security;
alter table workflow_runs enable row level security;
alter table email_drafts enable row level security;

do $$ begin
  create policy "own tenant read agent_runs" on agent_runs for select using (auth.uid() = tenant_id);
  create policy "own tenant read tool_executions" on tool_executions for select using (auth.uid() = tenant_id);
  create policy "own tenant read approval_requests" on approval_requests for select using (auth.uid() = tenant_id);
  create policy "own tenant read workflow_runs" on workflow_runs for select using (auth.uid() = tenant_id);
  create policy "own tenant read email_drafts" on email_drafts for select using (auth.uid() = tenant_id);
exception when duplicate_object then null; end $$;
