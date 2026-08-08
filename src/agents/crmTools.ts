import { tool } from '@openai/agents';
import { z } from 'zod';
import { supabaseService } from '../services/supabaseClient';

// CRM-domain function tools implemented on top of the OpenAI Agents SDK.
// External channels (email / calendar / slack) are recorded as CRM activities
// since this build has no external provider; data actions hit Supabase when configured.

async function recordActivity(type: string, title: string, description: string) {
  if (supabaseService.isAvailable()) {
    try {
      await supabaseService.logActivity({
        customer_id: 'agent',
        type,
        title,
        description
      });
    } catch {
      /* non-fatal: logging is best-effort */
    }
  }
}

async function doSendEmail(p: { to: string; subject: string; body: string }) {
  await recordActivity('email', `Email to ${p.to}`, p.body);
  return { sent: true, to: p.to, subject: p.subject };
}

async function doCreateCalendarEvent(p: {
  title: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
}) {
  await recordActivity('calendar', p.title, `Event ${p.startTime} – ${p.endTime}`);
  return {
    created: true,
    title: p.title,
    startTime: p.startTime,
    endTime: p.endTime,
    attendees: p.attendees ?? []
  };
}

async function doSendSlackMessage(p: { channel: string; message: string }) {
  await recordActivity('slack', `Slack #${p.channel}`, p.message);
  return { sent: true, channel: p.channel, message: p.message };
}

async function doCreateContact(p: {
  first_name: string;
  last_name: string;
  email?: string;
  company?: string;
}) {
  const contact = await supabaseService.createContact(p);
  return { created: true, contact };
}

async function doUpdateContact(p: { id: string; updates: Record<string, any> }) {
  const contact = await supabaseService.updateContact(p.id, p.updates);
  return { updated: true, contact };
}

async function doCreateDeal(p: {
  title: string;
  value?: number;
  customer_id?: string;
}) {
  const deal = await supabaseService.createDeal(p);
  return { created: true, deal };
}

async function doLogActivity(p: {
  customer_id: string;
  type: string;
  title: string;
  description?: string;
}) {
  const activity = await supabaseService.logActivity(p);
  return { logged: true, activity };
}

async function doSearchContacts(p: { query: string }) {
  const contacts = (await supabaseService.getContacts()) as Array<Record<string, any>>;
  const q = p.query.toLowerCase();
  const matches = contacts
    .filter((c) =>
      `${c.first_name ?? ''} ${c.last_name ?? ''} ${c.email ?? ''} ${c.company ?? ''}`
        .toLowerCase()
        .includes(q)
    )
    .slice(0, 10);
  return { results: matches };
}

export const crmTools = [
  tool({
    name: 'send_email',
    description: 'Send an email message to a recipient (recorded as a CRM activity).',
    parameters: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string()
    }),
    async execute(p) {
      return doSendEmail(p);
    }
  }),
  tool({
    name: 'create_calendar_event',
    description: 'Create a calendar event.',
    parameters: z.object({
      title: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      attendees: z.array(z.string()).optional()
    }),
    async execute(p) {
      return doCreateCalendarEvent(p);
    }
  }),
  tool({
    name: 'send_slack_message',
    description: 'Send a message to a Slack channel.',
    parameters: z.object({
      channel: z.string(),
      message: z.string()
    }),
    async execute(p) {
      return doSendSlackMessage(p);
    }
  }),
  tool({
    name: 'create_contact',
    description: 'Create a new contact in the CRM.',
    parameters: z.object({
      first_name: z.string(),
      last_name: z.string(),
      email: z.string().optional(),
      company: z.string().optional()
    }),
    async execute(p) {
      return doCreateContact(p);
    }
  }),
  tool({
    name: 'update_contact',
    description: 'Update an existing contact.',
    parameters: z.object({
      id: z.string(),
      updates: z.record(z.string(), z.any())
    }),
    async execute(p) {
      return doUpdateContact(p);
    }
  }),
  tool({
    name: 'create_deal',
    description: 'Create a new deal/opportunity in the CRM.',
    parameters: z.object({
      title: z.string(),
      value: z.number().optional(),
      customer_id: z.string().optional()
    }),
    async execute(p) {
      return doCreateDeal(p);
    }
  }),
  tool({
    name: 'log_activity',
    description: 'Log a CRM activity.',
    parameters: z.object({
      customer_id: z.string(),
      type: z.string(),
      title: z.string(),
      description: z.string().optional()
    }),
    async execute(p) {
      return doLogActivity(p);
    }
  }),
  tool({
    name: 'search_contacts',
    description: 'Search contacts in the CRM by name, email, or company.',
    parameters: z.object({
      query: z.string()
    }),
    async execute(p) {
      return doSearchContacts(p);
    }
  })
];

// Direct (non-agent) invocation used by the legacy tool-execution switch.
export async function executeCrmTool(toolName: string, parameters: any): Promise<any> {
  switch (toolName) {
    case 'send_email':
      return doSendEmail(parameters);
    case 'create_calendar_event':
      return doCreateCalendarEvent(parameters);
    case 'send_slack_message':
      return doSendSlackMessage(parameters);
    case 'create_contact':
      return doCreateContact(parameters);
    case 'update_contact':
      return doUpdateContact(parameters);
    case 'create_deal':
      return doCreateDeal(parameters);
    case 'log_activity':
      return doLogActivity(parameters);
    case 'search_contacts':
      return doSearchContacts(parameters);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
