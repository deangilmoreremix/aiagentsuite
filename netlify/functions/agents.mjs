// Netlify Function: agent execution entry point (POST /api/agents).
// Real execution requires an authenticated Supabase user (protects OpenAI
// credits from unauthenticated calls). Demo mode is safe and returns a clearly
// labeled simulated result without any paid API call.
import { runAgent, runWorkflow } from '../../server/agents/orchestrator.mjs';
import { getServiceClient } from '../../server/supabase/serviceClient.mjs';
import { resolveApprovals } from '../../server/agents/approvals.mjs';
import { getTenantIdForUser } from '../../server/supabase/tenancy.mjs';

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

  // Authenticated + tenant-scoped for real execution.
  if (mode === 'real' && !user) {
    return json(401, { status: 'unauthenticated', message: 'Real execution requires a signed-in user (Bearer token).' });
  }

  // tenant_id is NOT auth.uid(): resolve the real tenant via the verified
  // ownership model (tenant_members). Real execution requires membership.
  let tenantId = null;
  if (mode === 'real') {
    tenantId = await getTenantIdForUser(user.id);
    if (!tenantId) {
      return json(403, { status: 'no_tenant', message: 'Authenticated user is not a member of any tenant.' });
    }
  }

  const identity = {
    tenantId,
    userId: user?.id || null,
    mode,
  };

  // Approvals are SERVER-VERIFIED: the client sends approvalIds (references to
  // agentx_approvals rows) which are validated against the tenant/user/status
  // and consumed once (bound to this execution via runRef). A client-supplied
  // action-name array is never trusted.
  const runRef = crypto.randomUUID();
  const approvalIds = Array.isArray(body.approvalIds) ? body.approvalIds.filter((x) => typeof x === 'string') : [];
  let approvedActions = new Set();
  try {
    approvedActions = await resolveApprovals(identity, approvalIds, runRef);
  } catch {
    approvedActions = new Set();
  }
  const context = { ...identity, approvedActions, runRef };

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
