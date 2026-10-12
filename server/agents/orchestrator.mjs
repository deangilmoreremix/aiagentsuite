// Server-side agent orchestration using the OpenAI Agents SDK. SERVER-ONLY.
import { Agent, Runner, setDefaultOpenAIKey, setTracingDisabled } from '@openai/agents';
import { getAgent, agentReadiness } from './registry.mjs';
import { OPENAI_API_KEY, AGENT_MODEL, integrations } from './config.mjs';
import { getRunContext } from './context.mjs';
import { recordAgentRun } from './persistence.mjs';
import { createCrmTools } from './tools/crm.mjs';
import { createEmailTools } from './tools/integrations.mjs';
import { createCalendarTools } from './tools/integrations.mjs';
import { createMessagingTools } from './tools/integrations.mjs';
import { createWorkflowTools } from './tools/workflow.mjs';

// Avoid extra tracing round-trips / key usage in serverless.
try { if (typeof setTracingDisabled === 'function') setTracingDisabled(true); } catch { /* ignore */ }

const TOOLS_BY_NAME = new Map(
  [...createCrmTools(), ...createEmailTools(), ...createCalendarTools(), ...createMessagingTools(), ...createWorkflowTools()]
    .map((t) => [t.name, t])
);

export function listAvailableToolNames() {
  return [...TOOLS_BY_NAME.keys()];
}

export function agentToolNames(key) {
  const def = getAgent(key);
  return def ? def.tools.slice() : [];
}

export function buildAgent(key) {
  const def = getAgent(key);
  if (!def) throw new Error(`unknown_agent:${key}`);
  const readiness = agentReadiness(def);
  let instructions = def.instructions;
  if (readiness.blockedIntegrations.length) {
    instructions += `\n\nUnavailable integrations: ${readiness.blockedIntegrations.join(', ')}. For any action requiring them, report status "integration_required" instead of pretending to perform it.`;
  }
  const tools = (def.tools || []).map((n) => TOOLS_BY_NAME.get(n)).filter(Boolean);
  return new Agent({ name: def.name, instructions, model: AGENT_MODEL, tools });
}

function extractToolCalls(result) {
  const calls = [];
  const byId = new Map();
  try {
    const items = result?.newItems || result?.history || [];
    for (const it of items) {
      const raw = it?.rawItem || it;
      const type = raw?.type || it?.type;
      if (type === 'function_call') {
        const call = { name: raw.name, arguments: raw.arguments, callId: raw.callId, output: undefined };
        calls.push(call);
        if (raw.callId) byId.set(raw.callId, call);
      } else if (type === 'function_call_result' || type === 'function_call_output') {
        const callId = raw?.callId || raw?.call_id;
        const out = raw?.output ?? raw?.result;
        if (callId && byId.has(callId)) {
          byId.get(callId).output = typeof out === 'string' ? out : safeStringify(out);
        }
      }
    }
  } catch { /* best-effort */ }
  return calls;
}

function safeStringify(v) {
  try { return JSON.stringify(v); } catch { return String(v); }
}

/**
 * Run a single agent. mode 'real' performs real OpenAI + tool execution;
 * 'demo' returns an explicitly-labeled simulated response.
 */
export async function runAgent({ agentKey, input, context }) {
  const def = getAgent(agentKey);
  if (!def) return { status: 'error', agentKey, error: 'unknown_agent' };
  const mode = context?.mode === 'real' ? 'real' : 'demo';
  const readiness = agentReadiness(def);

  if (mode !== 'real') {
    return {
      status: 'completed_demo',
      agentKey,
      agentName: def.name,
      mode,
      output: `[Demo mode] ${def.name} would process: ${String(input).slice(0, 200)}`,
      toolCalls: [],
      note: 'Simulated demo response. Switch to Real mode for live execution.',
    };
  }

  if (!integrations.openaiLLM) {
    await recordAgentRun({ tenantId: context?.tenantId, userId: context?.userId, agentKey, status: 'integration_required', mode, input, error: 'openai_not_configured' });
    return { status: 'integration_required', agentKey, agentName: def.name, integration: 'openai', message: 'Real mode requires a server-side OpenAI key.' };
  }

  try {
    setDefaultOpenAIKey(OPENAI_API_KEY);
    const agent = buildAgent(agentKey);
    const runner = new Runner();
    const result = await runner.run(agent, String(input), { context: { tenantId: context?.tenantId, userId: context?.userId, mode, approvedActions: context?.approvedActions instanceof Set ? context.approvedActions : new Set() } });
    const toolCalls = extractToolCalls(result);
    const run = await recordAgentRun({ tenantId: context?.tenantId, userId: context?.userId, agentKey, status: 'completed', mode, input, result: { output: result.finalOutput, toolCalls } });
    return {
      status: 'completed',
      agentKey,
      agentName: def.name,
      mode,
      output: result.finalOutput,
      toolCalls,
      runId: run.data?.id || null,
      blockedIntegrations: readiness.blockedIntegrations,
    };
  } catch (e) {
    await recordAgentRun({ tenantId: context?.tenantId, userId: context?.userId, agentKey, status: 'failed', mode, input, error: String(e?.message || e) });
    return { status: 'failed', agentKey, agentName: def.name, error: String(e?.message || e) };
  }
}

// Predefined multi-agent plans (relevant agents only — never all 16).
export const WORKFLOW_PLANS = {
  qualify_lead: [
    { agentKey: 'ai_sdr', label: 'Retrieve + qualify the CRM lead' },
    { agentKey: 'lead_scoring', label: 'Score the lead' },
    { agentKey: 'ai_ae', label: 'Determine opportunity strategy' },
    { agentKey: 'personalized_email', label: 'Prepare outreach email (approval required to send)', requiresApproval: 'email:send' },
  ],
};

/**
 * Run a multi-agent workflow sequentially, propagating failures and pausing on
 * steps that require approval before a consequential action.
 */
export async function runWorkflow({ workflowKey, input, context }) {
  const plan = WORKFLOW_PLANS[workflowKey];
  if (!plan) return { status: 'error', error: 'unknown_workflow' };
  const mode = context?.mode === 'real' ? 'real' : 'demo';
  const steps = [];
  let carried = input;
  const approved = context?.approvedActions instanceof Set ? context.approvedActions : new Set(Array.isArray(context?.approvedActions) ? context.approvedActions : []);

  for (const step of plan) {
    if (step.requiresApproval && !approved.has(step.requiresApproval)) {
      steps.push({ agentKey: step.agentKey, label: step.label, status: 'awaiting_approval', approvalAction: step.requiresApproval });
      return { status: 'awaiting_approval', workflowKey, mode, steps, completedThrough: steps.length - 1 };
    }
    const r = await runAgent({ agentKey: step.agentKey, input: carried, context });
    steps.push({ agentKey: step.agentKey, label: step.label, status: r.status, output: r.output, toolCalls: r.toolCalls, blockedIntegrations: r.blockedIntegrations, error: r.error });
    if (r.status === 'failed' || r.status === 'error' || r.status === 'integration_required') {
      return { status: r.status === 'completed_demo' ? 'completed' : r.status, workflowKey, mode, steps, failureAt: step.agentKey, message: r.message || r.error };
    }
    // Carry the previous agent's structured output forward as context.
    carried = `${carried}\n\n[${step.agentKey} output]: ${r.output}`;
  }

  return { status: 'completed', workflowKey, mode, steps };
}
