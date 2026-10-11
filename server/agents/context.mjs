// Extract the per-run execution context from an Agents SDK RunContext.
// Authorization comes from a server-verified Set of approved action names
// (built in netlify/functions/agents.mjs from DB approval records). A client
// can never grant an approval by simply listing an action name.
import { integrations, llmReady } from './config.mjs';

function toActionSet(v) {
  if (v instanceof Set) return v;
  if (Array.isArray(v)) return new Set(v);
  return new Set();
}

export function getRunContext(runContext) {
  const raw = (runContext && runContext.context) || {};
  const approvedActions = toActionSet(raw.approvedActions);
  return {
    tenantId: raw.tenantId || null,
    userId: raw.userId || null,
    mode: raw.mode === 'real' ? 'real' : 'demo',
    approvedActions,
    // Approval is only satisfied by a server-verified record (see approvals.mjs).
    isApproved: (action) => approvedActions.has(String(action)),
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
