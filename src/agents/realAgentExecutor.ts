import { validateApiSetup } from '../config/apiConfig';
import { runAgentWithTools } from './openaiAgents';

export interface RealAgentResult {
  success: boolean;
  agentName: string;
  result?: any;
  error?: string;
  executionTime: number;
  apiCallsMade: number;
  toolsUsed: string[];
  llmUsed: 'openai' | 'gemini';
}

export interface AgentOptions {
  llmProvider?: 'openai' | 'gemini'; // Which LLM to use
  temperature?: number; // Controls randomness (0.0-1.0)
  maxTokens?: number; // Max tokens to generate
  debug?: boolean; // Enable detailed logging
}

const DEFAULT_AGENT_OPTIONS: Required<AgentOptions> = {
  llmProvider: 'openai',
  temperature: 0.7,
  maxTokens: 1000,
  debug: false
};

// Execute real AI agents with actual OpenAI API calls via the Agents SDK.
export async function executeRealAgent(
  agentName: string,
  task: string,
  tools: string[],
  context?: any,
  options: AgentOptions = {}
): Promise<RealAgentResult> {
  const startTime = Date.now();
  let apiCallsMade = 0;
  const toolsUsed: string[] = [];

  const mergedOptions = { ...DEFAULT_AGENT_OPTIONS, ...options };
  const { temperature, maxTokens, debug } = mergedOptions;

  if (debug) console.log(`🤖 Executing ${agentName}...`);

  try {
    const validation = validateApiSetup();
    if (!validation.canUseRealMode) {
      throw new Error(`Cannot execute real agent: ${validation.issues.join(', ')}`);
    }

    const systemPrompt = `You are ${agentName}, a specialized AI agent. Your task is to ${task}.
                 Available tools: ${tools.join(', ')}.
                 Context: ${context ? JSON.stringify(context) : 'None'}.
                 Provide specific, actionable steps and execute them using the available tools.`;

    return await executeWithAgentsSDK(
      agentName,
      systemPrompt,
      task,
      tools,
      startTime,
      apiCallsMade,
      toolsUsed,
      { temperature, maxTokens, debug }
    );
  } catch (error) {
    console.error(`Real agent execution failed for ${agentName}:`, error);

    return {
      success: false,
      agentName,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime,
      apiCallsMade,
      toolsUsed,
      llmUsed: options.llmProvider || DEFAULT_AGENT_OPTIONS.llmProvider
    };
  }
}

// Execute the agent using the OpenAI Agents SDK with real function-tool calling.
async function executeWithAgentsSDK(
  agentName: string,
  systemPrompt: string,
  task: string,
  tools: string[],
  startTime: number,
  apiCallsMade: number,
  toolsUsed: string[],
  options: { temperature: number; maxTokens: number; debug: boolean }
): Promise<RealAgentResult> {
  const { debug } = options;

  const instructions = `${systemPrompt}

When the task requires an external action (sending email, creating calendar events, messaging Slack, or managing CRM contacts, deals, and activities), call the appropriate tool. Otherwise answer directly.`;

  if (debug) {
    console.log('Agent instructions:', instructions);
    console.log('Agent input:', task);
  }

  apiCallsMade++;
  const runResult = await runAgentWithTools({
    name: agentName,
    instructions,
    input: task,
    tools: tools.length > 0
  });

  const toolCalls = runResult.toolCalls;
  for (const call of toolCalls) {
    if (call.name) toolsUsed.push(call.name);
  }
  apiCallsMade += toolCalls.length;

  const executionResults = toolCalls.map((call) => ({
    tool: call.name,
    parameters: call.input,
    result: call.output,
    success: true
  }));

  if (debug) {
    console.log(`Agent ${agentName} completed. Tools used:`, toolsUsed);
  }

  return {
    success: true,
    agentName,
    result: {
      message: runResult.output,
      toolExecutions: executionResults
    },
    executionTime: Date.now() - startTime,
    apiCallsMade,
    toolsUsed,
    llmUsed: 'openai'
  };
}

// Execute multiple agents in sequence, passing prior results as context.
export async function executeRealAgentWorkflow(
  agents: Array<{
    name: string;
    task: string;
    tools: string[];
    context?: any;
    options?: AgentOptions;
  }>
): Promise<RealAgentResult[]> {
  const results: RealAgentResult[] = [];
  let sharedContext: any = {};

  for (const agent of agents) {
    const agentContext = {
      ...agent.context,
      previousResults: results,
      sharedContext
    };

    const result = await executeRealAgent(
      agent.name,
      agent.task,
      agent.tools,
      agentContext,
      agent.options
    );

    results.push(result);

    if (result.success) {
      sharedContext = {
        ...sharedContext,
        [agent.name]: result.result
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

// Batch execute multiple agents in parallel with a concurrency limit.
export async function batchExecuteRealAgents(
  agents: Array<{
    name: string;
    task: string;
    tools: string[];
    context?: any;
    options?: AgentOptions;
  }>,
  maxConcurrent: number = 3
): Promise<RealAgentResult[]> {
  const allResults: RealAgentResult[] = [];
  const queue = [...agents];

  while (queue.length > 0) {
    const batch = queue.splice(0, maxConcurrent);
    const batchPromises = batch.map((agent) =>
      executeRealAgent(agent.name, agent.task, agent.tools, agent.context, agent.options)
    );

    const batchResults = await Promise.all(batchPromises);
    allResults.push(...batchResults);

    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return allResults;
}
