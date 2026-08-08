import { realApiService } from '../services/realApiService';
import { apiConfig, validateApiSetup } from '../config/apiConfig';

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
const DEFAULT_AGENT_OPTIONS: Required<AgentOptions> = {
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
  const { llmProvider, temperature, maxTokens, debug } = mergedOptions;
  
  if (debug) console.log(`🤖 Executing ${agentName} using ${llmProvider}...`);

  try {
    // Validate API setup
    const validation = validateApiSetup();
    if (!validation.canUseRealMode) {
      throw new Error(`Cannot execute real agent: ${validation.issues.join(', ')}`);
    }

    // Determine if we can use the requested provider
    const useGemini = llmProvider === 'gemini' && apiConfig.gemini.isConfigured;
    const useOpenAI = !useGemini && apiConfig.openai.isConfigured;
    
    if (!useGemini && !useOpenAI) {
      throw new Error('No available LLM provider configured. Please set up either OpenAI or Gemini API keys.');
    }

    const actualProvider = useGemini ? 'gemini' : 'openai';
    if (debug) console.log(`Using ${actualProvider} as LLM provider`);

    // Prepare system message with agent description and context
    const systemPrompt = `You are ${agentName}, a specialized AI agent. Your task is to ${task}. 
                 Available tools: ${tools.join(', ')}. 
                 Context: ${context ? JSON.stringify(context) : 'None'}.
                 Provide specific, actionable steps and execute them using the available tools.`;

    // Execution logic differs based on the provider
    if (useGemini) {
      // Execute using Gemini
      return await executeWithGemini(
        agentName,
        systemPrompt,
        task,
        tools,
        startTime,
        apiCallsMade,
        toolsUsed,
        { temperature, maxTokens, debug }
      );
    } else {
      // Execute using OpenAI
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
    }
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

// Execute agent with Gemini's tool usage format
async function executeWithGemini(
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

  // Derive the quality mode from the generation settings:
  // lower temperature means we favour accuracy, higher temperature favours speed.
  const qualityMode: 'speed' | 'balanced' | 'accuracy' =
    temperature <= 0.3 ? 'accuracy' : temperature >= 0.9 ? 'speed' : 'balanced';

  // Generate tool definitions for Gemini
  const geminiToolDefinitions = tools.map(tool => generateGeminiToolDefinition(tool));
  
  if (debug) {
    console.log('Gemini Tool Definitions:', JSON.stringify(geminiToolDefinitions, null, 2));
  }

  // Gemini requires a different prompt structure for tool usage
  const fullPrompt = `GPT-5 ENHANCED AGENT COORDINATION:
  Apply advanced reasoning and strategic business intelligence.
  
  ${systemPrompt}

GPT-5 REASONING FRAMEWORK:
- Think through the business implications step-by-step
- Consider optimization opportunities and strategic value
- Apply advanced pattern recognition and business intelligence
- Provide detailed rationale for your decisions

When you need to use a tool, respond in the following format:

<thinking>
Your advanced GPT-5 reasoning: step-by-step analysis, business implications, strategic considerations, and optimization opportunities
</thinking>

<tool>
{
  "name": "tool_name",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  }
}
</tool>

If you don't need to use a tool, respond without the <tool> tags.

Here's your task: ${task}`;

  if (debug) console.log('Gemini Prompt:', fullPrompt);

  // Make Gemini API call
  apiCallsMade++;
  const geminiResponse = await realApiService.gemini.generateText(
    fullPrompt,
    maxTokens
  );

  if (!geminiResponse) {
    throw new Error('No response from Gemini');
  }

  // Extract tool usage if present using regex pattern
  const toolPattern = /<tool>([\s\S]*?)<\/tool>/g;
  const thinkingPattern = /<thinking>([\s\S]*?)<\/thinking>/g;
  
  const toolMatches = [...geminiResponse.matchAll(toolPattern)];
  const thinkingMatches = [...geminiResponse.matchAll(thinkingPattern)];
  
  // Extract thinking process if present
  const thinking = thinkingMatches.length > 0 
    ? thinkingMatches[0][1].trim()
    : null;

  // Clean the response by removing the special tags
  let cleanedResponse = geminiResponse
    .replace(toolPattern, '')
    .replace(thinkingPattern, '')
    .trim();

  const executionResults: any[] = [];

  // Process tool calls
  for (const match of toolMatches) {
    try {
      const toolJson = match[1].trim();
      const toolCall = JSON.parse(toolJson);
      
      const toolName = toolCall.name;
      const parameters = toolCall.parameters;
      
      toolsUsed.push(toolName);
      apiCallsMade++;

      if (debug) {
        console.log(`Executing Gemini tool: ${toolName}`);
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
      console.error('Tool execution failed:', toolError);
      executionResults.push({
        error: toolError instanceof Error ? toolError.message : 'Unknown error',
        success: false
      });
    }
  }

  // If we have executed tools, make a follow-up call to summarize the results
  if (executionResults.length > 0) {
    const enhancedToolResultsPrompt = `${systemPrompt}

ADVANCED RESULT SYNTHESIS:
Apply sophisticated analysis to synthesize tool execution results into actionable intelligence.

ORIGINAL TASK: ${task}

TOOL EXECUTION RESULTS:
${JSON.stringify(executionResults, null, 2)}

SYNTHESIS REQUIREMENTS:
Provide a comprehensive yet clear summary that includes:
1. What was accomplished with specific business impact
2. How results align with user objectives and expectations
3. Quality assessment of the execution outcomes
4. Strategic implications and opportunities identified
5. Recommended next actions for value amplification
6. Any insights or optimizations discovered during execution

Use advanced reasoning to connect tactical execution to strategic business value.`;

    apiCallsMade++;
    const finalResponse = await realApiService.gemini.generateText(
      enhancedToolResultsPrompt,
      qualityMode === 'accuracy' ? Math.floor(maxTokens * 1.3) : maxTokens
    );

    cleanedResponse = finalResponse || cleanedResponse;
  }

  const executionTime = Date.now() - startTime;

  const successfulExecutions = executionResults.filter(result => result.success).length;
  const businessImpact = executionResults.length > 0
    ? `${successfulExecutions}/${executionResults.length} tool executions completed successfully`
    : 'No tool executions were required for this task';

  return {
    success: true,
    agentName,
    result: {
      message: cleanedResponse,
      thinking: thinking,
      businessImpact: businessImpact,
      toolExecutions: executionResults,
      aiResponse: geminiResponse,
      gpt5Enhanced: true,
      qualityMode,
      enhancedReasoning: thinking
    },
    executionTime,
    apiCallsMade,
    toolsUsed,
    llmUsed: 'gemini'
  };
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
      const [appName, actionName] = toolName.split('_');
      return await realApiService.composio.executeAction(
        `${appName}.${actionName}`,
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

// Generate tool definitions for Gemini (format is different from OpenAI)
function generateGeminiToolDefinition(toolName: string) {
  // Base definitions for common tools
  const toolDefinitions: Record<string, any> = {
    send_email: {
      name: 'send_email',
      description: 'Send an email via Gmail',
      parameters: {
        to: {
          type: 'string',
          description: 'Recipient email address'
        },
        subject: {
          type: 'string',
          description: 'Email subject'
        },
        body: {
          type: 'string',
          description: 'Email body content'
        }
      },
      required: ['to', 'subject', 'body']
    },
    create_calendar_event: {
      name: 'create_calendar_event',
      description: 'Create a calendar event in Google Calendar',
      parameters: {
        title: {
          type: 'string',
          description: 'Event title'
        },
        startTime: {
          type: 'string',
          description: 'Start time (ISO format)'
        },
        endTime: {
          type: 'string',
          description: 'End time (ISO format)'
        },
        attendees: {
          type: 'array',
          description: 'Attendee email addresses',
          items: {
            type: 'string'
          }
        }
      },
      required: ['title', 'startTime', 'endTime']
    },
    send_slack_message: {
      name: 'send_slack_message',
      description: 'Send a message to a Slack channel',
      parameters: {
        channel: {
          type: 'string',
          description: 'Slack channel name or ID'
        },
        message: {
          type: 'string',
          description: 'Message content'
        }
      },
      required: ['channel', 'message']
    },
    generate_speech: {
      name: 'generate_speech',
      description: 'Generate speech from text using ElevenLabs',
      parameters: {
        text: {
          type: 'string',
          description: 'Text to convert to speech'
        },
        voiceId: {
          type: 'string',
          description: 'Voice ID to use (optional)'
        }
      },
      required: ['text']
    }
  };

  // Return the definition for the tool or create a generic one
  return toolDefinitions[toolName] || {
    name: toolName,
    description: `Execute ${toolName} action`,
    parameters: {
      action: {
        type: 'string',
        description: 'Action to perform'
      },
      parameters: {
        type: 'object',
        description: 'Action parameters'
      }
    },
    required: ['action']
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