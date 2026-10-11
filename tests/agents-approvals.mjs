// Phase 2 tests: server-verified approvals.
//  - Forged approvement (client action-name array) is IGNORED.
//  - consumeApprovals only returns rows matching tenant + id + status (approved),
//    and consumes them (single-use) so cross-tenant and replayed approvals fail.
import assert from 'node:assert/strict';
import { consumeApprovals } from '../server/agents/approvals.mjs';
import { getRunContext } from '../server/agents/context.mjs';

const results = [];
async function t(name, fn) {
  try { await fn(); results.push(true); console.log('PASS - ' + name); }
  catch (e) { results.push(false); console.log('FAIL - ' + name + ' :: ' + e.message); }
}

// Minimal in-memory Supabase-like chain honoring update/eq/in/select semantics.
function fakeDb(rows) {
  return {
    from() {
      const ops = [];
      let patch = null;
      const chain = {
        update(p) { patch = p; return chain; },
        eq(col, val) { ops.push((r) => r[col] === val); return chain; },
        in(col, vals) { ops.push((r) => vals.includes(r[col])); return chain; },
        async select() {
          const matched = rows.filter((r) => ops.every((p) => p(r)));
          matched.forEach((r) => Object.assign(r, patch));
          return { data: matched.map((r) => ({ id: r.id, action: r.action, tenant_id: r.tenant_id })), error: null };
        },
      };
      return chain;
    },
  };
}

const row = () => ({ id: 'aaaa1111-1111-1111-1111-111111111111', tenant_id: 'tenantA', action: 'crm:update_contact', status: 'approved', resolved_by: null });

await t('valid approval (tenant + approved) authorizes the action once', async () => {
  const db = fakeDb([row()]);
  const out = await consumeApprovals(db, { tenantId: 'tenantA', userId: 'u1', approvalIds: ['aaaa1111-1111-1111-1111-111111111111'] });
  assert.equal(out.length, 1);
  assert.equal(out[0].action, 'crm:update_contact');
});

await t('replayed approval (already consumed) is rejected', async () => {
  const r = row();
  const db = fakeDb([r]);
  const ids = ['aaaa1111-1111-1111-1111-111111111111'];
  const first = await consumeApprovals(db, { tenantId: 'tenantA', userId: 'u1', approvalIds: ids });
  assert.equal(first.length, 1, 'first use should succeed');
  const second = await consumeApprovals(db, { tenantId: 'tenantA', userId: 'u1', approvalIds: ids });
  assert.equal(second.length, 0, 'second (replay) must be empty because status is now consumed');
});

await t('cross-tenant approval id is rejected', async () => {
  const db = fakeDb([row()]); // belongs to tenantA
  const out = await consumeApprovals(db, { tenantId: 'tenantB', userId: 'u1', approvalIds: ['aaaa1111-1111-1111-1111-111111111111'] });
  assert.equal(out.length, 0, 'another tenant cannot use tenantA approval');
});

await t('forged/unknown approval id yields nothing', async () => {
  const db = fakeDb([row()]);
  const out = await consumeApprovals(db, { tenantId: 'tenantA', userId: 'u1', approvalIds: ['forged-id'] });
  assert.equal(out.length, 0);
});

await t('no approvalIds / no db yields nothing (consequential actions stay gated)', async () => {
  assert.equal((await consumeApprovals(fakeDb([row()]), { tenantId: 'tenantA', approvalIds: [] })).length, 0);
  assert.equal((await consumeApprovals(null, { tenantId: 'tenantA', approvalIds: ['x'] })).length, 0);
});

await t('getRunContext authorizes only from server-verified approvedActions', async () => {
  const rc = getRunContext({ context: { tenantId: 'tenantA', mode: 'real', approvedActions: new Set(['crm:update_contact']) } });
  assert.equal(rc.isApproved('crm:update_contact'), true);
  assert.equal(rc.isApproved('email:send'), false);
});

await t('client-supplied action-name array is IGNORED (bypass attempt)', async () => {
  const rc = getRunContext({ context: { tenantId: 'tenantA', mode: 'real', approvals: ['crm:update_contact', 'email:send'] } });
  assert.equal(rc.isApproved('crm:update_contact'), false, 'must not be granted from client array');
  assert.equal(rc.isApproved('email:send'), false);
});

const failed = results.filter((x) => x === false).length;
console.log(`\nAPPROVAL TESTS: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
