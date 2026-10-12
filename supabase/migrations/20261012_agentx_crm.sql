-- AI Agent Suite: namespaced CRM schema (additive).
--
-- Requires: 20261011_agent_execution.sql (agentx execution tables) and the
-- shared project's existing tenants(id uuid) + tenant_members(user_id, tenant_id).
-- All tables are namespaced `agentx_` so they CANNOT collide with or alter the
-- ~152 tables of other applications in project bzxohkrxcwodllketcpz
-- (verified: contacts/deals/sales_activities/customers and all agentx_* names
-- are absent, so `if not exists` will actually create these).
--
-- Ownership: agent-customer IDs are tenant-scoped. RLS grants access to members
-- of the row's tenant via tenant_members. Service-role writes bypass RLS.
-- (gen_random_uuid() is built-in on modern PostgreSQL; no extension required.)

-- ---------------------------------------------------------------- contacts --
create table if not exists agentx_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  company text,
  status text not null default 'new',
  lead_score int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agentx_contacts_tenant_idx on agentx_contacts (tenant_id);
create unique index if not exists agentx_contacts_email_uidx
  on agentx_contacts (tenant_id, lower(email)) where email is not null;

-- ------------------------------------------------------------------- deals --
create table if not exists agentx_deals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contact_id uuid references agentx_contacts(id) on delete set null,
  title text not null,
  stage text not null default 'prospecting',
  amount numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agentx_deals_tenant_idx on agentx_deals (tenant_id);
create index if not exists agentx_deals_contact_idx on agentx_deals (contact_id);

-- -------------------------------------------------------------- activities --
create table if not exists agentx_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contact_id uuid references agentx_contacts(id) on delete set null,
  deal_id uuid references agentx_deals(id) on delete set null,
  type text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists agentx_activities_tenant_idx on agentx_activities (tenant_id);
create index if not exists agentx_activities_contact_idx on agentx_activities (contact_id);

-- ------------------------------------------------------------ lead  scores --
create table if not exists agentx_lead_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contact_id uuid not null references agentx_contacts(id) on delete cascade,
  score int not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists agentx_lead_scores_contact_idx on agentx_lead_scores (tenant_id, contact_id);

-- ------------------------------------------------------------------- tasks --
create table if not exists agentx_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contact_id uuid references agentx_contacts(id) on delete set null,
  title text not null,
  status text not null default 'pending',
  due_date date,
  created_at timestamptz not null default now()
);
create index if not exists agentx_tasks_tenant_idx on agentx_tasks (tenant_id);
create index if not exists agentx_tasks_contact_idx on agentx_tasks (contact_id);

-- --------------------------------------------------------------------- RLS --
alter table agentx_contacts enable row level security;
alter table agentx_deals enable row level security;
alter table agentx_activities enable row level security;
alter table agentx_lead_scores enable row level security;
alter table agentx_tasks enable row level security;

do $$ begin
  create policy "member select" on agentx_contacts for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_contacts.tenant_id and tm.user_id = auth.uid()));
  create policy "member insert" on agentx_contacts for insert with check (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_contacts.tenant_id and tm.user_id = auth.uid()));
  create policy "member update" on agentx_contacts for update using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_contacts.tenant_id and tm.user_id = auth.uid()));
  create policy "member select" on agentx_deals for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_deals.tenant_id and tm.user_id = auth.uid()));
  create policy "member insert" on agentx_deals for insert with check (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_deals.tenant_id and tm.user_id = auth.uid()));
  create policy "member update" on agentx_deals for update using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_deals.tenant_id and tm.user_id = auth.uid()));
  create policy "member select" on agentx_activities for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_activities.tenant_id and tm.user_id = auth.uid()));
  create policy "member insert" on agentx_activities for insert with check (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_activities.tenant_id and tm.user_id = auth.uid()));
  create policy "member update" on agentx_activities for update using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_activities.tenant_id and tm.user_id = auth.uid()));
  create policy "member select" on agentx_lead_scores for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_lead_scores.tenant_id and tm.user_id = auth.uid()));
  create policy "member insert" on agentx_lead_scores for insert with check (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_lead_scores.tenant_id and tm.user_id = auth.uid()));
  create policy "member update" on agentx_lead_scores for update using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_lead_scores.tenant_id and tm.user_id = auth.uid()));
  create policy "member select" on agentx_tasks for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_tasks.tenant_id and tm.user_id = auth.uid()));
  create policy "member insert" on agentx_tasks for insert with check (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_tasks.tenant_id and tm.user_id = auth.uid()));
  create policy "member update" on agentx_tasks for update using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_tasks.tenant_id and tm.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- ============================ ROLLBACK (owner) ============================
-- Non-destructive; drops ONLY these namespaced agent CRM tables:
--   drop table if exists agentx_tasks, agentx_lead_scores, agentx_activities,
--     agentx_deals, agentx_contacts;
-- (Execution tables in 20261011_agent_execution.sql are rolled back separately.)
