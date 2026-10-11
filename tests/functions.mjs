// Unit tests for the server-side Netlify Functions.
// Verifies: demo mode with no keys, status returns booleans only, method guard,
// and that a provider key is NEVER included in any response (fail-closed).
import assert from 'node:assert/strict';
import { handler as statusH } from '../netlify/functions/status.mjs';
import { handler as llmH } from '../netlify/functions/llm.mjs';

const results = [];
const check = async (n, fn) => {
  try { await fn(); results.push(true); console.log('PASS - ' + n); }
  catch (e) { results.push(false); console.log('FAIL - ' + n + ' :: ' + e.message); }
};

const SECRET = /sk-[A-Za-z0-9_-]{12,}|AIza[0-9A-Za-z_-]{20,}/;

// Deterministic demo mode: ensure no provider keys are present.
delete process.env.OPENAI_API_KEY;
delete process.env.GEMINI_API_KEY;

await check('status returns booleans only and contains no secret', async () => {
  const r = await statusH();
  const body = JSON.parse(r.body);
  assert.equal(r.statusCode, 200);
  assert.equal(typeof body.openai, 'boolean');
  assert.equal(typeof body.gemini, 'boolean');
  assert.equal(typeof body.elevenlabs, 'boolean');
  assert.equal(typeof body.composio, 'boolean');
  assert.ok(!SECRET.test(r.body), 'status body should contain no secret');
});

await check('llm openai text -> demo simulated response', async () => {
  const r = await llmH({ httpMethod: 'POST', body: JSON.stringify({ provider: 'openai', op: 'text', prompt: 'hello world' }) });
  const b = JSON.parse(r.body);
  assert.equal(r.statusCode, 200);
  assert.equal(b.demo, true);
  assert.match(b.text, /Simulated response to: hello world/);
  assert.ok(!SECRET.test(r.body));
});

await check('llm openai response -> demo output_text shape', async () => {
  const r = await llmH({ httpMethod: 'POST', body: JSON.stringify({ provider: 'openai', op: 'response', input: 'ctx', messages: [] }) });
  const b = JSON.parse(r.body);
  assert.equal(b.demo, true);
  assert.equal(typeof b.output_text, 'string');
});

await check('llm gemini -> demo simulated response', async () => {
  const r = await llmH({ httpMethod: 'POST', body: JSON.stringify({ provider: 'gemini', op: 'text', prompt: 'hi' }) });
  const b = JSON.parse(r.body);
  assert.equal(b.demo, true);
  assert.match(b.text, /Simulated Gemini response/);
});

await check('llm rejects non-POST', async () => {
  const r = await llmH({ httpMethod: 'GET', body: '{}' });
  assert.equal(r.statusCode, 405);
});

// Fail-closed: with a (fake) key set, any upstream failure must degrade to demo
// WITHOUT echoing the key. (Network may be blocked or the call 401s; both are
// caught and produce a simulated response that never contains the key.)
await check('llm never echoes a provider key (fail-closed)', async () => {
  process.env.OPENAI_API_KEY = 'sk-TESTCANARYKEY_DO_NOT_ECHO_0123456789';
  try {
    const r = await llmH({ httpMethod: 'POST', body: JSON.stringify({ provider: 'openai', op: 'text', prompt: 'x' }) });
    assert.ok(!r.body.includes('TESTCANARYKEY_DO_NOT_ECHO'), 'response must never include the API key');
  } finally {
    delete process.env.OPENAI_API_KEY;
  }
});

const failed = results.filter((x) => x === false).length;
console.log(`\nFUNCTIONS SUMMARY: ${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
