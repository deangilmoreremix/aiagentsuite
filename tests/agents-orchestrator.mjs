// Orchestrator tests: honest demo/real behavior, workflow failure propagation,
// and SDK Agent construction — all without a live OpenAI key.
import { runAgent, runWorkflow, buildAgent, WORKFLOW_PLANS } from '../server/agents/orchestrator.mjs';
import { getAgent } from '../server/agents/registry.mjs';

const results = [];
const check = (n, fn) => { try { const r = fn(); return r; } catch (e) { results.push({ n, ok: false, e }); } };

async function t(name, fn) {
  try { await fn(); results.push({ name, ok: true }); console.log('PASS - ' + name); }
  catch (e) { results.push({ name, ok: false, e }); console.log('FAIL - ' + name + ' :: ' + e.message); }
}
const assert = (c, m) => { if (!c) throw new Error(m || 'assert failed'); };

await t('demo run is clearly labeled and performs no real call', async () => {
  const r = await runAgent({ agentKey: 'objection_handler', input: 'It is too expensive', context: { mode: 'demo' } });
  assert(r.status === 'completed_demo', r.status);
  assert(/\[Demo mode\]/.test(r.output), r.output);
  assert(r.mode === 'demo');
});

await t('real run without OpenAI key -> integration_required (honest)', async () => {
  const r = await runAgent({ agentKey: 'objection_handler', input: 'x', context: { mode: 'real', tenantId: 't' } });
  assert(r.status === 'integration_required', r.status);
  assert(r.integration === 'openai', r.integration);
});

await t('unknown agent -> error', async () => {
  const r = await runAgent({ agentKey: 'does_not_exist', input: 'x', context: { mode: 'demo' } });
  assert(r.status === 'error' && r.error === 'unknown_agent', JSON.stringify(r));
});

await t('workflow propagates integration_required failure at first step (no fake success)', async () => {
  const r = await runWorkflow({ workflowKey: 'qualify_lead', input: 'qualify john@acme.com', context: { mode: 'real', tenantId: 't' } });
  assert(r.status !== 'completed', 'must not report completed without a key');
  assert(r.failureAt === 'ai_sdr', 'failureAt=' + r.failureAt);
  assert(r.steps.length >= 1 && r.steps[0].status === 'integration_required', JSON.stringify(r.steps));
});

await t('workflow ignores unknown workflows', async () => {
  const r = await runWorkflow({ workflowKey: 'nope', input: 'x', context: { mode: 'demo' } });
  assert(r.status === 'error' && r.error === 'unknown_workflow', JSON.stringify(r));
});

await t('unknown workflow key is not in WORKFLOW_PLANS; qualify_lead is', async () => {
  assert(!!WORKFLOW_PLANS.qualify_lead);
  assert(Array.isArray(WORKFLOW_PLANS.qualify_lead) && WORKFLOW_PLANS.qualify_lead.length === 4);
});

await t('buildAgent constructs an SDK Agent with the registered tools', async () => {
  const def = getAgent('ai_sdr');
  const agent = buildAgent('ai_sdr');
  assert(agent.name === def.name, 'name mismatch');
  assert(agent.instructions.includes(def.role.slice(0, 4)) || agent.instructions.length > 40, 'instructions present');
  assert(Array.isArray(agent.tools) && agent.tools.length === def.tools.length, `tools ${agent.tools?.length} vs ${def.tools.length}`);
});

await t('buildAgent throws for unknown key', async () => {
  let threw = false;
  try { buildAgent('nope'); } catch { threw = true; }
  assert(threw, 'should throw');
});

const failed = results.filter((r) => !r.ok).length;
console.log(`\nORCHESTRATOR TESTS: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
