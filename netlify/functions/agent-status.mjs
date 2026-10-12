// Netlify Function: agent + integration readiness (GET /api/agent-status).
// Returns booleans only — never a credential value.
import { listAgentStatus } from '../../server/agents/registry.mjs';
import { integrations, AGENT_MODEL } from '../../server/agents/config.mjs';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

export async function handler(event) {
  if ((event.httpMethod || 'GET').toUpperCase() !== 'GET') {
    return json(405, { error: 'Method Not Allowed' });
  }
  return json(200, {
    model: AGENT_MODEL,
    integrations: {
      openaiLLM: integrations.openaiLLM,
      supabase: integrations.supabase,
      gmail: integrations.gmail,
      googleCalendar: integrations.googleCalendar,
      twilio: integrations.twilio,
      sms: integrations.sms,
      elevenlabs: integrations.elevenlabs,
      enrichment: integrations.enrichment,
    },
    agents: listAgentStatus(),
  });
}
