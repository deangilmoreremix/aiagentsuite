// Client for the server-side agent runtime. Uses plain fetch to the Netlify
// Functions (/api/agent-status, /api/agents). NEVER imports the Agents SDK or
// any server-only module — it only performs HTTP calls.
import type { AgentStatusInfo, AgentRunResult } from './agentCatalog';
import { supabase } from '../services/supabaseClient';

export interface AgentStatusResponse {
  model: string;
  integrations: Record<string, boolean>;
  agents: AgentStatusInfo[];
}

export async function fetchAgentStatus(): Promise<AgentStatusResponse> {
  const res = await fetch('/api/agent-status', { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`agent-status ${res.status}`);
  return res.json();
}

// In-app sign-in (owner signs in through the normal UI; the access token is
// held in memory only and never printed or logged).
export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

// The current session's access token (from the app's own Supabase session).
// Never logged or displayed.
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export async function getSessionEmail(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.email || null;
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

// ----- Owner approval workflow (in-app; no JWT pasting) ----------------------
export async function listApprovals(): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('unauthenticated');
  const res = await fetch('/api/agent-approvals', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`approvals ${res.status}`);
  const data = await res.json();
  return data.approvals || [];
}

export async function createApproval(action: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('unauthenticated');
  const res = await fetch('/api/agent-approvals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  if (!res.ok || !data.approval?.id) throw new Error(data.error || `approval_create_${res.status}`);
  return data.approval.id;
}

export async function approveApproval(id: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('unauthenticated');
  const res = await fetch('/api/agent-approvals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id, decision: 'approved' }),
  });
  if (!res.ok) throw new Error(`approval_resolve_${res.status}`);
}

interface RunOptions {
  mode?: 'demo' | 'real';
  approvals?: string[];
  token?: string | null;
}

export async function runAgentTask(agentKey: string, input: string, opts: RunOptions = {}): Promise<AgentRunResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch('/api/agents', {
    method: 'POST',
    headers,
    body: JSON.stringify({ agentKey, input, mode: opts.mode || 'demo', approvalIds: opts.approvals || [] }),
  });
  return res.json();
}

export async function runWorkflowTask(workflowKey: string, input: string, opts: RunOptions = {}): Promise<AgentRunResult & { steps?: any[] }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch('/api/agents', {
    method: 'POST',
    headers,
    body: JSON.stringify({ workflowKey, input, mode: opts.mode || 'demo', approvalIds: opts.approvals || [] }),
  });
  return res.json();
}
