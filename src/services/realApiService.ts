import OpenAI from 'openai';
import { apiConfig } from '../config/apiConfig';

const openai = apiConfig.openai.isConfigured
  ? new OpenAI({ apiKey: apiConfig.openai.apiKey, dangerouslyAllowBrowser: true })
  : null;

interface OpenAITextOptions {
  taskType?: 'analytical' | 'creative' | 'complex_reasoning' | 'simple_query';
  complexity?: 'simple' | 'intermediate' | 'advanced';
  enableChainOfThought?: boolean;
  qualityMode?: 'speed' | 'balanced' | 'accuracy';
  maxTokens?: number;
  temperature?: number;
  previousResponseId?: string;
  store?: boolean;
}

interface ToolService {
  executeAction(app: string, action: string, params: any): Promise<any>;
  sendEmail(to: string, subject: string, body: string): Promise<any>;
  createCalendarEvent(title: string, startTime: string, endTime: string, attendees?: string[]): Promise<any>;
  sendSlackMessage(channel: string, message: string): Promise<any>;
  getAvailableActions(): Promise<any[]>;
}

interface ElevenLabsService {
  generateSpeech(text: string, voice?: string): Promise<string>;
  getAvailableVoices(): Promise<any[]>;
}

// Select the optimal model + parameters for a given task (GPT-only).
function selectModel(taskType?: string, complexity?: string, qualityMode?: string) {
  let model = apiConfig.openai.defaultModel;
  let maxTokens = 1000;
  let temperature = 0.7;

  if (taskType === 'complex_reasoning' || complexity === 'advanced') {
    model = apiConfig.openai.reasoningModel;
    maxTokens = 2000;
    temperature = 0.2;
  }

  if (qualityMode === 'speed') {
    maxTokens = Math.floor(maxTokens * 0.7);
    temperature = Math.min(1.0, temperature + 0.1);
  } else if (qualityMode === 'accuracy') {
    maxTokens = Math.floor(maxTokens * 1.3);
    temperature = Math.max(0.1, temperature - 0.2);
  }

  return { model, maxTokens, temperature };
}

function buildSystemPrompt(instructions: string, options: any) {
  let systemMessage = instructions;
  if (options.enableChainOfThought) {
    systemMessage += '\n\nThink step-by-step and show your reasoning process. Provide detailed analysis and consider multiple perspectives before concluding.';
  }
  if (options.taskType === 'complex_reasoning') {
    systemMessage += '\n\nUse advanced analytical reasoning. Consider implications, dependencies, and optimization opportunities. Provide strategic insights.';
  }
  if (options.qualityMode === 'accuracy') {
    systemMessage += '\n\nPrioritize accuracy and thoroughness over speed. Verify your reasoning and double-check important details.';
  }
  return systemMessage;
}

class RealApiService {
  // OpenAI via the Responses API (used directly and as the Agents SDK transport).
  openai = {
    async generateText(prompt: string, maxTokens: number = 500, temperature: number = 0.7): Promise<string> {
      if (!openai) {
        return `[Simulated response to: ${prompt.substring(0, 100)}...]`;
      }
      try {
        const completion = await openai.responses.create({
          model: apiConfig.openai.defaultModel,
          input: prompt,
          max_output_tokens: maxTokens,
          temperature,
        });
        return completion.output_text || '';
      } catch (error) {
        console.error('OpenAI Responses API call failed:', error);
        return `[Error: ${String(error)}]`;
      }
    },

    async generateAIResponse(
      instructions: string,
      input: string,
      options: OpenAITextOptions = {}
    ): Promise<{ output_text: string; id?: string; reasoning?: string }> {
      if (!openai) {
        return {
          output_text: `[Simulated response to: ${input.substring(0, 100)}...]`,
          id: `sim-${Date.now()}`,
        };
      }
      try {
        const modelSelection = selectModel(options.taskType, options.complexity, options.qualityMode);
        const systemPrompt = buildSystemPrompt(instructions, options);
        const params: any = {
          model: modelSelection.model,
          instructions: systemPrompt,
          input,
          max_output_tokens: modelSelection.maxTokens,
          temperature: modelSelection.temperature,
        };
        if (options.taskType === 'complex_reasoning') {
          params.text = { format: { type: 'json_object' } };
        }
        const completion = await openai.responses.create(params);
        return {
          output_text: completion.output_text || '',
          id: completion.id,
          reasoning: options.taskType,
        };
      } catch (error) {
        console.error('OpenAI Responses API call failed:', error);
        return {
          output_text: `[Error: ${String(error)}]`,
          id: `error-${Date.now()}`,
        };
      }
    },

    async createChatCompletion(messages: any[], options: { temperature?: number; maxTokens?: number } = {}): Promise<any> {
      if (!openai) {
        return { choices: [{ message: { content: '[Simulated response]' } }] };
      }
      try {
        const completion = await openai.responses.create({
          model: apiConfig.openai.defaultModel,
          input: messages,
          max_output_tokens: options.maxTokens ?? 1000,
          temperature: options.temperature ?? 0.7,
        });
        return { choices: [{ message: { content: completion.output_text || '' } }] };
      } catch (error) {
        console.error('OpenAI Responses API call failed:', error);
        return { choices: [{ message: { content: `[Error: ${String(error)}]` } }] };
      }
    }
  };

  // Local tool-execution layer (replaces Composio). Handlers are simulated by
  // default; wire real providers (Gmail, Calendar, Slack, etc.) here when available.
  tools: ToolService = {
    async executeAction(app: string, action: string, params: any): Promise<any> {
      console.warn(`[tools] executeAction (simulated): ${app}.${action}`, params);
      return { success: true, simulated: true, app, action, params };
    },
    async sendEmail(to: string, subject: string, _body: string): Promise<any> {
      console.warn('[tools] sendEmail (simulated):', to, subject);
      return { success: true, simulated: true, to, subject };
    },
    async createCalendarEvent(title: string, startTime: string, endTime: string, attendees?: string[]): Promise<any> {
      console.warn('[tools] createCalendarEvent (simulated):', title, startTime, endTime);
      return { success: true, simulated: true, title, startTime, endTime, attendees };
    },
    async sendSlackMessage(channel: string, message: string): Promise<any> {
      console.warn('[tools] sendSlackMessage (simulated):', channel);
      return { success: true, simulated: true, channel, message };
    },
    async getAvailableActions(): Promise<any[]> {
      return ['send_email', 'create_calendar_event', 'send_slack_message'];
    }
  };

  elevenlabs: ElevenLabsService = {
    async generateSpeech(_text: string, _voice: string = 'default'): Promise<string> {
      console.warn('ElevenLabs API not configured. Please set up your API key in the settings.');
      return '';
    },
    async getAvailableVoices(): Promise<any[]> {
      console.warn('ElevenLabs API not configured. Please set up your API key in the settings.');
      return [];
    }
  };

  isConfigured(): boolean {
    return apiConfig.openai.isConfigured;
  }
}

export const realApiService = new RealApiService();
