// Phase 3 tenancy tests: tenant is resolved via tenant_members (fallback
// user_roles), never assumed to equal auth.uid().
import assert from 'node:assert/strict';
import { resolveTenantForUser, getTenantIdForUser } from '../server/supabase/tenancy.mjs';

const results = [];
async function t(name, fn) {
  try { await fn(); results.push(true); console.log('PASS - ' + name); }
  catch (e) { results.push(false); console.log('FAIL - ' + name + ' :: ' + e.message); }
}

// Fake Supabase db: per-table select results; select/eq/order/limit are chainable
// and the chain is awaitable, resolving to { data, error }.
function dbFor(map) {
  return {
    from(table) {
      const r = map[table] || { data: [], error: null };
      const chain = {};
      for (const m of ['select', 'eq', 'order', 'limit']) chain[m] = () => chain;
      chain.then = (res, rej) => Promise.resolve(r).then(res, rej);
      return chain;
    },
  };
}

const R = (rows) => ({ data: rows, error: null });

await t('resolves tenant from tenant_members', async () => {
  const tenant = await resolveTenantForUser(dbFor({ tenant_members: R([{ tenant_id: '11111111-1111-1111-1111-111111111111' }]) }), 'u1');
  assert.equal(tenant, '11111111-1111-1111-1111-111111111111');
});

await t('falls back to user_roles when not in tenant_members', async () => {
  const tenant = await resolveTenantForUser(dbFor({
    tenant_members: R([]),
    user_roles: R([{ tenant_id: '22222222-2222-2222-2222-222222222222' }]),
  }), 'u1');
  assert.equal(tenant, '22222222-2222-2222-2222-222222222222');
});

await t('returns null when the user belongs to no tenant (no silent default)', async () => {
  const tenant = await resolveTenantForUser(dbFor({ tenant_members: R([]), user_roles: R([]) }), 'u1');
  assert.equal(tenant, null);
});

await t('tenant is NOT assumed equal to auth.uid()', async () => {
  const uid = 'user-abc';
  const tenant = await resolveTenantForUser(dbFor({ tenant_members: R([{ tenant_id: 'tenant-xyz' }]) }), uid);
  assert.notEqual(tenant, uid);
});

await t('survives tenant_members error and uses user_roles', async () => {
  const tenant = await resolveTenantForUser(dbFor({
    tenant_members: { data: null, error: { message: 'boom' } },
    user_roles: R([{ tenant_id: '33333333-3333-3333-3333-333333333333' }]),
  }), 'u1');
  assert.equal(tenant, '33333333-3333-3333-3333-333333333333');
});

await t('no db / no user -> null', async () => {
  assert.equal(await resolveTenantForUser(null, 'u1'), null);
  assert.equal(await resolveTenantForUser(dbFor({ tenant_members: R([{ tenant_id: 'x' }]) }), null), null);
});

await t('getTenantIdForUser returns null when server Supabase is not configured', async () => {
  assert.equal(await getTenantIdForUser('u1'), null);
});

const failed = results.filter((x) => x === false).length;
console.log(`\nTENANCY TESTS: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
