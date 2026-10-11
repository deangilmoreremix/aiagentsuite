// Supabase CRM tools (server-side, real). Readable tools are open; mutating
// tools require an explicit approval token in the run context (human approval
// for consequential actions). Returns structured JSON; never fabricates a row.
import { z } from 'zod';
import { tool } from '@openai/agents';
import { getRunContext } from '../context.mjs';
import { getServiceClient } from '../../supabase/serviceClient.mjs';

const res = (obj) => JSON.stringify(obj);

function crmContext(runContext) {
  const ctx = getRunContext(runContext);
  const sb = getServiceClient();
  return { ctx, sb };
}

function blocked(action) {
  return res({ ok: false, status: 'integration_required', integration: 'supabase', action });
}

function needsApproval(ctx, action) {
  if (!ctx.isApproved(action)) {
    return res({ ok: false, status: 'awaiting_approval', approvalAction: action });
  }
  return null;
}

export function createCrmTools() {
  return [
    tool({
      name: 'search_contacts',
      description: 'Search CRM contacts for the current tenant by name, email, or company.',
      parameters: z.object({
        query: z.string().describe('Name, email, or company substring'),
        limit: z.number().int().min(1).max(50).optional(),
      }),
      execute: async (args, runCtx) => {
        const { ctx, sb } = crmContext(runCtx);
        if (!sb) return blocked('search_contacts');
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        let q = sb.from('contacts').select('id, name, email, phone, company, status, score, created_at').eq('tenant_id', ctx.tenantId).limit(args.limit || 20);
        q = q.or(`name.ilike.%${args.query}%,email.ilike.%${args.query}%,company.ilike.%${args.query}%`);
        const { data, error } = await q;
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, count: data.length, contacts: data });
      },
    }),

    tool({
      name: 'get_contact',
      description: 'Retrieve a single CRM contact by id (tenant-scoped).',
      parameters: z.object({ id: z.string() }),
      execute: async (args, runCtx) => {
        const { ctx, sb } = crmContext(runCtx);
        if (!sb) return blocked('get_contact');
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        const { data, error } = await sb.from('contacts').select('*').eq('tenant_id', ctx.tenantId).eq('id', args.id).single();
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, contact: data });
      },
    }),

    tool({
      name: 'create_contact',
      description: 'Create a CRM contact. Requires approval token "crm:create_contact".',
      parameters: z.object({ name: z.string(), email: z.string().email().optional(), phone: z.string().optional(), company: z.string().optional() }),
      execute: async (args, runCtx) => {
        const { ctx, sb } = crmContext(runCtx);
        if (!sb) return blocked('create_contact');
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        const gated = needsApproval(ctx, 'crm:create_contact');
        if (gated) return gated;
        const { data, error } = await sb.from('contacts').insert({ tenant_id: ctx.tenantId, ...args }).select('id').single();
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, status: 'completed', id: data.id });
      },
    }),

    tool({
      name: 'update_contact',
      description: 'Update a CRM contact (e.g., lead status). Requires approval "crm:update_contact".',
      parameters: z.object({ id: z.string(), status: z.string().optional(), notes: z.string().optional() }),
      execute: async (args, runCtx) => {
        const { ctx, sb } = crmContext(runCtx);
        if (!sb) return blocked('update_contact');
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        const gated = needsApproval(ctx, 'crm:update_contact');
        if (gated) return gated;
        const { id, ...patch } = args;
        const { data, error } = await sb.from('contacts').update(patch).eq('tenant_id', ctx.tenantId).eq('id', id).select('id').single();
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, status: 'completed', id: data.id, updated: patch });
      },
    }),

    tool({
      name: 'search_deals',
      description: 'Search CRM deals/opportunities for the current tenant.',
      parameters: z.object({ query: z.string().optional(), stage: z.string().optional(), limit: z.number().int().min(1).max(50).optional() }),
      execute: async (args, runCtx) => {
        const { ctx, sb } = crmContext(runCtx);
        if (!sb) return blocked('search_deals');
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        let q = sb.from('deals').select('id, contact_id, title, stage, amount, created_at').eq('tenant_id', ctx.tenantId).limit(args.limit || 20);
        if (args.stage) q = q.eq('stage', args.stage);
        if (args.query) q = q.ilike('title', `%${args.query}%`);
        const { data, error } = await q;
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, count: data.length, deals: data });
      },
    }),

    tool({
      name: 'update_deal',
      description: 'Update a deal/stage. Requires approval "crm:update_deal".',
      parameters: z.object({ id: z.string(), stage: z.string().optional(), amount: z.number().optional() }),
      execute: async (args, runCtx) => {
        const { ctx, sb } = crmContext(runCtx);
        if (!sb) return blocked('update_deal');
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        const gated = needsApproval(ctx, 'crm:update_deal');
        if (gated) return gated;
        const { id, ...patch } = args;
        const { data, error } = await sb.from('deals').update(patch).eq('tenant_id', ctx.tenantId).eq('id', id).select('id').single();
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, status: 'completed', id: data.id, updated: patch });
      },
    }),

    tool({
      name: 'create_task',
      description: 'Create a follow-up task. Requires approval "crm:create_task".',
      parameters: z.object({ title: z.string(), contactId: z.string().optional(), dueDate: z.string().optional() }),
      execute: async (args, runCtx) => {
        const { ctx, sb } = crmContext(runCtx);
        if (!sb) return blocked('create_task');
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        const gated = needsApproval(ctx, 'crm:create_task');
        if (gated) return gated;
        const { data, error } = await sb
          .from('tasks')
          .insert({ tenant_id: ctx.tenantId, title: args.title, contact_id: args.contactId || null, due_date: args.dueDate || null, status: 'pending' })
          .select('id')
          .single();
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, status: 'completed', id: data.id });
      },
    }),

    tool({
      name: 'get_tasks',
      description: 'List follow-up tasks for the current tenant, optionally filtered by status.',
      parameters: z.object({ status: z.string().optional(), limit: z.number().int().min(1).max(50).optional() }),
      execute: async (args, runCtx) => {
        const { ctx, sb } = crmContext(runCtx);
        if (!sb) return blocked('get_tasks');
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        let q = sb.from('tasks').select('id, title, status, due_date, contact_id').eq('tenant_id', ctx.tenantId).limit(args.limit || 20);
        if (args.status) q = q.eq('status', args.status);
        const { data, error } = await q;
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, count: data.length, tasks: data });
      },
    }),

    tool({
      name: 'update_lead_score',
      description: 'Write a lead score to the CRM record, only confirmed by the DB. Requires approval "crm:update_lead_score".',
      parameters: z.object({ id: z.string(), score: z.number().min(0).max(100), reason: z.string().optional() }),
      execute: async (args, runCtx) => {
        const { ctx, sb } = crmContext(runCtx);
        if (!sb) return blocked('update_lead_score');
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        const gated = needsApproval(ctx, 'crm:update_lead_score');
        if (gated) return gated;
        const { data, error } = await sb.from('contacts').update({ score: args.score }).eq('tenant_id', ctx.tenantId).eq('id', args.id).select('id, score').single();
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, status: 'completed', id: data.id, confirmedScore: data.score, reason: args.reason || null });
      },
    }),

    tool({
      name: 'record_activity',
      description: 'Append an activity/interaction note to a contact timeline. Requires approval "crm:record_activity".',
      parameters: z.object({ contactId: z.string().optional(), dealId: z.string().optional(), type: z.string(), note: z.string() }),
      execute: async (args, runCtx) => {
        const { ctx, sb } = crmContext(runCtx);
        if (!sb) return blocked('record_activity');
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        const gated = needsApproval(ctx, 'crm:record_activity');
        if (gated) return gated;
        const { data, error } = await sb
          .from('activities')
          .insert({ tenant_id: ctx.tenantId, contact_id: args.contactId || null, deal_id: args.dealId || null, type: args.type, note: args.note })
          .select('id')
          .single();
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, status: 'completed', id: data.id });
      },
    }),
  ];
}
