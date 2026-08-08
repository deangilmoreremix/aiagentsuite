import { realApiService } from '../services/realApiService';
import { validateApiSetup } from '../config/apiConfig';

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

// Enhanced to support multiple LLM types
export interface AgentOptions {
  llmProvider?: 'openai' | 'gemini'; // Which LLM to use
  temperature?: number; // Controls randomness (0.0-1.0)
  maxTokens?: number; // Max tokens to generate
  debug?: boolean; // Enable detailed logging
}

// Default options
const DEFAULT_AGENT_OPTIONS: AgentOptions = {
  llmProvider: 'openai', // Default to OpenAI
  temperature: 0.7,
  maxTokens: 1000,
  debug: false
};

// Execute real AI agents with actual API calls
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
  
  // Merge default options with provided options
  const mergedOptions = { ...DEFAULT_AGENT_OPTIONS, ...options };
  const { temperature = 0.7, maxTokens = 1000, debug = false } = mergedOptions;

  if (debug) console.log(`🤖 Executing ${agentName} using openai...`);

  try {
    // Validate API setup
    const validation = validateApiSetup();
    if (!validation.canUseRealMode) {
      throw new Error(`Cannot execute real agent: ${validation.issues.join(', ')}`);
    }

    // Prepare system message with agent description and context
    const systemPrompt = `You are ${agentName}, a specialized AI agent. Your task is to ${task}. 
                 Available tools: ${tools.join(', ')}. 
                 Context: ${context ? JSON.stringify(context) : 'None'}.
                 Provide specific, actionable steps and execute them using the available tools.`;

    // Always execute with OpenAI
    return await executeWithOpenAI(
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
      llmUsed: 'openai'
    };
  }
}

// Execute agent with OpenAI's tool calling format
async function executeWithOpenAI(
  agentName: string,
  systemPrompt: string,
  task: string,
  tools: string[],
  startTime: number,
  apiCallsMade: number,
  toolsUsed: string[],
  options: { temperature: number; maxTokens: number; debug: boolean }
): Promise<RealAgentResult> {
  const { debug, temperature, maxTokens } = options;
  
  // Prepare instructions and input for new Responses API
  let instructions = systemPrompt;
  
  // Add tool information to instructions since Responses API handles tools differently
  if (tools.length > 0) {
    const toolDefinitions = tools.map(tool => generateOpenAIToolDefinition(tool));
    instructions += '\n\nAvailable tools: ' + JSON.stringify(toolDefinitions, null, 2);
    instructions += '\nWhen you need to use a tool, describe the specific action you would take and include the tool name and parameters in your response.';
  }
  
  if (debug) {
    console.log('OpenAI Instructions:', instructions);
    console.log('OpenAI Input:', task);
  }

  // Make OpenAI Responses API call
  apiCallsMade++;
  const openaiResponse = await realApiService.openai.generateAIResponse(
    instructions,
    task,
    {
      temperature,
      maxTokens,
      store: true
    }
  );

  const responseText = openaiResponse.output_text;
  
  if (!responseText) {
    throw new Error('No response from OpenAI');
  }

  let finalResult = responseText;
  const executionResults: any[] = [];

  // Parse tool usage from response text (since Responses API doesn't have structured tool calls)
  const toolUsagePattern = /TOOL_CALL:\s*(\w+)\s*\{([^}]*)\}/g;
  let toolMatch;
  
  while ((toolMatch = toolUsagePattern.exec(responseText)) !== null) {
    try {
      const toolName = toolMatch[1];
      const parametersText = toolMatch[2];
      
      // Parse parameters from the extracted text
      const parameters = parseToolParameters(parametersText);
      
      toolsUsed.push(toolName);
      apiCallsMade++;

      if (debug) {
        console.log(`Executing tool: ${toolName}`);
        console.log('Parameters:', parameters);
      }

      // Execute the tool call
      const toolResult = await executeToolCall(toolName, parameters);
      executionResults.push({
        tool: toolName,
        parameters,
        result: toolResult,
        success: true
      });

    } catch (toolError) {
      console.error(`Tool execution failed for ${toolMatch[1]}:`, toolError);
      executionResults.push({
        tool: toolMatch[1],
        error: toolError instanceof Error ? toolError.message : 'Unknown error',
        success: false
      });
    }
  }

  // Generate final response with tool results if any tools were used
  if (executionResults.length > 0) {
    const toolResultsInput = `Tool execution results: ${JSON.stringify(executionResults, null, 2)}. 
                             Please provide a summary of what was accomplished.`;

    apiCallsMade++;
    const finalResponse = await realApiService.openai.generateAIResponse(
      'Provide a summary of tool execution results.',
      toolResultsInput,
      {
        temperature,
        maxTokens,
        previousResponseId: openaiResponse.id,
        store: true
      }
    );

    finalResult = finalResponse.output_text || finalResult;
  }

  const executionTime = Date.now() - startTime;

  return {
    success: true,
    agentName,
    result: {
      message: finalResult,
      toolExecutions: executionResults,
      aiResponse: openaiResponse,
      responseId: openaiResponse.id
    },
    executionTime,
    apiCallsMade,
    toolsUsed,
    llmUsed: 'openai'
  };
}

// Parse tool parameters from text
function parseToolParameters(parametersText: string): any {
  try {
    // Try to parse as JSON first
    return JSON.parse(`{${parametersText}}`);
  } catch {
    // If JSON parsing fails, parse key-value pairs
    const parameters: any = {};
    const pairs = parametersText.split(',');
    for (const pair of pairs) {
      const [key, value] = pair.split(':').map(s => s.trim());
      if (key && value) {
        parameters[key.replace(/['"]/g, '')] = value.replace(/['"]/g, '');
      }
    }
    return parameters;
  }
}

// Execute a tool call with the appropriate service
async function executeToolCall(toolName: string, parameters: any): Promise<any> {
  switch (toolName) {
    case 'send_email':
      return await realApiService.composio.sendEmail(
        parameters.to,
        parameters.subject,
        parameters.body
      );
      
    case 'create_calendar_event':
      return await realApiService.composio.createCalendarEvent(
        parameters.title,
        parameters.startTime,
        parameters.endTime,
        parameters.attendees
      );
      
    case 'send_slack_message':
      return await realApiService.composio.sendSlackMessage(
        parameters.channel,
        parameters.message
      );
      
    case 'generate_speech':
      return await realApiService.elevenlabs.generateSpeech(
        parameters.text,
        parameters.voiceId
      );
      
    default:
      // Generic Composio action
      const [appName, ...rest] = toolName.split('_');
      const actionName = rest.join('_');
      return await realApiService.composio.executeAction(
        appName,
        actionName,
        parameters
      );
  }
}

// Generate tool definitions for OpenAI function calling
function generateOpenAIToolDefinition(toolName: string) {
  const toolDefinitions: Record<string, any> = {
    send_email: {
      type: 'function',
      function: {
        name: 'send_email',
        description: 'Send an email via Gmail',
        parameters: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Recipient email address' },
            subject: { type: 'string', description: 'Email subject' },
            body: { type: 'string', description: 'Email body content' }
          },
          required: ['to', 'subject', 'body']
        }
      }
    },
    create_calendar_event: {
      type: 'function',
      function: {
        name: 'create_calendar_event',
        description: 'Create a calendar event in Google Calendar',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Event title' },
            startTime: { type: 'string', description: 'Start time (ISO format)' },
            endTime: { type: 'string', description: 'End time (ISO format)' },
            attendees: { type: 'array', items: { type: 'string' }, description: 'Attendee email addresses' }
          },
          required: ['title', 'startTime', 'endTime']
        }
      }
    },
    send_slack_message: {
      type: 'function',
      function: {
        name: 'send_slack_message',
        description: 'Send a message to a Slack channel',
        parameters: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Slack channel name or ID' },
            message: { type: 'string', description: 'Message content' }
          },
          required: ['channel', 'message']
        }
      }
    },
    generate_speech: {
      type: 'function',
      function: {
        name: 'generate_speech',
        description: 'Generate speech from text using ElevenLabs',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to convert to speech' },
            voiceId: { type: 'string', description: 'Voice ID to use' }
          },
          required: ['text']
        }
      }
    }
  };

  return toolDefinitions[toolName] || {
    type: 'function',
    function: {
      name: toolName,
      description: `Execute ${toolName} action`,
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'Action to perform' },
          parameters: { type: 'object', description: 'Action parameters' }
        },
        required: ['action']
      }
    }
  };
}

// Execute multiple agents in sequence
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
    // Pass results from previous agents as context
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

    // Update shared context with successful results
    if (result.success) {
      sharedContext = {
        ...sharedContext,
        [agent.name]: result.result
      };
    }

    // Add delay between agents to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// Batch execute multiple agents in parallel
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
  
  // Process in batches of maxConcurrent
  while (queue.length > 0) {
    const batch = queue.splice(0, maxConcurrent);
    const batchPromises = batch.map(agent => 
      executeRealAgent(
        agent.name,
        agent.task,
        agent.tools,
        agent.context,
        agent.options
      )
    );
    
    const batchResults = await Promise.all(batchPromises);
    allResults.push(...batchResults);
    
    // Prevent rate limiting
    if (queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return allResults;
}