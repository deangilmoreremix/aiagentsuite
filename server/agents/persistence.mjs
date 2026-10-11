// Durable execution persistence (Supabase). All writes are tenant-scoped.
// Every function degrades safely to a no-op when Supabase is not configured,
// returning { persisted:false, reason:'...' } instead of throwing.
import { getServiceClient } from '../supabase/serviceClient.mjs';

const ok = (data) => ({ persisted: true, data });
const noop = (reason) => ({ persisted: false, reason });

export async function recordAgentRun({ tenantId, userId, agentKey, status, mode, input, result, error, traceId, idempotencyKey }) {
  const sb = getServiceClient();
  if (!sb) return noop('supabase_not_configured');
  try {
    const { data, error } = await sb
      .from('agentx_runs')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        agent_key: agentKey,
        status,
        mode,
        input,
        result,
        error,
        trace_id: traceId,
        idempotency_key: idempotencyKey || null,
      })
      .select('id')
      .single();
    if (error) return noop(error.message);
    return ok(data);
  } catch (e) {
    return noop(e.message);
  }
}

export async function recordToolExecution({ tenantId, runId, agentKey, tool, args, result, status }) {
  const sb = getServiceClient();
  if (!sb) return noop('supabase_not_configured');
  try {
    const { data, error } = await sb
      .from('agentx_tool_executions')
      .insert({ tenant_id: tenantId, run_id: runId, agent_key: agentKey, tool, args, result, status })
      .select('id')
      .single();
    if (error) return noop(error.message);
    return ok(data);
  } catch (e) {
    return noop(e.message);
  }
}

export async function requestApproval({ tenantId, runId, agentKey, action, payload }) {
  const sb = getServiceClient();
  if (!sb) return noop('supabase_not_configured');
  try {
    const { data, error } = await sb
      .from('agentx_approvals')
      .insert({ tenant_id: tenantId, run_id: runId, agent_key: agentKey, action, payload, status: 'pending' })
      .select('id')
      .single();
    if (error) return noop(error.message);
    return ok(data);
  } catch (e) {
    return noop(e.message);
  }
}

export async function recordWorkflowRun({ tenantId, userId, workflowKey, status, steps, mode }) {
  const sb = getServiceClient();
  if (!sb) return noop('supabase_not_configured');
  try {
    const { data, error } = await sb
      .from('agentx_workflow_runs')
      .insert({ tenant_id: tenantId, user_id: userId, workflow_key: workflowKey, status, steps, mode })
      .select('id')
      .single();
    if (error) return noop(error.message);
    return ok(data);
  } catch (e) {
    return noop(e.message);
  }
}

export async function getWorkflowStatus({ tenantId, workflowRunId }) {
  const sb = getServiceClient();
  if (!sb) return { persisted: false, reason: 'supabase_not_configured' };
  try {
    const { data, error } = await sb
      .from('agentx_workflow_runs')
      .select('id, workflow_key, status, steps, mode, created_at')
      .eq('tenant_id', tenantId)
      .eq('id', workflowRunId)
      .single();
    if (error) return { persisted: false, error: error.message };
    return { persisted: true, data };
  } catch (e) {
    return { persisted: false, error: e.message };
  }
}

// Idempotency: has this consequential action already been performed for this
// tenant/key? Prevents duplicate sends/updates on retries.
export async function alreadyPerformed({ tenantId, action, idempotencyKey }) {
  const sb = getServiceClient();
  if (!idempotencyKey) return false;
  if (!sb) return false;
  try {
    const { data } = await sb
      .from('agentx_tool_executions')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('tool', action)
      .eq('idempotency_key', idempotencyKey)
      .limit(1);
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}
