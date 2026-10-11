// Server-side configuration for the OpenAI Agents runtime.
// All values are read from NON-public server environment variables (Netlify
// env), never from VITE_*. This module NEVER returns a secret value — it only
// reports availability (booleans) so the UI can show an honest readiness.

/** Server-only env (set in Netlify). Never exposed to the browser. */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Model allowlist (server-side control). Default to a broadly available model;
// override with AGENT_MODEL. The model id is not a secret.
const MODEL_ALLOWLIST = new Set([
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-5',
  'gpt-5-mini',
]);
export const AGENT_MODEL = (() => {
  const requested = process.env.AGENT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o';
  return MODEL_ALLOWLIST.has(requested) ? requested : 'gpt-4o';
})();

// Supabase (server-side, service role) for CRM + persistence.
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Optional external provider availability. Credentials themselves are NEVER
// surfaced — only their presence is reported.
export const integrations = {
  openaiLLM: !!OPENAI_API_KEY,
  supabase: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
  // Gmail (OAuth user tokens) — set GMAIL_CLIENT_ID/_SECRET + a token store to enable.
  gmail: !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN),
  // Google Calendar (same OAuth family) — CALENDAR_REFRESH_TOKEN etc.
  googleCalendar: !!(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_REFRESH_TOKEN),
  // Twilio for SMS/WhatsApp + telephony (AI Dialer / Voice).
  twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  // Generic SMS provider.
  sms: !!process.env.SMS_PROVIDER && !!(process.env.SMS_ACCOUNT_SID || process.env.SMS_API_KEY),
  // ElevenLabs voice.
  elevenlabs: !!process.env.ELEVENLABS_API_KEY,
  // Lead enrichment provider (e.g., Clearbit).
  enrichment: !!(process.env.ENRICHMENT_API_KEY && process.env.ENRICHMENT_PROVIDER),
};

export const llmReady = integrations.openaiLLM;
