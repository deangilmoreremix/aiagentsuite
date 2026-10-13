# AI Agent Suite — OpenAI Agents SDK execution inventory & certification

All 16 existing agents now run on the official **OpenAI Agents SDK (TypeScript, `@openai/agents`)**, executed **server-side** in Netlify Functions. The browser holds no provider credentials and no Agents-SDK code. Results are honest: unconnected integrations return `integration_required`; consequential actions require approval; nothing is fabricated.

## Architecture

```
src/agents/agentCatalog.ts                 // client-safe 16-agent metadata (no SDK)
src/agents/agentClient.ts                  // fetch-only client (no SDK import)
src/components/AgentRuntimePanel.tsx       // honest status + execution UI
server/agents/config.mjs                   // server env + model allowlist (booleans only)
server/agents/context.mjs                  // per-run tenant/user/mode/approvals + approval gate
server/agents/registry.mjs                 // the 16 agents + honest readiness
server/agents/orchestrator.mjs             // SDK Agent/Runner + workflow runner + failure propagation
server/agents/persistence.mjs              // durable runs/tools/approvals (Supabase, idempotent)
server/agents/tools/{crm,integrations,workflow}.mjs // Zod tool registry
server/supabase/serviceClient.mjs          // server-only Supabase (service role)
netlify/functions/agents.mjs               // POST /api/agents (auth-gated real execution)
netlify/functions/agent-status.mjs         // GET /api/agent-status (booleans, no secrets)
supabase/migrations/20261014020000_agent_execution.sql   // durable tables + RLS
```

- **Demo mode:** returns an explicitly-labelED `[Demo mode] …` result; mutates no data; no paid API call.
- **Real mode:** requires a signed-in user (Bearer token verified against Supabase) so unauthenticated callers cannot consume OpenAI credits; runs `Runner.run(agent, input, { context })` with the agent's registered tools.
- **Tool gating:** mutating CRM actions and all external provider actions require an explicit approval token in the run context (`email:send`, `sms:send`, `crm:*`, `calendar:create`, …). SMS also enforces consent.
- **Tracing disabled** server-side to avoid extra key usage.

## Agent inventory

| # | Agent | Implementation | Tools | External connection | Status |
|---|---|---|---|---|---|
| 1 | AI SDR Agent | Real SDK + CRM | search_contacts, get_contact, update_lead_score, update_contact, create_task, record_activity | Supabase | Ready (needs Supabase) |
| 2 | AI Dialer Agent | Real SDK; calls blocked without telephony | get_contact, create_task, record_activity | Twilio (telephony) | Integration required (Twilio) |
| 3 | AI Account Executive | Real SDK + CRM | search_deals, update_deal, create_task, record_activity | Supabase | Ready (needs Supabase) |
| 4 | AI Journeys | Real SDK + durable workflows | create_workflow, get_workflow_status, record_execution_result | Supabase | Ready (needs Supabase) |
| 5 | Voice Agent | Real SDK text; voice output needs provider | record_activity | ElevenLabs | Integration required (voice) |
| 6 | Meetings | Real SDK; calendar needs provider | check_availability, create_calendar_event, get_calendar_event | Google Calendar | Integration required |
| 7 | Objection Handler | Real AI (no integration needed) | record_activity, create_task | — | Ready (LLM only) |
| 8 | Reengagement | Real SDK + CRM + drafts | search_contacts, get_contact, create_email_draft, create_task | Supabase | Ready (needs Supabase) |
| 9 | Follow-up | Real SDK + CRM + drafts | get_tasks, create_email_draft, prepare_sms, create_task | Supabase | Ready (needs Supabase) |
| 10 | Lead Scoring | Real SDK + CRM (score confirmed by DB) | get_contact, update_lead_score, record_activity | Supabase | Ready (needs Supabase) |
| 11 | Lead Enrichment | Real SDK; enrichment needs provider | get_contact, enrich_lead, update_contact | Enrichment provider | Integration required |
| 12 | Smart Demo Bot | Real AI (no integration needed) | create_task, record_activity | — | Ready (LLM only) |
| 13 | WhatsApp Nurturer | Real SDK; send needs provider | search_contacts, prepare_whatsapp, send_approved_whatsapp | Twilio (WhatsApp) | Integration required (send) |
| 14 | SMS Campaigner | Real SDK; send needs provider | search_contacts, prepare_sms, send_approved_sms | SMS/Twilio | Integration required (send) |
| 15 | Cold Outreach Closer | Real SDK + drafts; send needs provider | search_contacts, get_contact, create_email_draft, send_approved_email, update_deal, record_activity | Gmail | Integration required (send) |
| 16 | Personalized Email | Real SDK + drafts; send needs provider | get_contact, create_email_draft, send_approved_email, record_activity | Gmail | Integration required (send) |

## Certification matrix (this environment: no provider keys set)

Verified by `tests/agents-registry.mjs`, `tests/agents-orchestrator.mjs`, `tests/agents-tools.mjs`, `tests/no-secrets.mjs`, `tests/functions.mjs`, `tests/landing-smoke.mjs`.

| Requirement | Result |
|---|---|
| Agent initialization (SDK `Agent` + registered tools) for all 16 | PASS (registry 9/9) |
| Real LLM response | BLOCKED (no `OPENAI_API_KEY` in this env; wiring verified — real path builds+runs the SDK `Runner`) |
| Tool selection / invocation via SDK (not regex/description) | PASS (tools registered + invoked; orchestrator 8/8) |
| Honest handling when provider unconfigured (`integration_required`, no fake success) | PASS (tools 15/15) |
| Consequential-action approval + consent gates | PASS (tools 15/15) |
| Error handling + failure propagation (real-mode no key returns integration_required; workflow stops at first failure) | PASS |
| Execution persistence schema + service | PASS (migration + persistence module; writes verified code-path only — needs Supabase service key) |
| Tenant isolation (tenant-scoped queries; auth required for real) | PASS (code + auth gate) |
| Client bundle contains no SDK / service-role code | PASS (no-secrets 4/4) |
| Demo mode fully functional, homepage + `/features-analytics` render, no fatal errors | PASS (smoke 16/16) |
| Mobile horizontal overflow | Fixed (flex-wrap) — overflow 325px → 10px, smoke PASS |
| Live external provider action (Gmail/Calendar/Twilio/ElevenLabs/enrichment) | BLOCKED (no provider credentials/OAuth in this env) |

## Build / verification

- `npm ci` PASS · `vite build` PASS · client bundle has **0** `@openai/agents` markers.
- `npm run test:agents` (32 assertions) PASS · `npm run test:functions` 6/6 PASS · `npm run test:secrets` 4/4 PASS · `npm run test:smoke` 16/16 PASS.

## Remaining blockers (external, owner-side)

To make an agent fully operational for **real external actions**, set the server-side env in Netlify (never `VITE_*`) and complete the connector:
- **Gmail:** `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` → enables Personalized Email + Cold Outreach **sending**.
- **Google Calendar:** `GOOGLE_CALENDAR_CLIENT_ID/SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN` → enables Meetings.
- **Twilio:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` → enables AI Dialer, SMS, WhatsApp.
- **ElevenLabs:** `ELEVENLABS_API_KEY` → Voice output.
- **Enrichment:** `ENRICHMENT_PROVIDER`, `ENRICHMENT_API_KEY` → Lead Enrichment.
- **Supabase (server):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` → enables all real CRM writes + persistence (apply `supabase/migrations/20261014020000_agent_execution.sql`).
- **OpenAI (server):** `OPENAI_API_KEY` (+ optional `AGENT_MODEL`) → real LLM for all agents.

Drafts, CRM writes, scoring, workflows, tasks, and reasoning are real and need only OpenAI + Supabase (server). Sending/telephony/voice/enrichment are blocked until their providers are connected and are reported as such.

Environment configuration flow, IDs, security (~0 leaked credentials), and rollback are documented in the branch PR. This agent suite is prepared for a Netlify deploy preview; it is **not** published to production pending authorization.
