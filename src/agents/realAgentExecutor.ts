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
}

// Execute real AI agents with actual API calls
export async function executeRealAgent(
  agentName: string,
  task: string,
  tools: string[],
  context?: any
): Promise<RealAgentResult> {
  const startTime = Date.now();
  let apiCallsMade = 0;
  const toolsUsed: string[] = [];

  try {
    // Validate API setup
    const validation = validateApiSetup();
    if (!validation.canUseRealMode) {
      throw new Error(`Cannot execute real agent: ${validation.issues.join(', ')}`);
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are ${agentName}, a specialized AI agent. Your task is to ${task}. 
                 Available tools: ${tools.join(', ')}. 
                 Context: ${context ? JSON.stringify(context) : 'None'}.
                 Provide specific, actionable steps and execute them using the available tools.`
      },
      {
        role: 'user',
        content: task
      }
    ];

    // Prepare tool definitions for OpenAI function calling
    const toolDefinitions = tools.map(tool => generateToolDefinition(tool));

    // Make OpenAI API call
    apiCallsMade++;
    const openaiResponse = await realApiService.openai.createChatCompletion(
      messages,
      toolDefinitions
    );

    const responseMessage = openaiResponse.choices[0]?.message;
    
    if (!responseMessage) {
      throw new Error('No response from OpenAI');
    }

    let finalResult = responseMessage.content || '';
    const executionResults: any[] = [];

    // Execute tool calls if any
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      for (const toolCall of responseMessage.tool_calls) {
        try {
          const toolName = toolCall.function.name;
          const parameters = JSON.parse(toolCall.function.arguments);
          
          toolsUsed.push(toolName);
          apiCallsMade++;

          // Execute the tool call
          let toolResult;
          switch (toolName) {
            case 'send_email':
              toolResult = await realApiService.composio.sendEmail(
                parameters.to,
                parameters.subject,
                parameters.body
              );
              break;
            case 'create_calendar_event':
              toolResult = await realApiService.composio.createCalendarEvent(
                parameters.title,
                parameters.startTime,
                parameters.endTime,
                parameters.attendees
              );
              break;
            case 'send_slack_message':
              toolResult = await realApiService.composio.sendSlackMessage(
                parameters.channel,
                parameters.message
              );
              break;
            case 'generate_speech':
              toolResult = await realApiService.elevenlabs.generateSpeech(
                parameters.text,
                parameters.voiceId
              );
              break;
            default:
              // Generic Composio action
              const [appName, actionName] = toolName.split('_');
              toolResult = await realApiService.composio.executeAction(
                appName,
                actionName,
                parameters
              );
          }

          executionResults.push({
            tool: toolName,
            parameters,
            result: toolResult,
            success: true
          });

        } catch (toolError) {
          console.error(`Tool execution failed for ${toolCall.function.name}:`, toolError);
          executionResults.push({
            tool: toolCall.function.name,
            error: toolError instanceof Error ? toolError.message : 'Unknown error',
            success: false
          });
        }
      }

      // Generate final response with tool results
      if (executionResults.length > 0) {
        const toolResultsMessage = {
          role: 'user',
          content: `Tool execution results: ${JSON.stringify(executionResults, null, 2)}. 
                   Please provide a summary of what was accomplished.`
        };

        apiCallsMade++;
        const finalResponse = await realApiService.openai.createChatCompletion([
          ...messages,
          responseMessage,
          toolResultsMessage
        ]);

        finalResult = finalResponse.choices[0]?.message?.content || finalResult;
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      agentName,
      result: {
        message: finalResult,
        toolExecutions: executionResults,
        aiResponse: responseMessage
      },
      executionTime,
      apiCallsMade,
      toolsUsed
    };

  } catch (error) {
    console.error(`Real agent execution failed for ${agentName}:`, error);
    
    return {
      success: false,
      agentName,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime,
      apiCallsMade,
      toolsUsed
    };
  }
}

// Generate tool definitions for OpenAI function calling
function generateToolDefinition(toolName: string) {
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
      agentContext
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