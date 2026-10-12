// Client-safe catalog mirroring the server agent registry (no server imports,
// no SDK, no secrets). Used by the UI to label agents and show readiness.
export const AGENT_CATALOG = [
  { key: 'ai_sdr', name: 'AI SDR Agent', role: 'Find and qualify leads' },
  { key: 'ai_dialer', name: 'AI Dialer Agent', role: 'Outbound call preparation & dialing' },
  { key: 'ai_ae', name: 'AI Account Executive Agent', role: 'Advance opportunities' },
  { key: 'ai_journeys', name: 'AI Journeys Agent', role: 'Durable customer journeys' },
  { key: 'voice_agent', name: 'Voice Agent', role: 'Speech in/out + conversation state' },
  { key: 'meetings_agent', name: 'Meetings Agent', role: 'Availability + calendar events' },
  { key: 'objection_handler', name: 'Objection Handler Agent', role: 'Objection analysis and replies' },
  { key: 'reengagement', name: 'Reengagement Agent', role: 'Win back inactive contacts' },
  { key: 'follow_up', name: 'Follow-up Agent', role: 'Prioritize + prepare follow-ups' },
  { key: 'lead_scoring', name: 'Lead Scoring Agent', role: 'Compute + explain lead scores' },
  { key: 'lead_enrichment', name: 'Lead Enrichment Agent', role: 'Enrich lead records' },
  { key: 'smart_demo_bot', name: 'Smart Demo Bot Agent', role: 'Product Q&A + demo guidance' },
  { key: 'whatsapp_nurturer', name: 'WhatsApp Nurturer Agent', role: 'WhatsApp nurture sequences' },
  { key: 'sms_campaigner', name: 'SMS Campaigner Agent', role: 'SMS campaigns' },
  { key: 'cold_outreach_closer', name: 'Cold Outreach Closer Agent', role: 'Personalized cold outreach' },
  { key: 'personalized_email', name: 'Personalized Email Agent', role: 'Personalized email draft/send' },
];

export const WORKFLOW_CATALOG = [
  { key: 'qualify_lead', name: 'Qualify a lead', description: 'SDR → Scoring → AE → outreach email (approval required to send)' },
];

export interface AgentStatusInfo {
  key: string;
  name: string;
  role: string;
  status: 'ready' | 'integration_required' | 'llm_required';
  blockedIntegrations: string[];
  canReason: boolean;
}

export interface AgentRunResult {
  status: string;
  agentKey?: string;
  agentName?: string;
  output?: string;
  toolCalls?: Array<{ name: string; arguments?: string; callId?: string }>;
  blockedIntegrations?: string[];
  message?: string;
  error?: string;
  runId?: string | null;
  steps?: Array<{ agentKey: string; status: string; output?: string; label?: string; error?: string }>;
}
