// Server-verified approvals. Consequential actions are authorized ONLY by a
// real DB approval record that (a) belongs to the caller's tenant, (b) is in
// state 'approved', and (c) is consumed exactly once (single-use, preventing
// replay). Client-supplied action-name arrays are never trusted.
import { getServiceClient } from '../supabase/serviceClient.mjs';

// Atomically verify + consume approvals for this tenant/user. Only rows that
// match tenant + id + status='approved' are updated to 'consumed' and returned;
// anything forged / cross-tenant / already-consumed / unknown yields no rows.
export async function consumeApprovals(db, { tenantId, userId, approvalIds, runRef }) {
  if (!db || !tenantId || !Array.isArray(approvalIds) || approvalIds.length === 0) return [];
  const ids = approvalIds.filter((x) => typeof x === 'string');
  try {
    const { data, error } = await db
      .from('agentx_approvals')
      .update({ status: 'consumed', resolved_by: userId || null, resolved_at: new Date().toISOString(), run_ref: runRef || null })
      .eq('tenant_id', tenantId)
      .in('id', ids)
      .eq('status', 'approved')
      .select('id, action, tenant_id');
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// Resolve the set of action names the caller is authorized to perform for this
// run, derived from server-verified (and now consumed) approval records. Each
// consumed approval is bound to this execution via runRef.
export async function resolveApprovals(context, approvalIds, runRef) {
  const db = getServiceClient();
  const rows = await consumeApprovals(db, {
    tenantId: context?.tenantId,
    userId: context?.userId,
    approvalIds,
    runRef,
  });
  return new Set(rows.map((r) => r.action));
}
