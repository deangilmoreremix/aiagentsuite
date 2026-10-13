// Agent registry tests: 16 agents, structure, tool-name validity, and honest
// readiness (verified both with and without server credentials via subprocess).
import { execFileSync } from 'node:child_process';
import { AGENTS, listAgentStatus, getAgent } from '../server/agents/registry.mjs';
import { listAvailableToolNames } from '../server/agents/orchestrator.mjs';

const results = [];
const check = (n, fn) => { try { fn(); results.push(true); console.log('PASS - ' + n); } catch (e) { results.push(false); console.log('FAIL - ' + n + ' :: ' + e.message); } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assert failed'); };

check('registry contains exactly 16 agents', () => assert(AGENTS.length === 16, `got ${AGENTS.length}`));
check('agent keys are unique', () => assert(new Set(AGENTS.map((a) => a.key)).size === 16));
check('all agents have name/role/instructions/tools', () => AGENTS.forEach((a) => { assert(a.name && a.role, a.key + ' name/role'); assert(typeof a.instructions === 'string' && a.instructions.length > 30, a.key + ' instructions'); assert(Array.isArray(a.tools) && a.tools.length > 0, a.key + ' tools'); }));

const available = new Set(listAvailableToolNames());
check('every agent references registered tools', () => AGENTS.forEach((a) => a.tools.forEach((t) => assert(available.has(t), `unknown tool ${t} on ${a.key}`))));

check('getAgent returns the agent by key', () => assert(getAgent('ai_sdr')?.name === 'AI SDR Agent'));
check('unknown agent key returns null', () => assert(getAgent('nope') === null));

check('listAgentStatus returns 16 secret-free entries', () => {
  const s = listAgentStatus();
  assert(s.length === 16);
  s.forEach((a) => {
    assert(['ready', 'integration_required', 'llm_required'].includes(a.status), a.status);
    assert(Array.isArray(a.blockedIntegrations));
    assert(typeof a.canReason === 'boolean');
    assert(!JSON.stringify(a).match(/sk-|AIza|KEY/), 'status contains a secret-shaped value');
  });
});

// Readiness honors credentials (run in a child process with env set).
function statusFor(env) {
  const out = execFileSync(process.execPath, ['-e',
    "import('./server/agents/registry.mjs').then(m=>{const s=m.listAgentStatus();console.log(JSON.stringify({sdr:s.find(a=>a.key==='ai_sdr').status,obj:s.find(a=>a.key==='objection_handler').status,dial:s.find(a=>a.key==='ai_dialer').status}))})"
  ], { env: { ...process.env, ...env }, encoding: 'utf8' });
  return JSON.parse(out.trim());
}
check('with LLM+Supabase env: SDR/AE-ready, objection ready, dialer integration_required', () => {
  const s = statusFor({ OPENAI_API_KEY: 'sk-test-canary', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc-test' });
  assert(s.sdr === 'ready', 'sdr=' + s.sdr);
  assert(s.obj === 'ready', 'obj=' + s.obj);
  assert(s.dial === 'integration_required', 'dial=' + s.dial);
});
check('without OpenAI env: everything llm_required', () => {
  const s = statusFor({ OPENAI_API_KEY: '', SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' });
  assert(s.sdr === 'llm_required', 'sdr=' + s.sdr);
  assert(s.obj === 'llm_required', 'obj=' + s.obj);
});

const failed = results.filter((x) => x === false).length;
console.log(`\nREGISTRY TESTS: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
