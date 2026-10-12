// Phase 5: ACTUAL SQL migration validation against a real embedded Postgres
// (pglite = Postgres compiled to WASM). This is a genuine isolated staging DB:
// no production data, no copying of customer records. It runs the two real
// migration files, then tests tenant isolation, atomic single-use approvals,
// idempotency, object collisions, re-run safety, and referential integrity.
//
// Note: this does NOT touch the shared project bzxohkrxcwodllketcpz.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push(true); console.log('PASS - ' + name); }
  catch (e) { results.push(false); console.log('FAIL - ' + name + ' :: ' + (e?.message || e)); }
};
const scalar = async (pg, sql) => (await pg.query(sql)).rows[0].n;

const MIG_EXEC = readFileSync('supabase/migrations/20261011_agent_execution.sql', 'utf8');
const MIG_CRM = readFileSync('supabase/migrations/20261012_agentx_crm.sql', 'utf8');

const TA = 'aaaaaaaa-1111-4111-8111-111111111111';
const TB = 'bbbbbbbb-2222-4222-8222-222222222222';
const USER_A = 'aaaaaaa1-0000-4000-8000-00000000000a';
const USER_B = 'bbbbbbb2-0000-4000-8000-00000000000b';
const USER_C = 'ccccccc3-0000-4000-8000-00000000000c'; // no membership

const pg = new PGlite();

// Base schema mirroring the VERIFIED shared project + Supabase auth emulation.
await pg.exec(`
  create schema if not exists auth;
  create or replace function auth.uid() returns uuid language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), '')::uuid
  $$;
  do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
  create table tenants (id uuid primary key, name text not null, slug text, created_at timestamptz default now(), updated_at timestamptz default now());
  create table tenant_members (id uuid primary key default gen_random_uuid(), user_id uuid not null, tenant_id uuid not null references tenants(id), role text, invited_by uuid, invited_at timestamptz, created_at timestamptz default now());
  -- decoy to prove we do NOT collide with the shared DB's existing tables
  create table workflow_runs (id uuid primary key, note text);
  insert into workflow_runs values (gen_random_uuid(), 'existing-app-row');
`);

await check('both migrations execute cleanly on a fresh DB', async () => {
  await pg.exec(MIG_EXEC);
  await pg.exec(MIG_CRM);
});

await check('all 10 agentx_* tables were created', async () => {
  const tables = ['agentx_runs', 'agentx_tool_executions', 'agentx_approvals', 'agentx_workflow_runs', 'agentx_email_drafts', 'agentx_contacts', 'agentx_deals', 'agentx_activities', 'agentx_lead_scores', 'agentx_tasks'];
  for (const t of tables) {
    const n = await scalar(pg, `select count(*)::int as n from information_schema.tables where table_schema='public' and table_name='${t}'`);
    assert.equal(n, 1, `missing table ${t}`);
  }
});

await check('tenant FKs reference tenants(id) on every agentx_ table', async () => {
  const n = await scalar(pg, `select count(*)::int as n from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_class r on r.oid=c.confrelid
    where c.contype='f' and r.relname='tenants'
      and t.relname in ('agentx_runs','agentx_tool_executions','agentx_approvals','agentx_workflow_runs','agentx_email_drafts','agentx_contacts','agentx_deals','agentx_activities','agentx_lead_scores','agentx_tasks')`);
  assert.equal(n, 10, `expected 10 tenant FKs, got ${n}`);
});

await check('RLS enabled on all 10 tables and membership policies exist', async () => {
  const rls = await scalar(pg, `select count(*)::int as n from pg_class where relname like 'agentx_%' and relkind='r' and relrowsecurity`);
  assert.equal(rls, 10, `RLS enabled on ${rls}/10`);
  const pols = await scalar(pg, `select count(*)::int as n from pg_policies where schemaname='public' and tablename like 'agentx_%'`);
  assert.ok(pols >= 15, `expected >=15 policies, got ${pols}`);
});

await check('idempotency + FK-supporting indexes exist', async () => {
  const idx = await scalar(pg, `select count(*)::int as n from pg_indexes where schemaname='public' and indexname like 'agentx_%'`);
  assert.ok(idx >= 15, `expected >=15 indexes, got ${idx}`);
  const uid = await scalar(pg, `select count(*)::int as n from pg_indexes where indexname='agentx_tool_exec_idem_uidx'`);
  assert.equal(uid, 1, 'idempotency unique index missing');
});

await check('existing workflow_runs table is untouched (no collision)', async () => {
  const cols = await scalar(pg, `select count(*)::int as n from information_schema.columns where table_name='workflow_runs' and column_name='note'`);
  assert.equal(cols, 1, 'existing workflow_runs was altered');
  const axw = await scalar(pg, `select count(*)::int as n from information_schema.columns where table_name='agentx_workflow_runs' and column_name='steps'`);
  assert.equal(axw, 1, 'agentx_workflow_runs not created separately');
});

// Privileges for the emulated authenticated (RLS-enforced) role.
await pg.exec(`grant usage on schema public to authenticated; grant select, insert, update on all tables in schema public to authenticated;`);

// Seed tenants + members + data (superuser).
await pg.exec(`
  insert into tenants (id, name) values ('${TA}','Tenant A'),('${TB}','Tenant B');
  insert into tenant_members (user_id, tenant_id, role) values ('${USER_A}','${TA}','owner'),('${USER_B}','${TB}','owner');
  insert into agentx_contacts (id, tenant_id, first_name, last_name, email) values
    ('c0000000-0000-4000-8000-00000000000a','${TA}','Dana','Rivera','dana@acme.test'),
    ('d0000000-0000-4000-8000-00000000000b','${TB}','Eve','Other','eve@beta.test');
`);

const asUser = async (uuid) => { await pg.exec(`set role authenticated; set request.jwt.claim.sub = '${uuid}';`); };
const asSuper = async () => { await pg.exec(`reset role;`); };
const asSelect = async (sql) => (await pg.query(sql)).rows;

await check('cross-tenant isolation: user A sees only tenant A contacts', async () => {
  await asUser(USER_A);
  const rows = await asSelect(`select email from agentx_contacts`);
  assert.equal(rows.length, 1, `A saw ${rows.length} rows`);
  assert.equal(rows[0].email, 'dana@acme.test');
});

await check('user A cannot INSERT a row for tenant B (RLS with-check)', async () => {
  await asUser(USER_A);
  let threw = false;
  try {
    await pg.query(`insert into agentx_contacts (tenant_id, first_name) values ('${TB}','Hacker')`);
  } catch (e) { threw = true; const code = e?.code; assert.ok(code === '42501' || /row-level security|policy|permission/i.test(e.message), 'unexpected: ' + e.message); }
  assert.ok(threw, 'cross-tenant insert was NOT blocked');
  await asSuper();
});

await check('a user with no membership sees zero rows', async () => {
  await asUser(USER_C);
  const rows = await asSelect(`select email from agentx_contacts`);
  assert.equal(rows.length, 0, `non-member saw ${rows.length} rows`);
  await asSuper();
});

await check('atomic single-use approval: first consume succeeds, replay fails', async () => {
  await asSuper();
  const ap = (await pg.query(`insert into agentx_approvals (tenant_id, action, status) values ('${TA}','crm:update_contact','approved') returning id`)).rows[0].id;
  const consume = () => scalar(pg, `with u as (update agentx_approvals set status='consumed' where tenant_id='${TA}' and id='${ap}' and status='approved' returning id) select count(*)::int as n from u`);
  assert.equal(await consume(), 1, 'first consume must affect 1 row');
  assert.equal(await consume(), 0, 'replay must affect 0 rows (single-use)');
  const crossConsume = await scalar(pg, `with u as (update agentx_approvals set status='consumed' where tenant_id='${TB}' and id='${ap}' and status='approved' returning id) select count(*)::int as n from u`);
  assert.equal(crossConsume, 0, 'cross-tenant consume must affect 0 rows');
});

await check('idempotency: duplicate (tenant, tool, idempotency_key) is rejected', async () => {
  await asSuper();
  const ins = () => pg.query(`insert into agentx_tool_executions (tenant_id, tool, status, idempotency_key) values ('${TA}','send_approved_email','completed','idem-123')`);
  await ins();
  let threw = false;
  try { await ins(); } catch (e) { threw = true; assert.equal(e.code, '23505', 'expected unique violation'); }
  assert.ok(threw, 'duplicate idempotency_key was allowed');
});

await check('referential integrity: bad tenant FK and orphan contact FK are rejected', async () => {
  await asSuper();
  let t1 = false;
  try { await pg.query(`insert into agentx_deals (tenant_id, title) values ('99999999-9999-4999-8999-999999999999','x')`); } catch (e) { t1 = true; assert.equal(e.code, '23503'); }
  assert.ok(t1, 'bad tenant FK allowed');
  let t2 = false;
  try { await pg.query(`insert into agentx_activities (tenant_id, contact_id, type) values ('${TA}','88888888-8888-4888-8888-888888888888','note')`); } catch (e) { t2 = true; assert.equal(e.code, '23503'); }
  assert.ok(t2, 'orphan contact FK allowed');
});

await check('contact delete sets deal.contact_id to null (referential behavior)', async () => {
  await asSuper();
  const cid = (await pg.query(`insert into agentx_contacts (tenant_id, first_name) values ('${TA}','DeleteMe') returning id`)).rows[0].id;
  const did = (await pg.query(`insert into agentx_deals (tenant_id, contact_id, title) values ('${TA}','${cid}','Deal X') returning id`)).rows[0].id;
  await pg.query(`delete from agentx_contacts where id='${cid}'`);
  const deal = (await pg.query(`select contact_id from agentx_deals where id='${did}'`)).rows[0];
  assert.equal(deal.contact_id, null, 'contact_id should be null after contact delete');
});

await check('tenant delete cascades its agentx rows (shared tenant_members removed first)', async () => {
  await asSuper();
  // NOTE: deleting a tenant requires first removing rows in the EXISTING shared
  // tenant_members table (not owned by these migrations); then the agentx_*
  // tables cascade via their own on delete cascade.
  await pg.query(`delete from tenant_members where tenant_id='${TB}'`);
  await pg.query(`delete from tenants where id='${TB}'`);
  assert.equal(await scalar(pg, `select count(*)::int as n from agentx_contacts where tenant_id='${TB}'`), 0, 'agentx_contacts did not cascade');
  assert.equal(await scalar(pg, `select count(*)::int as n from agentx_deals where tenant_id='${TB}'`), 0, 'agentx_deals did not cascade');
});

await check('re-running both migrations is idempotent (no error, no duplicate objects)', async () => {
  await pg.exec(MIG_EXEC);
  await pg.exec(MIG_CRM);
  const tables = await scalar(pg, `select count(*)::int as n from information_schema.tables where table_schema='public' and table_name like 'agentx_%'`);
  assert.equal(tables, 10, `expected 10 tables, got ${tables}`);
  const dup = await scalar(pg, `select count(*)::int as n from (select tablename, policyname, count(*) c from pg_policies where tablename like 'agentx_%' group by tablename, policyname having count(*) > 1) x`);
  assert.equal(dup, 0, 'duplicate policies after re-run');
});

const failed = results.filter((x) => x === false).length;
console.log(`\nMIGRATION TESTS: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
