// Agent workflow + approval tools. Durable via Supabase; create_workflow and
// get_workflow_status are real when Supabase is configured.
import { z } from 'zod';
import { tool } from '@openai/agents';
import { getRunContext } from '../context.mjs';
import { recordWorkflowRun, getWorkflowStatus, requestApproval, recordToolExecution } from '../persistence.mjs';

const res = (o) => JSON.stringify(o);

export function createWorkflowTools() {
  return [
    tool({
      name: 'create_workflow',
      description: 'Create a durable workflow run and persist its planned steps. Requires approval "workflow:create".',
      parameters: z.object({ workflowKey: z.string(), steps: z.array(z.object({ agentKey: z.string(), input: z.string().optional() })) }),
      execute: async (args, runCtx) => {
        const ctx = getRunContext(runCtx);
        if (!ctx.isApproved('workflow:create')) return res({ ok: false, status: 'awaiting_approval', approvalAction: 'workflow:create' });
        const out = await recordWorkflowRun({ tenantId: ctx.tenantId, userId: ctx.userId, workflowKey: args.workflowKey, status: 'pending', steps: args.steps, mode: ctx.mode });
        if (!out.persisted) return res({ ok: false, status: 'integration_required', integration: 'supabase' });
        return res({ ok: true, status: 'completed', workflowRunId: out.data.id });
      },
    }),
    tool({
      name: 'get_workflow_status',
      description: 'Fetch a durable workflow run status by id.',
      parameters: z.object({ workflowRunId: z.string() }),
      execute: async (args, runCtx) => {
        const ctx = getRunContext(runCtx);
        const out = await getWorkflowStatus({ tenantId: ctx.tenantId, workflowRunId: args.workflowRunId });
        if (!out.persisted) return res({ ok: false, status: 'integration_required', integration: 'supabase' });
        return res({ ok: true, workflow: out.data });
      },
    }),
    tool({
      name: 'request_approval',
      description: 'Persist an approval request for a consequential action and pause for human approval.',
      parameters: z.object({ action: z.string(), payload: z.any().optional() }),
      execute: async (args, runCtx) => {
        const ctx = getRunContext(runCtx);
        const out = await requestApproval({ tenantId: ctx.tenantId, runId: null, agentKey: ctx._agentKey || null, action: args.action, payload: args.payload || {} });
        if (!out.persisted) return res({ status: 'awaiting_approval', approvalAction: args.action, persisted: false });
        return res({ ok: true, status: 'awaiting_approval', approvalId: out.data.id, approvalAction: args.action });
      },
    }),
    tool({
      name: 'record_execution_result',
      description: 'Persist the final execution result of the current run with verifiable identifiers.',
      parameters: z.object({ summary: z.string(), identifiers: z.record(z.string()).optional() }),
      execute: async (args, runCtx) => {
        const ctx = getRunContext(runCtx);
        const out = await recordToolExecution({ tenantId: ctx.tenantId, runId: ctx._runId || null, agentKey: ctx._agentKey || null, tool: 'record_execution_result', args, result: args, status: 'completed' });
        return res({ ok: true, status: 'completed', persisted: out.persisted });
      },
    }),
  ];
}
