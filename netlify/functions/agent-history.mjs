// Netlify Function: execution history (GET /api/agent-history) — read-back of
// durable run + tool-execution records (real database IDs) for the caller's
// tenant. Authenticated; tenant-scoped; never exposes another tenant's data.
import { getServiceClient } from '../../server/supabase/serviceClient.mjs';
import { getTenantIdForUser } from '../../server/supabase/tenancy.mjs';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

async function authUser(event) {
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return { user: null, tenantId: null };
  const sb = getServiceClient();
  if (!sb) return { user: null, tenantId: null };
  try {
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return { user: null, tenantId: null };
    return { user: data.user, tenantId: await getTenantIdForUser(data.user.id) };
  } catch {
    return { user: null, tenantId: null };
  }
}

export async function handler(event) {
  const sb = getServiceClient();
  if (!sb) return json(503, { error: 'supabase_not_configured' });
  const { user, tenantId } = await authUser(event);
  if (!user) return json(401, { status: 'unauthenticated' });
  if (!tenantId) return json(403, { status: 'no_tenant' });

  const limit = Math.min(Number(event.queryStringParameters?.limit) || 25, 100);
  const [runs, tools] = await Promise.all([
    sb.from('agentx_runs').select('id, agent_key, status, mode, trace_id, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(limit),
    sb.from('agentx_tool_executions').select('id, agent_key, tool, status, result, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(limit),
  ]);
  if (runs.error) return json(500, { error: runs.error.message });
  if (tools.error) return json(500, { error: tools.error.message });
  return json(200, { runs: runs.data, toolExecutions: tools.data });
}
