// Extract the per-run execution context from an Agents SDK RunContext.
// The caller (Netlify function) supplies { tenantId, userId, mode, approvals }.
import { integrations, llmReady } from './config.mjs';

export function getRunContext(runContext) {
  const raw = (runContext && runContext.context) || {};
  return {
    tenantId: raw.tenantId || null,
    userId: raw.userId || null,
    mode: raw.mode === 'real' ? 'real' : 'demo',
    approvals: Array.isArray(raw.approvals) ? raw.approvals : [],
    // Approval is required (and hard-gated here) for consequential actions.
    isApproved: (action) => {
      const key = String(action || '').toLowerCase();
      return raw.approvals.some((a) => String(a).toLowerCase() === key);
    },
    llmReady,
    integrations,
  };
}

export function requireTenant(ctx) {
  if (!ctx.tenantId) {
    const err = new Error('tenant_required');
    err.code = 'TENANT_REQUIRED';
    throw err;
  }
}
