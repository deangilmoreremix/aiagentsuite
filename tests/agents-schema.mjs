// Schema contracts: (1) CRM tools only use namespaced agentx_* tables, (2)
// create_deal exists, (3) the CRM migration provisions the agentx_* tables with
// tenant FKs, membership RLS, and a rollback note. Static — no DB access.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createCrmTools } from '../server/agents/tools/crm.mjs';

const results = [];
const check = (n, fn) => { try { fn(); results.push(true); console.log('PASS - ' + n); } catch (e) { results.push(false); console.log('FAIL - ' + n + ' :: ' + e.message); } };

const crmSrc = readFileSync('server/agents/tools/crm.mjs', 'utf8');

check('CRM tools only target namespaced agentx_* tables', () => {
  const tables = [...crmSrc.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
  assert(tables.length > 0, 'no from() calls found');
  for (const t of tables) assert(/^agentx_/.test(t), `non-namespaced table used: ${t}`);
});

check('CRM tools include create_deal', () => {
  assert(createCrmTools().some((t) => t.name === 'create_deal'), 'create_deal tool missing');
});

check('CRM migration provisions agentx_ CRM tables with tenant FK', () => {
  const p = 'supabase/migrations/20261014020100_agentx_crm.sql';
  assert(existsSync(p), 'migration file missing');
  const sql = readFileSync(p, 'utf8');
  for (const tbl of ['agentx_contacts', 'agentx_deals', 'agentx_activities', 'agentx_lead_scores', 'agentx_tasks']) {
    assert(sql.includes(`create table if not exists ${tbl} (`), `missing ${tbl}`);
  }
  const fkCount = (sql.match(/tenant_id uuid not null references tenants\(id\)/g) || []).length;
  assert(fkCount >= 5, `expected >=5 tenant FKs, found ${fkCount}`);
  assert(sql.includes('enable row level security'), 'RLS not enabled');
  assert(/tenant_members/.test(sql), 'membership-based RLS missing');
  assert(/drop table if exists/i.test(sql), 'rollback note missing');
});

const failed = results.filter((x) => x === false).length;
console.log(`\nSCHEMA TESTS: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
