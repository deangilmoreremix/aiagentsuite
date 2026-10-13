// Netlify Function: owner approval workflow (POST/GET /api/agent-approvals).
// Lets an authenticated tenant member CREATE pending approval requests and
// APPROVE/REJECT them in-app. Approvals are persisted in agentx_approvals and
// consumed server-side by consumeApprovals() (single-use). No client can grant
// an approval by simply naming an action.
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
    const tenantId = await getTenantIdForUser(data.user.id);
    return { user: data.user, tenantId };
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

  const method = (event.httpMethod || 'GET').toUpperCase();

  if (method === 'GET') {
    const { data, error } = await sb
      .from('agentx_approvals')
      .select('id, action, status, payload, created_at, resolved_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return json(500, { error: error.message });
    return json(200, { approvals: data });
  }

  if (method !== 'POST') return json(405, { error: 'Method Not Allowed' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }

  // Resolve (approve/reject) an existing request.
  if (body.id && body.decision) {
    const decision = body.decision === 'approved' ? 'approved' : 'rejected';
    const { data, error } = await sb
      .from('agentx_approvals')
      .update({ status: decision, resolved_by: user.id, resolved_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('id', body.id)
      .eq('status', 'pending') // only pending can transition
      .select('id, action, status')
      .single();
    if (error) return json(409, { error: error.message });
    return json(200, { approval: data });
  }

  // Create a new pending approval request.
  if (!body.action) return json(400, { error: 'action required' });
  const { data, error } = await sb
    .from('agentx_approvals')
    .insert({ tenant_id: tenantId, agent_key: body.agentKey || null, action: body.action, payload: body.payload || {}, status: 'pending' })
    .select('id, action, status')
    .single();
  if (error) return json(500, { error: error.message });
  return json(201, { approval: data });
}
