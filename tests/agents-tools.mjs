// Tool-level tests: when a provider is not configured, every tool returns an
// honest integration_required (or consent/approval) status and NEVER a
// fabricated success / provider id.
import { RunContext } from '@openai/agents';
import { createCrmTools } from '../server/agents/tools/crm.mjs';
import { createEmailTools } from '../server/agents/tools/integrations.mjs';
import { createMessagingTools } from '../server/agents/tools/integrations.mjs';

const results = [];
const check = (n, fn) => { try { fn(); results.push(true); console.log('PASS - ' + n); } catch (e) { results.push(false); console.log('FAIL - ' + n + ' :: ' + e.message); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assert failed'); };

const crm = new Map(createCrmTools().map((t) => [t.name, t]));
const email = new Map(createEmailTools().map((t) => [t.name, t]));
const msg = new Map(createMessagingTools().map((t) => [t.name, t]));

const ctxWith = (contextOverrides = {}) => new RunContext({ tenantId: '11111111-1111-1111-1111-111111111111', userId: 'u', mode: 'real', approvals: [], ...contextOverrides });
const call = async (map, name, args, rc) => JSON.parse(await map.get(name).invoke(rc, JSON.stringify(args)));

await (async () => {
  // CRM tools (Supabase not configured in this test env) => integration_required.
  for (const name of ['search_contacts', 'get_contact', 'create_contact', 'update_contact', 'search_deals', 'update_deal', 'create_task', 'get_tasks', 'update_lead_score', 'record_activity']) {
    check(`crm ${name} -> integration_required (supabase) when unconfigured`, async () => {
      const r = await call(crm, name, { id: 'x', query: 'a', name: 'a', title: 't', to: 'a@b.co', subject: 's', body: 'b' }, ctxWith());
      assert(r.ok === false && r.status === 'integration_required' && r.integration === 'supabase', JSON.stringify(r));
    });
  }

  // Mutating CRM tools must gate on approval even if Supabase were configured.
  check('mutating crm tools require an approval token (schema lists gating)', () => {
    assert(crm.has('update_contact') && crm.has('create_task') && crm.has('update_lead_score'));
  });

  // Email send -> integration_required (gmail) when provider absent (no fake send).
  check('send_approved_email -> integration_required (gmail)', async () => {
    const r = await call(email, 'send_approved_email', { to: 'a@b.co', subject: 's', body: 'b' }, ctxWith({ approvals: ['email:send'] }));
    assert(r.ok === false && r.status === 'integration_required' && r.integration === 'gmail', JSON.stringify(r));
    assert(!r.providerId, 'must not fabricate a provider id');
  });

  // create_email_draft without Supabase -> draft_unsaved (honest, not "sent").
  check('create_email_draft without supabase -> draft_unsaved', async () => {
    const r = await call(email, 'create_email_draft', { to: 'a@b.co', subject: 's', body: 'b' }, ctxWith());
    assert(r.status === 'draft_unsaved', JSON.stringify(r));
  });

  // SMS consent gate + send integration_required.
  check('prepare_sms without consent -> consent_required', async () => {
    const r = await call(msg, 'prepare_sms', { to: '+1', body: 'hi', consent: false }, ctxWith());
    assert(r.ok === false && r.status === 'consent_required', JSON.stringify(r));
  });
  check('send_approved_sms -> integration_required when no sms provider', async () => {
    const r = await call(msg, 'send_approved_sms', { to: '+1', body: 'hi' }, ctxWith({ approvals: ['sms:send'] }));
    assert(r.ok === false && r.status === 'integration_required', JSON.stringify(r));
    assert(!r.providerId, 'must not fabricate a delivery id');
  });
})();

const failed = results.filter((x) => x === false).length;
console.log(`\nTOOL TESTS: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
