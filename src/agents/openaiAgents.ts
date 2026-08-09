import OpenAI from 'openai';
import { Agent, run, setDefaultOpenAIClient, MCPServerSSE, type MCPServer } from '@openai/agents';
import { apiConfig } from '../config/apiConfig';
import { crmTools } from './crmTools';

// Configure the Agents SDK client for browser usage when a key is present.
// The SDK's default client creation does not enable `dangerouslyAllowBrowser`,
// so we supply our own client configured for the browser.
if (apiConfig.openai.isConfigured && apiConfig.openai.apiKey) {
  try {
    const client = new OpenAI({
      apiKey: apiConfig.openai.apiKey,
      dangerouslyAllowBrowser: true
    });
    setDefaultOpenAIClient(client as unknown as Parameters<typeof setDefaultOpenAIClient>[0]);
  } catch (error) {
    console.warn('OpenAI Agents SDK client initialization failed:', error);
  }
}

/**
 * Remote MCP servers made available to every agent built in this module.
 *
 * When `VITE_MCP_SERVER_URL` is set, the MCP server is expected to provide the
 * external-action capabilities (email / calendar / slack). `crmTools` drops its
 * local stand-ins for those actions in that case, so the model sees exactly one
 * implementation of each capability.
 *
 * Note: `MCPServerSSEOptions` has no `headers` field. The SSE transport takes
 * custom headers via `requestInit`, which the MCP client applies both to the
 * initial SSE stream request and to the follow-up JSON-RPC POSTs.
 */
const mcpServers: MCPServer[] = apiConfig.mcp.isConfigured
  ? [
      new MCPServerSSE({
        name: apiConfig.mcp.name,
        url: apiConfig.mcp.url,
        ...(apiConfig.mcp.token
          ? { requestInit: { headers: { Authorization: `Bearer ${apiConfig.mcp.token}` } } }
          : {})
      })
    ]
  : [];

function resolveModel(): string {
  const configured = apiConfig.openai.defaultModel;
  // Guard against the fictional placeholder models used elsewhere in the app.
  if (configured && !/(main|thinking)/i.test(configured)) {
    return configured;
  }
  return import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
}

export interface AgentToolCall {
  name: string;
  input: any;
  output: any;
}

export interface RunAgentResult {
  output: string;
  toolCalls: AgentToolCall[];
  history: unknown[];
}

export async function runAgentWithTools(params: {
  name: string;
  instructions: string;
  input: string;
  tools?: boolean;
  model?: string;
}): Promise<RunAgentResult> {
  const { name, instructions, input, tools = true, model } = params;

  const agent = new Agent({
    name,
    instructions,
    model: model ?? resolveModel(),
    tools: tools ? crmTools : [],
    mcpServers
  });

  const result = await run(agent, input);

  const toolCalls: AgentToolCall[] = [];
  const items = (result.newItems ?? []) as Array<any>;

  for (const item of items) {
    if (item?.type === 'tool_call_item') {
      let parsedInput: any;
      try {
        parsedInput = item.rawItem?.arguments ? JSON.parse(item.rawItem.arguments) : undefined;
      } catch {
        parsedInput = item.rawItem?.arguments;
      }
      toolCalls.push({ name: item.name, input: parsedInput, output: undefined });
    } else if (item?.type === 'tool_call_output_item') {
      const last = toolCalls[toolCalls.length - 1];
      if (last && last.output === undefined) {
        const raw = item.output ?? item.rawItem?.output;
        last.output = typeof raw === 'string' ? raw : raw;
      }
    }
  }

  return {
    output: result.finalOutput ?? '',
    toolCalls,
    history: (result.history as unknown[]) ?? []
  };
}

/**
 * Minimal structural view of the run items we care about when pairing tool
 * calls with their outputs.
 */
interface RawRunItemLike {
  type?: string;
  name?: string;
  output?: unknown;
  rawItem?: {
    arguments?: string;
    output?: unknown;
  };
}

/**
 * Collects `AgentToolCall` entries from the run items produced by a run.
 *
 * This mirrors the pairing logic used by `runAgentWithTools` (a
 * `tool_call_item` is followed by its `tool_call_output_item`) and is kept as a
 * separate helper so `runAgentWithTools` itself stays untouched.
 */
function collectToolCalls(newItems: unknown): AgentToolCall[] {
  const toolCalls: AgentToolCall[] = [];
  const items: RawRunItemLike[] = Array.isArray(newItems) ? (newItems as RawRunItemLike[]) : [];

  for (const item of items) {
    if (item?.type === 'tool_call_item') {
      let parsedInput: unknown;
      try {
        parsedInput = item.rawItem?.arguments ? JSON.parse(item.rawItem.arguments) : undefined;
      } catch {
        parsedInput = item.rawItem?.arguments;
      }
      toolCalls.push({ name: item.name ?? '', input: parsedInput, output: undefined });
    } else if (item?.type === 'tool_call_output_item') {
      const last = toolCalls[toolCalls.length - 1];
      if (last && last.output === undefined) {
        last.output = item.output ?? item.rawItem?.output;
      }
    }
  }

  return toolCalls;
}

/**
 * Streaming counterpart to {@link runAgentWithTools}.
 *
 * Builds the exact same `Agent` (same model resolution + `crmTools` +
 * `mcpServers`) but runs it
 * with the SDK's streaming mode: `run(agent, input, { stream: true })` resolves
 * to a `StreamedRunResult`, which is an `AsyncIterable<RunStreamEvent>`.
 *
 * Text deltas are taken from the raw model stream events
 * (`raw_model_stream_event` -> `data.type === 'output_text_delta'`) and pushed to
 * `onText` as they arrive. The resolved value is the same `RunAgentResult` shape
 * returned by `runAgentWithTools`.
 */
export async function runAgentWithToolsStreaming(params: {
  name: string;
  instructions: string;
  input: string;
  tools?: boolean;
  model?: string;
  onText?: (delta: string) => void;
}): Promise<RunAgentResult> {
  const { name, instructions, input, tools = true, model, onText } = params;

  const agent = new Agent({
    name,
    instructions,
    model: model ?? resolveModel(),
    tools: tools ? crmTools : [],
    mcpServers
  });

  const stream = await run(agent, input, { stream: true });

  let emittedAnyDelta = false;

  for await (const event of stream) {
    if (event.type !== 'raw_model_stream_event') {
      continue;
    }

    // `StreamEventTextStream` — the protocol-level text delta event.
    if (event.data.type === 'output_text_delta') {
      const delta = event.data.delta;
      if (delta) {
        emittedAnyDelta = true;
        onText?.(delta);
      }
    }
  }

  // Make sure the run is fully settled (and any run error surfaced) before
  // reading `finalOutput` / `newItems` / `history`.
  await stream.completed;

  const output = stream.finalOutput ?? '';

  // Safety net: some models/providers complete without emitting incremental
  // text deltas. In that case hand the caller the final text once so that
  // `onText` consumers never end up with an empty transcript.
  if (!emittedAnyDelta && output) {
    onText?.(output);
  }

  return {
    output,
    toolCalls: collectToolCalls(stream.newItems),
    history: (stream.history as unknown[]) ?? []
  };
}
