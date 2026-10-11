// Client for the server-side agent runtime. Uses plain fetch to the Netlify
// Functions (/api/agent-status, /api/agents). NEVER imports the Agents SDK or
// any server-only module — it only performs HTTP calls.
import type { AgentStatusInfo, AgentRunResult } from './agentCatalog';

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
    body: JSON.stringify({ agentKey, input, mode: opts.mode || 'demo', approvals: opts.approvals || [] }),
  });
  return res.json();
}

export async function runWorkflowTask(workflowKey: string, input: string, opts: RunOptions = {}): Promise<AgentRunResult & { steps?: any[] }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch('/api/agents', {
    method: 'POST',
    headers,
    body: JSON.stringify({ workflowKey, input, mode: opts.mode || 'demo', approvals: opts.approvals || [] }),
  });
  return res.json();
}
