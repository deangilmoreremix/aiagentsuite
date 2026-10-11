// Netlify Function: agent execution entry point (POST /api/agents).
// Real execution requires an authenticated Supabase user (protects OpenAI
// credits from unauthenticated calls). Demo mode is safe and returns a clearly
// labeled simulated result without any paid API call.
import { runAgent, runWorkflow } from '../../server/agents/orchestrator.mjs';
import { getServiceClient } from '../../server/supabase/serviceClient.mjs';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

async function authenticate(event) {
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return { user: null };
  const sb = getServiceClient();
  if (!sb) return { user: null };
  try {
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return { user: null };
    return { user: data.user };
  } catch {
    return { user: null };
  }
}

export async function handler(event) {
  if ((event.httpMethod || 'POST').toUpperCase() !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const { user } = await authenticate(event);
  const mode = body.mode === 'real' ? 'real' : 'demo';

  // Authenticated + tenant-scoped for real execution (per-user tenant isolation).
  if (mode === 'real' && !user) {
    return json(401, { status: 'unauthenticated', message: 'Real execution requires a signed-in user (Bearer token).' });
  }

  const context = {
    tenantId: user?.id || null,
    userId: user?.id || null,
    mode,
    approvals: Array.isArray(body.approvals) ? body.approvals : [],
  };

  try {
    if (body.workflowKey) {
      const result = await runWorkflow({ workflowKey: body.workflowKey, input: body.input || '', context });
      return json(200, result);
    }
    if (!body.agentKey) return json(400, { error: 'agentKey required' });
    const result = await runAgent({ agentKey: body.agentKey, input: body.input || '', context });
    return json(200, result);
  } catch (e) {
    return json(500, { status: 'error', error: String(e?.message || e) });
  }
}
