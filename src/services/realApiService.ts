import OpenAI from 'openai';
import { apiConfig } from '../config/apiConfig';

const openai = apiConfig.openai.isConfigured ? new OpenAI({
  apiKey: apiConfig.openai.apiKey,
  dangerouslyAllowBrowser: true
}) : null;

// ---------------------------------------------------------------------------
// Gemini (Google Generative Language API)
// ---------------------------------------------------------------------------
async function callGeminiREST(
  prompt: string,
  maxTokens: number = 1000,
  temperature: number = 0.7
): Promise<string> {
  const model = apiConfig.gemini.defaultModel;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiConfig.gemini.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature }
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${detail}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ---------------------------------------------------------------------------
// ElevenLabs (Text-to-Speech)
// ---------------------------------------------------------------------------
const ELEVENLABS_DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM'; // "Rachel"

async function callElevenLabsTTS(text: string, voice?: string): Promise<string> {
  const voiceId = voice && voice !== 'default' ? voice : ELEVENLABS_DEFAULT_VOICE;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiConfig.elevenlabs.apiKey as string
    },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`ElevenLabs API ${res.status}: ${detail}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

async function fetchElevenLabsVoices(): Promise<any[]> {
  const url = 'https://api.elevenlabs.io/v1/voices';
  const res = await fetch(url, {
    headers: { 'xi-api-key': apiConfig.elevenlabs.apiKey as string }
  });
  if (!res.ok) throw new Error(`ElevenLabs API ${res.status}`);
  const data = await res.json();
  return data.voices || [];
}

// ---------------------------------------------------------------------------
// Composio (tool integrations: Gmail, Google Calendar, Slack, ...)
// ---------------------------------------------------------------------------
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v1';

// Connected-account IDs are optional; set them in your environment if you have
// pre-linked accounts. Otherwise Composio uses the default account for the
// toolkit (or the call returns a clear error you must connect first).
const composioAccounts = {
  gmail: import.meta.env.VITE_COMPOSIO_GMAIL_ACCOUNT_ID,
  google_calendar: import.meta.env.VITE_COMPOSIO_CALENDAR_ACCOUNT_ID,
  slack: import.meta.env.VITE_COMPOSIO_SLACK_ACCOUNT_ID
};

async function composioExecute(action: string, input: any, connectedAccountId?: string): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiConfig.composio.apiKey as string
  };

  const body: any = { input };
  if (connectedAccountId) body.connectedAccountId = connectedAccountId;

  const res = await fetch(`${COMPOSIO_BASE}/actions/${action}/execute`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Composio ${action} ${res.status}: ${detail}`);
  }

  return await res.json();
}

interface OpenAIService {
  generateText(prompt: string, maxTokens?: number, temperature?: number): Promise<string>;
  generateAIResponse(instructions: string, input: string, options?: {
    taskType?: 'analytical' | 'creative' | 'complex_reasoning' | 'simple_query';
    complexity?: 'simple' | 'intermediate' | 'advanced';
    enableChainOfThought?: boolean;
    qualityMode?: 'speed' | 'balanced' | 'accuracy';
    maxTokens?: number;
    temperature?: number;
    previousResponseId?: string;
    store?: boolean;
  }): Promise<{ output_text: string; id?: string; reasoning?: string }>;
  createChatCompletion(messages: any[], options?: any): Promise<any>;
}

interface GeminiService {
  generateText(prompt: string, maxTokens?: number): Promise<string>;
  generateContent(prompt: string, maxTokens?: number, temperature?: number): Promise<string>;
}

interface ComposioService {
  executeAction(action: string, params: any, connectedAccountId?: string): Promise<any>;
  getAvailableActions(): Promise<any[]>;
  sendEmail(to: any, subject?: string, body?: string): Promise<any>;
  createCalendarEvent(title: any, startTime?: string, endTime?: string, attendees?: string[]): Promise<any>;
  sendSlackMessage(channel: any, message?: string): Promise<any>;
}

interface ElevenLabsService {
  generateSpeech(text: string, voice?: string): Promise<string>;
  getAvailableVoices(): Promise<any[]>;
}

class RealApiService {
  private openaiClient = openai;

  openai = {
    async generateText(prompt: string, maxTokens: number = 500, temperature: number = 0.7): Promise<string> {
      if (!this.openaiClient) {
        console.warn('OpenAI API not configured');
        return `[Simulated response to: ${prompt.substring(0, 100)}...]`;
      }

      try {
        const completion = await this.openaiClient.chat.completions.create({
          model: apiConfig.openai.defaultModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature
        });

        return completion.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('OpenAI API call failed:', error);
        return `[Error: ${error}]`;
      }
    },

    async generateAIResponse(
      instructions: string,
      input: string,
      options: {
        taskType?: 'analytical' | 'creative' | 'complex_reasoning' | 'simple_query';
        complexity?: 'simple' | 'intermediate' | 'advanced';
        enableChainOfThought?: boolean;
        qualityMode?: 'speed' | 'balanced' | 'accuracy';
        maxTokens?: number;
        temperature?: number;
        previousResponseId?: string;
        store?: boolean;
      } = {}
    ): Promise<{ output_text: string; id?: string; reasoning?: string }> {
      if (!this.openaiClient) {
        console.warn('OpenAI API not configured');
        return {
          output_text: `[Simulated response to: ${input.substring(0, 100)}...]`,
          id: `sim-${Date.now()}`
        };
      }

      try {
        const modelSelection = this.selectOptimalModel(options.taskType, options.complexity, options.qualityMode);
        const enhancedPrompt = this.buildGPT5Prompt(instructions, input, options);

        // NOTE: `store` and `previousResponseId` belong to the Responses API,
        // not chat.completions. We intentionally omit them here.
        const completion = await this.openaiClient.chat.completions.create({
          model: modelSelection.model,
          messages: enhancedPrompt.messages,
          max_tokens: modelSelection.maxTokens,
          temperature: modelSelection.temperature,
          response_format: options.taskType === 'complex_reasoning' ? { type: 'json_object' } : undefined
        });

        const response = completion.choices[0]?.message?.content || '';

        return {
          output_text: response,
          id: completion.id,
          reasoning: enhancedPrompt.reasoning
        };
      } catch (error) {
        console.error('OpenAI API call failed:', error);
        return {
          output_text: `[Error: ${error}]`,
          id: `error-${Date.now()}`
        };
      }
    },

    selectOptimalModel(taskType?: string, complexity?: string, qualityMode?: string) {
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
    },

    buildGPT5Prompt(instructions: string, input: string, options: any) {
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

      return {
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: input }
        ],
        reasoning: `OpenAI ${options.taskType || 'standard'} mode with ${options.qualityMode || 'balanced'} quality`
      };
    },

    async createChatCompletion(messages: any[], options: any = {}): Promise<any> {
      if (!this.openaiClient) {
        console.warn('OpenAI API not configured. Please set up your API key in the settings.');
        return {
          choices: [{
            message: {
              content: `[Simulated response to conversation with ${messages.length} messages]`
            }
          }]
        };
      }

      try {
        const completion = await this.openaiClient.chat.completions.create({
          model: options.model || apiConfig.openai.defaultModel,
          messages,
          max_tokens: options.max_tokens || 500,
          temperature: options.temperature ?? 0.7
        });
        return completion;
      } catch (error) {
        console.error('OpenAI chat completion failed:', error);
        return {
          choices: [{
            message: { content: `[Error: ${error}]` }
          }]
        };
      }
    }
  };

  gemini: GeminiService = {
    async generateText(prompt: string, maxTokens: number = 500): Promise<string> {
      if (!apiConfig.gemini.isConfigured) {
        console.warn('Gemini API not configured. Please set up your API key in the settings.');
        return `[Simulated Gemini response to: ${prompt.substring(0, 100)}...]`;
      }
      try {
        return await callGeminiREST(prompt, maxTokens, 0.7);
      } catch (error) {
        console.error('Gemini API call failed:', error);
        return `[Error: ${error}]`;
      }
    },

    async generateContent(prompt: string, maxTokens: number = 1000, temperature: number = 0.7): Promise<string> {
      if (!apiConfig.gemini.isConfigured) {
        console.warn('Gemini API not configured. Please set up your API key in the settings.');
        return `[Simulated Gemini response to: ${prompt.substring(0, 100)}...]`;
      }
      try {
        return await callGeminiREST(prompt, maxTokens, temperature);
      } catch (error) {
        console.error('Gemini API call failed:', error);
        return `[Error: ${error}]`;
      }
    }
  };

  composio: ComposioService = {
    async executeAction(action: string, params: any, connectedAccountId?: string): Promise<any> {
      if (!apiConfig.composio.isConfigured) {
        console.warn('Composio API not configured. Please set up your API key in the settings.');
        return { success: false, message: 'Composio not configured' };
      }
      try {
        const result = await composioExecute(action, params, connectedAccountId);
        return { success: true, ...result };
      } catch (error) {
        console.error('Composio action failed:', error);
        return { success: false, error: String(error) };
      }
    },

    async getAvailableActions(): Promise<any[]> {
      if (!apiConfig.composio.isConfigured) {
        console.warn('Composio API not configured. Please set up your API key in the settings.');
        return [];
      }
      try {
        const res = await fetch(`${COMPOSIO_BASE}/actions?apiKey=${apiConfig.composio.apiKey}`, {
          headers: { 'x-api-key': apiConfig.composio.apiKey as string }
        });
        if (!res.ok) throw new Error(`Composio ${res.status}`);
        const data = await res.json();
        return data.items || data.actions || [];
      } catch (error) {
        console.error('Composio getAvailableActions failed:', error);
        return [];
      }
    },

    async sendEmail(to: any, subject?: string, body?: string): Promise<any> {
      // Supports both object form: sendEmail({ to, subject, body })
      // and positional form: sendEmail(to, subject, body)
      let emailTo = to, emailSubject = subject, emailBody = body;
      if (to && typeof to === 'object') {
        emailTo = to.to;
        emailSubject = to.subject;
        emailBody = to.body;
      }

      if (!apiConfig.composio.isConfigured) {
        console.warn('Composio API not configured. Please set up your API key in the settings.');
        return { success: false, message: 'Composio not configured' };
      }
      try {
        return await composioExecute(
          'GMAIL_SEND_EMAIL',
          { to: emailTo, subject: emailSubject, body: emailBody },
          composioAccounts.gmail
        );
      } catch (error) {
        console.error('Composio sendEmail failed:', error);
        return { success: false, error: String(error) };
      }
    },

    async createCalendarEvent(title: any, startTime?: string, endTime?: string, attendees?: string[]): Promise<any> {
      let eventTitle = title, eventStart = startTime, eventEnd = endTime, eventAttendees = attendees;
      if (title && typeof title === 'object') {
        eventTitle = title.title;
        eventStart = title.startTime;
        eventEnd = title.endTime;
        eventAttendees = title.attendees;
      }

      if (!apiConfig.composio.isConfigured) {
        console.warn('Composio API not configured. Please set up your API key in the settings.');
        return { success: false, message: 'Composio not configured' };
      }
      try {
        return await composioExecute(
          'GOOGLECALENDAR_CREATE_EVENT',
          {
            title: eventTitle,
            startDateTime: eventStart,
            endDateTime: eventEnd,
            attendees: eventAttendees || []
          },
          composioAccounts.google_calendar
        );
      } catch (error) {
        console.error('Composio createCalendarEvent failed:', error);
        return { success: false, error: String(error) };
      }
    },

    async sendSlackMessage(channel: any, message?: string): Promise<any> {
      let slackChannel = channel, slackMessage = message;
      if (channel && typeof channel === 'object') {
        slackChannel = channel.channel;
        slackMessage = channel.message;
      }

      if (!apiConfig.composio.isConfigured) {
        console.warn('Composio API not configured. Please set up your API key in the settings.');
        return { success: false, message: 'Composio not configured' };
      }
      try {
        return await composioExecute(
          'SLACK_SEND_MESSAGE',
          { channel: slackChannel, text: slackMessage },
          composioAccounts.slack
        );
      } catch (error) {
        console.error('Composio sendSlackMessage failed:', error);
        return { success: false, error: String(error) };
      }
    }
  };

  elevenlabs: ElevenLabsService = {
    async generateSpeech(text: string, voice: string = 'default'): Promise<string> {
      if (!apiConfig.elevenlabs.isConfigured) {
        console.warn('ElevenLabs API not configured. Please set up your API key in the settings.');
        return '';
      }
      try {
        return await callElevenLabsTTS(text, voice);
      } catch (error) {
        console.error('ElevenLabs TTS failed:', error);
        return '';
      }
    },

    async getAvailableVoices(): Promise<any[]> {
      if (!apiConfig.elevenlabs.isConfigured) {
        console.warn('ElevenLabs API not configured. Please set up your API key in the settings.');
        return [];
      }
      try {
        return await fetchElevenLabsVoices();
      } catch (error) {
        console.error('ElevenLabs getAvailableVoices failed:', error);
        return [];
      }
    }
  };

  // Check if at least one LLM provider is configured
  isConfigured(): boolean {
    return apiConfig.openai.isConfigured || apiConfig.gemini.isConfigured;
  }
}

export const realApiService = new RealApiService();
