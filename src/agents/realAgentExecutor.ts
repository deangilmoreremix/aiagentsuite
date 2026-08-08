import { Agent, Runner, tool, setTracingDisabled, setDefaultOpenAIClient } from '@openai/agents';
import OpenAI from 'openai';
import { z } from 'zod';
import { realApiService } from '../services/realApiService';
import { apiConfig, validateApiSetup } from '../config/apiConfig';

// Browser-only setup: disable tracing and register our OpenAI client
// (constructed with dangerouslyAllowBrowser to match the app's architecture).
setTracingDisabled(true);
if (apiConfig.openai.isConfigured) {
  try {
    setDefaultOpenAIClient(
      new OpenAI({ apiKey: apiConfig.openai.apiKey, dangerouslyAllowBrowser: true }) as any
    );
  } catch (error) {
    console.error('Failed to initialize OpenAI Agents SDK client:', error);
  }
}

// Tool definitions for the Agents SDK (replaces the old Composio tool layer).
const emailTool = tool({
  name: 'send_email',
  description: 'Send an email to a recipient using the connected email provider.',
  parameters: z.object({ to: z.string(), subject: z.string(), body: z.string() }),
  execute: async ({ to, subject, body }) => {
    const result = await realApiService.tools.sendEmail(to, subject, body);
    return JSON.stringify(result);
  }
});

const calendarTool = tool({
  name: 'create_calendar_event',
  description: 'Create a calendar event in the connected calendar provider.',
  parameters: z.object({
    title: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    attendees: z.array(z.string()).optional()
  }),
  execute: async ({ title, startTime, endTime, attendees }) => {
    const result = await realApiService.tools.createCalendarEvent(title, startTime, endTime, attendees);
    return JSON.stringify(result);
  }
});

const slackTool = tool({
  name: 'send_slack_message',
  description: 'Send a message to a Slack channel using the connected Slack provider.',
  parameters: z.object({ channel: z.string(), message: z.string() }),
  execute: async ({ channel, message }) => {
    const result = await realApiService.tools.sendSlackMessage(channel, message);
    return JSON.stringify(result);
  }
});

const ALL_TOOLS = [emailTool, calendarTool, slackTool];

export interface RealAgentResult {
  success: boolean;
  agentName: string;
  result?: any;
  error?: string;
  executionTime: number;
  apiCallsMade: number;
  toolsUsed: string[];
  llmUsed: 'openai';
}

export interface AgentOptions {
  llmProvider?: 'openai';
  temperature?: number;
  maxTokens?: number;
  debug?: boolean;
}

export interface AgentContext {
  goalId?: string;
  goalTitle?: string;
  contactInfo?: any;
  crmContext?: any;
  userProvidedData?: any;
  businessValue?: number;
  priority?: string;
  complexity?: string;
}

const DEFAULT_AGENT_OPTIONS: AgentOptions = {
  llmProvider: 'openai',
  temperature: 0.7,
  maxTokens: 1000,
  debug: false
};

export async function executeRealAgent(
  agentName: string,
  task: string,
  tools: string[] = [],
  context?: AgentContext,
  options: AgentOptions = {}
): Promise<RealAgentResult> {
  const startTime = Date.now();
  let apiCallsMade = 0;
  const toolsUsed: string[] = [];
  const mergedOptions = { ...DEFAULT_AGENT_OPTIONS, ...options };
  const { temperature = 0.7, maxTokens = 1000, debug = false } = mergedOptions;

  if (debug) console.log(`🤖 Executing ${agentName}...`);

  try {
    const validation = validateApiSetup();
    if (!validation.canUseRealMode) {
      throw new Error(`Cannot execute real agent: ${validation.issues.join(', ')}`);
    }

    return await executeWithOpenAI(
      agentName,
      buildSystemPrompt(agentName, task, tools, context),
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
      llmUsed: 'openai'
    };
  }
}

function buildSystemPrompt(agentName: string, task: string, tools: string[], context?: AgentContext): string {
  const contextStr = context ? JSON.stringify(context, null, 2) : 'None';
  return [
    `You are ${agentName}, a specialized AI sales agent operating inside an OpenAI Agents workflow.`,
    `Your task: ${task}`,
    `Available tools: ${tools.length > 0 ? tools.join(', ') : 'none'}`,
    `Context:\n${contextStr}`,
    `When you need to take a real action (send email, schedule a meeting, post to Slack), call the appropriate tool.`,
    `Otherwise, respond with a clear, actionable plan and the expected outcome.`
  ].join('\n\n');
}

async function executeWithOpenAI(
  agentName: string,
  systemPrompt: string,
  task: string,
  _tools: string[],
  startTime: number,
  apiCallsMade: number,
  toolsUsed: string[],
  options: { temperature: number; maxTokens: number; debug: boolean }
): Promise<RealAgentResult> {
  const { debug, temperature, maxTokens } = options;
  apiCallsMade++;

  if (debug) {
    console.log('OpenAI (Agents SDK) instructions:', systemPrompt);
    console.log('OpenAI (Agents SDK) input:', task);
  }

  try {
    const agent = new Agent({
      name: agentName,
      model: apiConfig.openai.defaultModel,
      instructions: systemPrompt,
      tools: ALL_TOOLS,
      modelSettings: { temperature, maxTokens }
    });

    const result = await new Runner().run(agent, task);
    const finalOutput = result.finalOutput ?? '';

    return {
      success: true,
      agentName,
      result: { message: finalOutput, aiResponse: finalOutput },
      executionTime: Date.now() - startTime,
      apiCallsMade,
      toolsUsed,
      llmUsed: 'openai'
    };
  } catch (error) {
    console.error(`OpenAI Agents SDK execution failed for ${agentName}:`, error);
    return {
      success: false,
      agentName,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime,
      apiCallsMade,
      toolsUsed,
      llmUsed: 'openai'
    };
  }
}

// Multi-agent coordination helpers (used by the Goals/CRM UI).
export async function executeRealAgentWorkflow(
  steps: Array<{
    agentName: string;
    task: string;
    tools?: string[];
    context?: AgentContext;
  }>,
  onStepUpdate?: (step: any) => void,
  options: AgentOptions = {}
) {
  const results = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    onStepUpdate?.({ ...step, status: 'running', stepIndex: i });
    const result = await executeRealAgent(step.agentName, step.task, step.tools, step.context, options);
    results.push(result);
    onStepUpdate?.({ ...step, status: result.success ? 'completed' : 'error', result, stepIndex: i });
  }
  return results;
}

export async function batchExecuteRealAgents(
  agents: Array<{
    agentName: string;
    task: string;
    tools?: string[];
    context?: AgentContext;
  }>,
  options: AgentOptions = {}
) {
  const results = [];
  for (const agent of agents) {
    results.push(await executeRealAgent(agent.agentName, agent.task, agent.tools, agent.context, options));
  }
  return results;
}
