-- AI Agent Suite: namespaced CRM schema (corrected).
--
-- Owner-authorized (pending), ADDITIVE migration for the SHARED project
-- bzxohkrxcwodllketcpz (PostgreSQL 17.6). Requires 20261011_agent_execution.sql
-- semantics (tenants/tenant_members + agentx_contacts target). Additive only.
--
-- Corrections: same-tenant COMPOSITE foreign keys ((tenant_id, x_id) must match
-- the parent's (tenant_id, id)); individually idempotent policies; explicit
-- grants (authenticated select/insert/update; anon none).

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
  updated_at timestamptz not null default now(),
  constraint agentx_contacts_tenant_uq unique (tenant_id, id)
);
create index if not exists agentx_contacts_tenant_idx on agentx_contacts (tenant_id);
create unique index if not exists agentx_contacts_email_uidx on agentx_contacts (tenant_id, lower(email)) where email is not null;

-- ------------------------------------------------------------------- deals --
create table if not exists agentx_deals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contact_id uuid,
  title text not null,
  stage text not null default 'prospecting',
  amount numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agentx_deals_tenant_uq unique (tenant_id, id),
  -- a deal may only reference a contact IN THE SAME TENANT (composite FK)
  constraint agentx_deals_contact_fk foreign key (tenant_id, contact_id) references agentx_contacts (tenant_id, id)
);
create index if not exists agentx_deals_tenant_idx on agentx_deals (tenant_id);
create index if not exists agentx_deals_contact_idx on agentx_deals (contact_id);

-- -------------------------------------------------------------- activities --
create table if not exists agentx_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contact_id uuid,
  deal_id uuid,
  type text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint agentx_activities_contact_fk foreign key (tenant_id, contact_id) references agentx_contacts (tenant_id, id),
  constraint agentx_activities_deal_fk foreign key (tenant_id, deal_id) references agentx_deals (tenant_id, id)
);
create index if not exists agentx_activities_tenant_idx on agentx_activities (tenant_id);
create index if not exists agentx_activities_contact_idx on agentx_activities (contact_id);

-- ------------------------------------------------------------ lead  scores --
create table if not exists agentx_lead_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contact_id uuid not null,
  score int not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint agentx_lead_scores_contact_fk foreign key (tenant_id, contact_id) references agentx_contacts (tenant_id, id) on delete cascade
);
create index if not exists agentx_lead_scores_contact_idx on agentx_lead_scores (tenant_id, contact_id);

-- ------------------------------------------------------------------- tasks --
create table if not exists agentx_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contact_id uuid,
  title text not null,
  status text not null default 'pending',
  due_date date,
  created_at timestamptz not null default now(),
  constraint agentx_tasks_contact_fk foreign key (tenant_id, contact_id) references agentx_contacts (tenant_id, id)
);
create index if not exists agentx_tasks_tenant_idx on agentx_tasks (tenant_id);
create index if not exists agentx_tasks_contact_idx on agentx_tasks (contact_id);

-- --------------------------------------------------------------------- RLS --
alter table agentx_contacts enable row level security;
alter table agentx_deals enable row level security;
alter table agentx_activities enable row level security;
alter table agentx_lead_scores enable row level security;
alter table agentx_tasks enable row level security;

drop policy if exists "member select" on agentx_contacts;
create policy "member select" on agentx_contacts for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_contacts.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member insert" on agentx_contacts;
create policy "member insert" on agentx_contacts for insert with check (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_contacts.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member update" on agentx_contacts;
create policy "member update" on agentx_contacts for update using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_contacts.tenant_id and tm.user_id = auth.uid()));

drop policy if exists "member select" on agentx_deals;
create policy "member select" on agentx_deals for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_deals.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member insert" on agentx_deals;
create policy "member insert" on agentx_deals for insert with check (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_deals.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member update" on agentx_deals;
create policy "member update" on agentx_deals for update using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_deals.tenant_id and tm.user_id = auth.uid()));

drop policy if exists "member select" on agentx_activities;
create policy "member select" on agentx_activities for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_activities.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member insert" on agentx_activities;
create policy "member insert" on agentx_activities for insert with check (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_activities.tenant_id and tm.user_id = auth.uid()));

drop policy if exists "member select" on agentx_lead_scores;
create policy "member select" on agentx_lead_scores for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_lead_scores.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member insert" on agentx_lead_scores;
create policy "member insert" on agentx_lead_scores for insert with check (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_lead_scores.tenant_id and tm.user_id = auth.uid()));

drop policy if exists "member select" on agentx_tasks;
create policy "member select" on agentx_tasks for select using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_tasks.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member insert" on agentx_tasks;
create policy "member insert" on agentx_tasks for insert with check (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_tasks.tenant_id and tm.user_id = auth.uid()));
drop policy if exists "member update" on agentx_tasks;
create policy "member update" on agentx_tasks for update using (exists (select 1 from tenant_members tm where tm.tenant_id = agentx_tasks.tenant_id and tm.user_id = auth.uid()));

-- ------------------------------------------------------------------ grants --
revoke all on agentx_contacts, agentx_deals, agentx_activities, agentx_lead_scores, agentx_tasks from anon;
grant select, insert, update on agentx_contacts, agentx_deals, agentx_activities, agentx_lead_scores, agentx_tasks to authenticated;

-- ============================ ROLLBACK (owner) ============================
--   drop table if exists agentx_tasks, agentx_lead_scores, agentx_activities,
--     agentx_deals, agentx_contacts;
