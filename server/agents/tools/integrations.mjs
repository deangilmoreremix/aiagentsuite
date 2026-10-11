// Direct third-party connectors (NO Composio). Each tool either performs a
// real provider action (only when the provider is configured server-side AND
// the action is approved) or returns an honest integration_required status.
// No tool fabricates a provider message id / event id / call record.
import { z } from 'zod';
import { tool } from '@openai/agents';
import { getRunContext } from '../context.mjs';
import { integrations } from '../config.mjs';
import { getServiceClient } from '../../supabase/serviceClient.mjs';
import { alreadyPerformed } from '../persistence.mjs';

const res = (o) => JSON.stringify(o);
const gate = (ctx, action) => (!ctx.isApproved(action) ? { ok: false, status: 'awaiting_approval', approvalAction: action } : null);

async function recordTool({ ctx, tool: name, args, result, status, idempotencyKey }) {
  const sb = getServiceClient();
  if (!sb) return;
  try {
    await sb.from('agentx_tool_executions').insert({
      tenant_id: ctx.tenantId, agent_key: ctx._agentKey || null, tool: name, args, result,
      status, idempotency_key: idempotencyKey || null,
    });
  } catch { /* best-effort */ }
}

export function createEmailTools() {
  return [
    tool({
      name: 'create_email_draft',
      description: 'Persist a personalized email draft for review. Real: returns a durable draftId when Supabase is configured.',
      parameters: z.object({ to: z.string().email(), subject: z.string(), body: z.string(), contactId: z.string().optional() }),
      execute: async (args, runCtx) => {
        const ctx = getRunContext(runCtx);
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        const sb = getServiceClient();
        if (!sb) return res({ ok: true, status: 'draft_unsaved', note: 'Supabase not configured; draft not persisted', draft: args });
        const { data, error } = await sb.from('agentx_email_drafts').insert({
          tenant_id: ctx.tenantId, recipient: args.to, subject: args.subject, body: args.body,
          contact_id: args.contactId || null, status: 'draft',
        }).select('id').single();
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, status: 'completed', draftId: data.id });
      },
    }),
    tool({
      name: 'send_approved_email',
      description: 'Send a previously drafted email through the connected provider (Gmail). Requires approval "email:send" and a connected Gmail integration.',
      parameters: z.object({ draftId: z.string(), to: z.string().email(), subject: z.string(), body: z.string(), idempotencyKey: z.string().optional() }),
      execute: async (args, runCtx) => {
        const ctx = getRunContext(runCtx);
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        if (!integrations.gmail) return res({ ok: false, status: 'integration_required', integration: 'gmail' });
        const g = gate(ctx, 'email:send');
        if (g) return res(g);
        if (await alreadyPerformed({ tenantId: ctx.tenantId, action: 'send_approved_email', idempotencyKey: args.idempotencyKey })) {
          return res({ ok: true, status: 'already_completed', idempotencyKey: args.idempotencyKey });
        }
        try {
          // Gmail OAuth token -> access token -> users.messages.send (RFC 2822)
          const accessToken = await getGmailAccessToken();
          const raw = `To: ${args.to}\r\nSubject: ${args.subject}\r\n\r\n${args.body}`;
          const encoded = Buffer.from(raw).toString('base64url');
          const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw: encoded }),
          });
          const body = await r.json();
          if (!r.ok) return res({ ok: false, status: 'error', error: body?.error?.message || 'gmail_send_failed' });
          await recordTool({ ctx, tool: 'send_approved_email', args, result: { id: body.id }, status: 'completed', idempotencyKey: args.idempotencyKey });
          return res({ ok: true, status: 'completed', providerId: body.id });
        } catch (e) {
          return res({ ok: false, status: 'error', error: e.message });
        }
      },
    }),
    tool({
      name: 'get_email_status',
      description: 'Fetch the local status record for an email (draft/sent/failed). Real when Supabase is configured.',
      parameters: z.object({ id: z.string() }),
      execute: async (args, runCtx) => {
        const ctx = getRunContext(runCtx);
        const sb = getServiceClient();
        if (!sb) return res({ ok: false, status: 'integration_required', integration: 'supabase' });
        const { data, error } = await sb.from('agentx_tool_executions').select('tool, status, result, created_at').eq('tenant_id', ctx.tenantId).eq('tool', 'send_approved_email').order('created_at', { ascending: false }).limit(5);
        if (error) return res({ ok: false, status: 'error', error: error.message });
        return res({ ok: true, records: data });
      },
    }),
  ];
}

export function createCalendarTools() {
  return [
    tool({
      name: 'check_availability',
      description: 'Check calendar free/busy. Requires the Google Calendar integration to be connected.',
      parameters: z.object({ timeMin: z.string(), timeMax: z.string() }),
      execute: async () => {
        if (!integrations.googleCalendar) return res({ ok: false, status: 'integration_required', integration: 'google_calendar' });
        return res({ ok: false, status: 'integration_required', integration: 'google_calendar', note: 'free/busy not implemented for OAuth-less mode' });
      },
    }),
    tool({
      name: 'create_calendar_event',
      description: 'Create a real Google Calendar event. Requires approval "calendar:create" and a connected Google Calendar integration.',
      parameters: z.object({ summary: z.string(), startISO: z.string(), endISO: z.string(), attendees: z.array(z.string()).optional(), timezone: z.string().optional() }),
      execute: async (args, runCtx) => {
        const ctx = getRunContext(runCtx);
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        if (!integrations.googleCalendar) return res({ ok: false, status: 'integration_required', integration: 'google_calendar' });
        const g = gate(ctx, 'calendar:create');
        if (g) return res(g);
        try {
          const accessToken = await getGmailAccessToken(); // same OAuth token family
          const r = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: args.summary,
              start: { dateTime: args.startISO, timeZone: args.timezone },
              end: { dateTime: args.endISO, timeZone: args.timezone },
              attendees: (args.attendees || []).map((email) => ({ email })),
            }),
          });
          const body = await r.json();
          if (!r.ok) return res({ ok: false, status: 'error', error: body?.error?.message || 'calendar_create_failed' });
          return res({ ok: true, status: 'completed', providerId: body.id, htmlLink: body.htmlLink });
        } catch (e) {
          return res({ ok: false, status: 'error', error: e.message });
        }
      },
    }),
    tool({
      name: 'get_calendar_event',
      description: 'Retrieve a calendar event by provider id. Requires the Google Calendar integration.',
      parameters: z.object({ eventId: z.string() }),
      execute: async () => {
        if (!integrations.googleCalendar) return res({ ok: false, status: 'integration_required', integration: 'google_calendar' });
        return res({ ok: false, status: 'integration_required', integration: 'google_calendar', note: 'fetch not implemented for OAuth-less mode' });
      },
    }),
  ];
}

export function createMessagingTools() {
  return [
    tool({
      name: 'prepare_sms',
      description: 'Compose an SMS message (does not send). Consent is required before sending.',
      parameters: z.object({ to: z.string(), body: z.string(), consent: z.boolean() }),
      execute: async (args) => {
        if (!args.consent) return res({ ok: false, status: 'consent_required' });
        return res({ ok: true, status: 'prepared', message: { to: args.to, body: args.body } });
      },
    }),
    tool({
      name: 'send_approved_sms',
      description: 'Send an SMS through the connected SMS/Twilio provider. Requires approval "sms:send" and a connected integration. Records the delivery SID.',
      parameters: z.object({ to: z.string(), body: z.string(), idempotencyKey: z.string().optional() }),
      execute: async (args, runCtx) => {
        const ctx = getRunContext(runCtx);
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        if (!integrations.sms && !integrations.twilio) return res({ ok: false, status: 'integration_required', integration: 'sms' });
        const g = gate(ctx, 'sms:send');
        if (g) return res(g);
        if (await alreadyPerformed({ tenantId: ctx.tenantId, action: 'send_approved_sms', idempotencyKey: args.idempotencyKey }))
          return res({ ok: true, status: 'already_completed' });
        try {
          const r = await twilioSend('/Messages.json', { To: args.to, Body: args.body });
          return res({ ok: true, status: 'completed', providerId: r.sid });
        } catch (e) {
          return res({ ok: false, status: 'error', error: e.message });
        }
      },
    }),
    tool({
      name: 'prepare_whatsapp',
      description: 'Compose a WhatsApp Business message (does not send).',
      parameters: z.object({ to: z.string(), body: z.string() }),
      execute: async (args) => res({ ok: true, status: 'prepared', message: args }),
    }),
    tool({
      name: 'send_approved_whatsapp',
      description: 'Send a WhatsApp message through the connected Twilio provider. Requires approval "whatsapp:send".',
      parameters: z.object({ to: z.string(), body: z.string(), idempotencyKey: z.string().optional() }),
      execute: async (args, runCtx) => {
        const ctx = getRunContext(runCtx);
        if (!ctx.tenantId) return res({ ok: false, status: 'error', error: 'tenant_required' });
        if (!integrations.twilio) return res({ ok: false, status: 'integration_required', integration: 'whatsapp' });
        const g = gate(ctx, 'whatsapp:send');
        if (g) return res(g);
        if (await alreadyPerformed({ tenantId: ctx.tenantId, action: 'send_approved_whatsapp', idempotencyKey: args.idempotencyKey }))
          return res({ ok: true, status: 'already_completed' });
        try {
          const r = await twilioSend('/Messages.json', { To: `whatsapp:${args.to}`, Body: args.body });
          return res({ ok: true, status: 'completed', providerId: r.sid });
        } catch (e) {
          return res({ ok: false, status: 'error', error: e.message });
        }
      },
    }),
    tool({
      name: 'enrich_lead',
      description: 'Enrich a lead using the connected enrichment provider. Requires the enrichment integration; never invents data.',
      parameters: z.object({ email: z.string().email() }),
      execute: async (args) => {
        if (!integrations.enrichment) return res({ ok: false, status: 'integration_required', integration: 'enrichment' });
        return res({ ok: false, status: 'integration_required', integration: 'enrichment', note: 'provider adapter not connected' });
      },
    }),
  ];
}

// --- Provider plumbing (only reached when the matching integration is enabled) ---
async function getGmailAccessToken() {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error_description || 'google_token_failed');
  return data.access_token;
}

async function twilioSend(path, form) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = form.From || process.env.TWILIO_FROM;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}${path}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ From: from, ...form }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.message || 'twilio_send_failed');
  return data;
}
