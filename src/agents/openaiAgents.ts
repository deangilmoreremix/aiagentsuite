import OpenAI from 'openai';
import { Agent, run, setDefaultOpenAIClient } from '@openai/agents';
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
    tools: tools ? crmTools : []
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
