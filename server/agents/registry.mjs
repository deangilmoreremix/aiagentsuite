// Centralized registry of the 16 AI Agent Suite agents (SDK Agent definitions
// are assembled in orchestrator.mjs). This module is SERVER-ONLY (never
// imported by the browser). Readiness is computed honestly and never leaks
// secrets — only provider availability booleans.
import { integrations } from './config.mjs';

// Required integrations use the keys from config.mjs `integrations`.
export const AGENTS = [
  {
    key: 'ai_sdr', name: 'AI SDR Agent', role: 'Find and qualify leads',
    tools: ['search_contacts', 'get_contact', 'update_lead_score', 'update_contact', 'create_task', 'record_activity'],
    requiredIntegrations: { supabase: true },
    instructions: 'You are the AI SDR. Find and qualify leads: search the CRM, analyze each lead, recommend outreach, and (only when approved) update lead status/score and create follow-up tasks. Use the CRM tools for real records; never invent contacts. Report failures honestly.',
  },
  {
    key: 'ai_dialer', name: 'AI Dialer Agent', role: 'Prepare and place outbound calls',
    tools: ['get_contact', 'create_task', 'record_activity'],
    requiredIntegrations: { supabase: true, twilio: true },
    instructions: 'You are the AI Dialer. Retrieve approved contact numbers, prepare calling scripts, and record results. Only claim a call occurred if the telephony provider returns a real result; if no telephony provider is connected, say the call could not be placed.',
  },
  {
    key: 'ai_ae', name: 'AI Account Executive Agent', role: 'Advance opportunities',
    tools: ['search_deals', 'update_deal', 'create_task', 'record_activity'],
    requiredIntegrations: { supabase: true },
    instructions: 'You are the AI Account Executive. Analyze deals, recommend next sales actions, prepare proposals, and (only when approved) update deal stages and create tasks. Base everything on the CRM tools.',
  },
  {
    key: 'ai_journeys', name: 'AI Journeys Agent', role: 'Durable customer journeys',
    tools: ['create_workflow', 'get_workflow_status', 'record_execution_result'],
    requiredIntegrations: { supabase: true },
    instructions: 'You are the AI Journeys Agent. Create durable workflow plans with persistent state (not timers) and track progression via the workflow tools.',
  },
  {
    key: 'voice_agent', name: 'Voice Agent', role: 'Speech in/out and conversation state',
    tools: ['record_activity'],
    requiredIntegrations: { elevenlabs: true },
    instructions: 'You are the Voice Agent. Maintain conversation state and generate spoken responses only if a voice provider is configured; if not, clearly report that voice output is unavailable while still returning the text response.',
  },
  {
    key: 'meetings_agent', name: 'Meetings Agent', role: 'Availability and calendar events',
    tools: ['check_availability', 'create_calendar_event', 'get_calendar_event'],
    requiredIntegrations: { googleCalendar: true },
    instructions: 'You are the Meetings Agent. Check availability, propose times, and create real calendar events (approval required). Never fabricate an event id.',
  },
  {
    key: 'objection_handler', name: 'Objection Handler Agent', role: 'Objection analysis and replies',
    tools: ['record_activity', 'create_task'],
    instructions: 'You are the Objection Handler. Analyze the given objection and produce a tailored, honest reply with a recommended next action. No external integration is required for useful output.',
  },
  {
    key: 'reengagement', name: 'Reengagement Agent', role: 'Win back inactive contacts',
    tools: ['search_contacts', 'get_contact', 'create_email_draft', 'create_task'],
    requiredIntegrations: { supabase: true },
    instructions: 'You are the Reengagement Agent. Identify inactive contacts, assess prior activity, draft personalized outreach, and create follow-ups. Honor opt-outs; do not send automatically.',
  },
  {
    key: 'follow_up', name: 'Follow-up Agent', role: 'Prioritize and prepare follow-ups',
    tools: ['get_tasks', 'create_email_draft', 'prepare_sms', 'create_task'],
    requiredIntegrations: { supabase: true },
    instructions: 'You are the Follow-up Agent. Pull pending tasks, prioritize, prepare personalized messages, and (when approved) create follow-ups. Sending requires approval and a connected provider.',
  },
  {
    key: 'lead_scoring', name: 'Lead Scoring Agent', role: 'Compute and explain lead scores',
    tools: ['get_contact', 'update_lead_score', 'record_activity'],
    requiredIntegrations: { supabase: true },
    instructions: 'You are the Lead Scoring Agent. Retrieve lead attributes, compute a 0-100 score with factors, and save it (approval required). Only report a score as saved when the CRM confirms the update.',
  },
  {
    key: 'lead_enrichment', name: 'Lead Enrichment Agent', role: 'Enrich lead records',
    tools: ['get_contact', 'enrich_lead', 'update_contact'],
    requiredIntegrations: { enrichment: true },
    instructions: 'You are the Lead Enrichment Agent. Retrieve lead data and enrich it ONLY from the connected provider. Never invent company details; if no enrichment provider is connected, report the limitation.',
  },
  {
    key: 'smart_demo_bot', name: 'Smart Demo Bot Agent', role: 'Product Q&A and demo guidance',
    tools: ['create_task', 'record_activity'],
    instructions: 'You are the Smart Demo Bot. Answer product questions and guide feature walkthroughs. Clearly separate verified product facts from suggestions. Create follow-up tasks when asked.',
  },
  {
    key: 'whatsapp_nurturer', name: 'WhatsApp Nurturer Agent', role: 'WhatsApp nurture sequences',
    tools: ['search_contacts', 'prepare_whatsapp', 'send_approved_whatsapp'],
    requiredIntegrations: { twilio: true },
    instructions: 'You are the WhatsApp Nurturer. Prepare approved WhatsApp messages for eligible contacts and send only via a connected provider (approval required). Never mark a message sent without a provider response.',
  },
  {
    key: 'sms_campaigner', name: 'SMS Campaigner Agent', role: 'SMS campaigns',
    tools: ['search_contacts', 'prepare_sms', 'send_approved_sms'],
    requiredIntegrations: { sms: true },
    instructions: 'You are the SMS Campaigner. Build SMS campaigns, validate contact consent, and send only through a connected provider (approval required). Honor unsubscribe/consent; never fabricate delivery status.',
  },
  {
    key: 'cold_outreach_closer', name: 'Cold Outreach Closer Agent', role: 'Personalized cold outreach',
    tools: ['search_contacts', 'get_contact', 'create_email_draft', 'send_approved_email', 'update_deal', 'record_activity'],
    requiredIntegrations: { gmail: true },
    instructions: 'You are the Cold Outreach Closer. Generate personalized outreach and sequences, prepare approved messages, and update CRM activities. Prevent unsolicited bulk sending; sending requires approval and a connected provider.',
  },
  {
    key: 'personalized_email', name: 'Personalized Email Agent', role: 'Personalized email drafting/sending',
    tools: ['get_contact', 'create_email_draft', 'send_approved_email', 'record_activity'],
    requiredIntegrations: { gmail: true },
    instructions: 'You are the Personalized Email Agent. Draft personalized emails (real drafts), and send explicitly approved emails through the connected provider, recording the real provider message id. Never send without approval and a provider.',
  },
];

export function getAgent(key) {
  return AGENTS.find((a) => a.key === key) || null;
}

export function agentReadiness(agent) {
  const blocked = [];
  for (const [name, required] of Object.entries(agent.requiredIntegrations || {})) {
    if (required && !integrations[name]) blocked.push(name);
  }
  if (!integrations.openaiLLM) return { status: 'llm_required', blockedIntegrations: blocked, canReason: false };
  if (blocked.length === 0) return { status: 'ready', blockedIntegrations: [], canReason: true };
  return { status: 'integration_required', blockedIntegrations: blocked, canReason: true };
}

// Public (secret-free) readiness for every agent.
export function listAgentStatus() {
  return AGENTS.map((a) => {
    const r = agentReadiness(a);
    return {
      key: a.key,
      name: a.name,
      role: a.role,
      tools: a.tools,
      requiredIntegrations: Object.entries(a.requiredIntegrations || {})
        .filter(([, req]) => req)
        .map(([name]) => name),
      status: r.status,
      blockedIntegrations: r.blockedIntegrations,
      canReason: r.canReason,
    };
  });
}
