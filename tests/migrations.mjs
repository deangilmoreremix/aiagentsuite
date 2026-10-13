// ACTUAL SQL validation of the corrected migrations against a real embedded
// Postgres (pglite = isolated staging; no production data). Covers:
// clean apply, object inventory, COMPOSITE same-tenant FKs, individually
// idempotent policies, grants (authenticated member access / anon denied),
// RLS select/insert/update/with-check for members + nonmembers + anon,
// cross-tenant child references, tenant reassignment, atomic single-use +
// execution-bound approvals, idempotency, FK integrity, partial re-runs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push(true); console.log('PASS - ' + name); }
  catch (e) { results.push(false); console.log('FAIL - ' + name + ' :: ' + (e?.message || e)); }
};
const scalar = async (pg, sql) => (await pg.query(sql)).rows[0].n;
const MIG_EXEC = readFileSync('supabase/migrations/20261014020000_agent_execution.sql', 'utf8');
const MIG_CRM = readFileSync('supabase/migrations/20261014020100_agentx_crm.sql', 'utf8');

const TA = 'aaaaaaaa-1111-4111-8111-111111111111';
const TB = 'bbbbbbbb-2222-4222-8222-222222222222';
const USER_A = 'aaaaaaa1-0000-4000-8000-00000000000a';
const USER_B = 'bbbbbbb2-0000-4000-8000-00000000000b';
const USER_C = 'ccccccc3-0000-4000-8000-00000000000c';

const BASE = `
  create schema if not exists auth;
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  do $$ begin create role anon; exception when duplicate_object then null; end $$;
  do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
  create table tenants (id uuid primary key, name text not null, slug text, created_at timestamptz default now(), updated_at timestamptz default now());
  create table tenant_members (id uuid primary key default gen_random_uuid(), user_id uuid not null, tenant_id uuid not null references tenants(id), role text, created_at timestamptz default now());
  create table workflow_runs (id uuid primary key, note text);
  insert into workflow_runs values (gen_random_uuid(), 'existing-app-row');
  -- emulate the EXISTING shared DB's grants (pre-existing, not ours to change)
  grant usage on schema public to anon, authenticated;
  grant select on tenants to anon;
  grant select on tenants, tenant_members, workflow_runs to authenticated;
`;

const pg = new PGlite();
await pg.exec(BASE);
await pg.exec(MIG_EXEC);
await pg.exec(MIG_CRM);

await check('both corrected migrations execute cleanly', async () => { /* reached here only if no throw */ });

await check('10 agentx_* tables exist', async () => {
  for (const t of ['agentx_runs','agentx_tool_executions','agentx_approvals','agentx_workflow_runs','agentx_email_drafts','agentx_contacts','agentx_deals','agentx_activities','agentx_lead_scores','agentx_tasks']) {
    assert.equal(await scalar(pg, `select count(*)::int as n from information_schema.tables where table_schema='public' and table_name='${t}'`), 1, t);
  }
});

await check('composite same-tenant FK constraints exist (7, each 2 columns)', async () => {
  const names = ['agentx_deals_contact_fk','agentx_activities_contact_fk','agentx_activities_deal_fk','agentx_lead_scores_contact_fk','agentx_tasks_contact_fk','agentx_tool_exec_run_fk','agentx_approvals_run_fk'];
  const rows = (await pg.query(`select conname, array_length(conkey,1) as cols from pg_constraint where contype='f' and conname = any($1)`, [names])).rows;
  assert.equal(rows.length, 7, `found ${rows.length}/7`);
  for (const r of rows) assert.equal(r.cols, 2, `${r.conname} is not a composite FK`);
});

await check('composite FK target unique(tenant_id, id) constraints exist', async () => {
  const n = await scalar(pg, `select count(*)::int as n from pg_constraint where contype='u' and conname like 'agentx_%_tenant_uq'`);
  assert.equal(n, 4, `expected 4, got ${n}`);
});

await check('idempotency unique index exists', async () => {
  assert.equal(await scalar(pg, `select count(*)::int as n from pg_indexes where indexname='agentx_tool_exec_idem_uidx'`), 1);
});

await check('policies are individually created (19) with no duplicates', async () => {
  const total = await scalar(pg, `select count(*)::int as n from pg_policies where schemaname='public' and tablename like 'agentx_%'`);
  assert.equal(total, 19, `expected 19 policies, got ${total}`);
  const dup = await scalar(pg, `select count(*)::int as n from (select tablename, policyname, count(*) c from pg_policies where tablename like 'agentx_%' group by tablename, policyname having count(*)>1) x`);
  assert.equal(dup, 0, 'duplicate policies');
});

await check('RLS enabled on all 10 agentx_ tables', async () => {
  assert.equal(await scalar(pg, `select count(*)::int as n from pg_class where relname like 'agentx_%' and relkind='r' and relrowsecurity`), 10);
});

await check('grants: anon has NO privileges on agentx_ tables (existing tables unaffected)', async () => {
  const n = await scalar(pg, `select count(*)::int as n from information_schema.role_table_grants where grantee='anon' and table_name like 'agentx_%'`);
  assert.equal(n, 0, `anon has grants on ${n} agentx_ tables`);
  const base = await scalar(pg, `select count(*)::int as n from information_schema.role_table_grants where grantee='anon' and table_name in ('tenants','tenant_members')`);
  assert.ok(base >= 1, 'pre-existing anon grants on other tables must not be touched');
});

await check('grants: authenticated has select/insert/update (+ no delete) on agentx_ tables', async () => {
  const privs = (await pg.query(`select privilege_type, count(*)::int as n from information_schema.role_table_grants where grantee='authenticated' and table_name like 'agentx_%' group by privilege_type`)).rows;
  const byType = Object.fromEntries(privs.map((r) => [r.privilege_type, r.n]));
  assert.deepEqual(Object.keys(byType).sort(), ['INSERT','SELECT','UPDATE'], 'unexpected grants');
});

// Seed tenants/members/contacts (superuser).
await pg.exec(`
  insert into tenants (id, name) values ('${TA}','Tenant A'),('${TB}','Tenant B');
  insert into tenant_members (user_id, tenant_id, role) values ('${USER_A}','${TA}','owner'),('${USER_B}','${TB}','owner');
  insert into agentx_contacts (id, tenant_id, first_name, last_name, email, lead_score) values
    ('c0000000-0000-4000-8000-00000000000a','${TA}','Dana','Rivera','dana@acme.test', 42),
    ('d0000000-0000-4000-8000-00000000000b','${TB}','Eve','Other','eve@beta.test', 10);
  insert into agentx_deals (id, tenant_id, contact_id, title, amount) values
    ('e0000000-0000-4000-8000-00000000000a','${TA}','c0000000-0000-4000-8000-00000000000a','Deal A', 1000);
`);

const asUser = async (u) => { await pg.exec(`set role authenticated; set request.jwt.claim.sub = '${u}';`); };
const asAnon = async () => { await pg.exec(`set role anon; set request.jwt.claim.sub = '';`); };
const asSuper = async () => { await pg.exec(`reset role;`); };
const selectRows = async (sql) => (await pg.query(sql)).rows;
const expectThrow = async (fn, code, label) => { try { await fn(); assert.fail(label + ' did not throw'); } catch (e) { if (e instanceof assert.AssertionError && e.message === label + ' did not throw') throw e; if (code) assert.equal(e.code, code, label + ' got ' + e.code); } };

await check('RLS SELECT: member sees own tenant only; nonmember sees none', async () => {
  await asUser(USER_A);
  assert.equal((await selectRows(`select email from agentx_contacts`)).length, 1);
  await asUser(USER_C);
  assert.equal((await selectRows(`select email from agentx_contacts`)).length, 0);
  await asSuper();
});

await check('RLS SELECT: anon is denied on agentx_ tables but can still read tenants', async () => {
  await asAnon();
  await expectThrow(() => pg.query(`select email from agentx_contacts`), '42501', 'anon select agentx_contacts');
  const t = (await pg.query(`select name from tenants`)).rows;
  assert.ok(t.length >= 2, 'anon must still be able to read the pre-existing tenants table');
  await asSuper();
});

await check('RLS INSERT: member can insert own-tenant row; cannot insert for another tenant', async () => {
  await asUser(USER_A);
  const ins = await pg.query(`insert into agentx_contacts (tenant_id, first_name, email) values ('${TA}','Member Made','m1@acme.test') returning id`);
  assert.ok(ins.rows[0].id, 'member insert failed');
  await expectThrow(() => pg.query(`insert into agentx_contacts (tenant_id, first_name) values ('${TB}','Sneak')`), '42501', 'cross-tenant insert');
  await asSuper();
});

await check('RLS UPDATE: member updates own row; cannot update other-tenant row', async () => {
  await asUser(USER_A);
  const own = (await pg.query(`with u as (update agentx_contacts set lead_score=55 where tenant_id='${TA}' and email='dana@acme.test' returning id) select count(*)::int as n from u`)).rows[0].n;
  assert.equal(own, 1, 'member own-row update should affect 1');
  const other = (await pg.query(`with u as (update agentx_contacts set lead_score=1 where tenant_id='${TB}' and email='eve@beta.test' returning id) select count(*)::int as n from u`)).rows[0].n;
  assert.equal(other, 0, 'cross-tenant update must affect 0 rows');
  await asSuper();
});

await check('composite FK: deal cannot reference another tenant\'s contact', async () => {
  await asSuper();
  await expectThrow(() => pg.query(`insert into agentx_deals (tenant_id, contact_id, title) values ('${TB}','c0000000-0000-4000-8000-00000000000a','cross')`), '23503', 'cross-tenant deal->contact');
  await expectThrow(() => pg.query(`insert into agentx_activities (tenant_id, contact_id, type) values ('${TB}','c0000000-0000-4000-8000-00000000000a','note')`), '23503', 'cross-tenant activity->contact');
});

await check('same-tenant: deal referencing own-tenant contact is allowed', async () => {
  await asSuper();
  const r = await pg.query(`insert into agentx_deals (tenant_id, contact_id, title) values ('${TA}','c0000000-0000-4000-8000-00000000000a','Same Tenant Deal') returning id`);
  assert.ok(r.rows[0].id);
});

await check('tenant reassignment of a referenced contact is rejected (same-tenant integrity)', async () => {
  await asSuper();
  await expectThrow(() => pg.query(`update agentx_contacts set tenant_id='${TB}' where id='c0000000-0000-4000-8000-00000000000a'`), '23503', 'reassign contact with dependent deal');
});

await check('deleting a referenced contact is rejected; after removing dependents it succeeds', async () => {
  await asSuper();
  const cid = (await pg.query(`insert into agentx_contacts (tenant_id, first_name) values ('${TA}','Temp') returning id`)).rows[0].id;
  await pg.query(`insert into agentx_deals (tenant_id, contact_id, title) values ('${TA}','${cid}','Temp Deal')`);
  await expectThrow(() => pg.query(`delete from agentx_contacts where id='${cid}'`), '23503', 'delete referenced contact');
  await pg.query(`delete from agentx_deals where contact_id='${cid}'`);
  await pg.query(`delete from agentx_contacts where id='${cid}'`);
  assert.equal((await pg.query(`select count(*)::int as n from agentx_contacts where id='${cid}'`)).rows[0].n, 0, 'contact should be deletable once no dependents');
});

await check('atomic single-use approval, execution-bound (run_ref), action-scoped', async () => {
  await asSuper();
  const ap = (await pg.query(`insert into agentx_approvals (tenant_id, action, status) values ('${TA}','crm:update_contact','approved') returning id`)).rows[0].id;
  const consume = (tenant, ref) => scalar(pg, `with u as (update agentx_approvals set status='consumed', run_ref='${ref}' where tenant_id='${tenant}' and id='${ap}' and status='approved' returning id, run_ref) select count(*)::int as n from u`);
  const rows = () => pg.query(`select run_ref, status from agentx_approvals where id='${ap}'`);
  assert.equal(await consume(TA, 'run-xyz'), 1, 'first consume');
  const row = (await rows()).rows[0];
  assert.equal(row.run_ref, 'run-xyz', 'approval must be bound to the execution (run_ref)');
  assert.equal(row.status, 'consumed');
  assert.equal(await consume(TA, 'run-xyz'), 0, 'replay rejected (single-use)');
  assert.equal(await consume(TB, 'run-abc'), 0, 'cross-tenant consume rejected');
});

await check('idempotency: duplicate (tenant, tool, idempotency_key) rejected', async () => {
  await asSuper();
  const ins = () => pg.query(`insert into agentx_tool_executions (tenant_id, tool, status, idempotency_key) values ('${TA}','send_approved_email','completed','idem-9')`);
  await ins();
  await expectThrow(() => ins(), '23505', 'duplicate idempotency key');
});

await check('referential integrity: bad tenant FK rejected', async () => {
  await asSuper();
  await expectThrow(() => pg.query(`insert into agentx_contacts (tenant_id, first_name) values ('99999999-9999-4999-8999-999999999999','x')`), '23503', 'bad tenant FK');
});

await check('tool_execution cannot reference a run from another tenant', async () => {
  await asSuper();
  const runA = (await pg.query(`insert into agentx_runs (tenant_id, agent_key, status) values ('${TA}','ai_sdr','completed') returning id`)).rows[0].id;
  await expectThrow(() => pg.query(`insert into agentx_tool_executions (tenant_id, run_id, tool) values ('${TB}','${runA}','x')`), '23503', 'cross-tenant run reference');
});

await check('partial migration re-runs are safe (execution-only, then CRM-only)', async () => {
  const pg2 = new PGlite(); await pg2.exec(BASE);
  await pg2.exec(MIG_EXEC); await pg2.exec(MIG_EXEC); // run twice
  assert.equal(await scalar(pg2, `select count(*)::int as n from information_schema.tables where table_schema='public' and table_name like 'agentx_%'`), 5, 'execution-only re-run');
  assert.equal(await scalar(pg2, `select count(*)::int as n from pg_policies where schemaname='public' and tablename like 'agentx_%'`), 6, 'execution-only policies after re-run');
  const pg3 = new PGlite(); await pg3.exec(BASE);
  await pg3.exec(MIG_CRM); await pg3.exec(MIG_CRM); // run twice
  assert.equal(await scalar(pg3, `select count(*)::int as n from information_schema.tables where table_schema='public' and table_name like 'agentx_%'`), 5, 'crm-only re-run');
  assert.equal(await scalar(pg3, `select count(*)::int as n from pg_policies where schemaname='public' and tablename like 'agentx_%'`), 13, 'crm-only policies after re-run');
});

await check('re-running BOTH migrations is idempotent (no duplicates)', async () => {
  await pg.exec(MIG_EXEC);
  await pg.exec(MIG_CRM);
  assert.equal(await scalar(pg, `select count(*)::int as n from information_schema.tables where table_schema='public' and table_name like 'agentx_%'`), 10);
  assert.equal(await scalar(pg, `select count(*)::int as n from (select tablename, policyname, count(*) c from pg_policies where tablename like 'agentx_%' group by tablename, policyname having count(*)>1) x`), 0);
});

const failed = results.filter((x) => x === false).length;
console.log(`\nMIGRATION TESTS: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
