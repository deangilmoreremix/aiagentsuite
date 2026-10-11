// Real API service — CLIENT side.
//
// SECURITY: This module never holds a provider API key. AI requests are sent to
// the server-side Netlify Function at /api/llm, which holds the private
// credentials (OPENAI_API_KEY / GEMINI_API_KEY) and calls the provider. The
// client degrades gracefully to simulated ("demo mode") responses when no
// serverless function is reachable locally or no key is configured remotely.

import { apiConfig } from '../config/apiConfig';

async function callLLM(payload: Record<string, unknown>): Promise<any | null> {
  try {
    const res = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // No serverless endpoint (e.g. local dev) → caller falls back to demo.
    return null;
  }
}

const simulate = (seed: string) => `[Simulated response to: ${String(seed).substring(0, 100)}...]`;
const simulateGemini = (seed: string) => `[Simulated Gemini response to: ${String(seed).substring(0, 100)}...]`;

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
}

interface ComposioService {
  executeAction(action: string, params: any): Promise<any>;
  getAvailableActions(): Promise<any[]>;
}

interface ElevenLabsService {
  generateSpeech(text: string, voice?: string): Promise<string>;
  getAvailableVoices(): Promise<any[]>;
}

class RealApiService {
  openai = {
    async generateText(prompt: string, maxTokens: number = 500, temperature: number = 0.7): Promise<string> {
      const data = await callLLM({ provider: 'openai', op: 'text', prompt, maxTokens, temperature });
      if (data && typeof data.text === 'string' && !data.demo) {
        return data.text;
      }
      return simulate(prompt);
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
      const selection = this.selectOptimalModel(options.taskType, options.complexity, options.qualityMode);
      const prompt = this.buildGPT5Prompt(instructions, input, options);

      const data = await callLLM({
        provider: 'openai',
        op: 'response',
        messages: prompt.messages,
        model: selection.model,
        max_tokens: selection.maxTokens,
        temperature: selection.temperature,
        response_format: options.taskType === 'complex_reasoning' ? { type: 'json_object' } : undefined
      });

      if (data && typeof data.output_text === 'string' && !data.demo) {
        return { output_text: data.output_text, id: data.id, reasoning: prompt.reasoning };
      }

      return {
        output_text: simulate(input),
        id: `sim-${Date.now()}`
      };
    },

    // GPT-5 model selection logic
    selectOptimalModel(taskType?: string, complexity?: string, qualityMode?: string) {
      // Default to main model
      let model = 'gpt-5-main';
      let maxTokens = 1000;
      let temperature = 0.7;

      // Use reasoning model for complex tasks
      if (taskType === 'complex_reasoning' || complexity === 'advanced') {
        model = 'gpt-5-thinking';
        maxTokens = 2000;
        temperature = 0.2;
      }

      // Adjust parameters based on quality mode
      if (qualityMode === 'speed') {
        maxTokens = Math.floor(maxTokens * 0.7);
        temperature = Math.min(1.0, temperature + 0.1);
      } else if (qualityMode === 'accuracy') {
        maxTokens = Math.floor(maxTokens * 1.3);
        temperature = Math.max(0.1, temperature - 0.2);
      }

      return { model, maxTokens, temperature };
    },

    // Build GPT-5 optimized prompts
    buildGPT5Prompt(instructions: string, input: string, options: any) {
      let systemMessage = instructions;

      // Add GPT-5 specific enhancements
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
        reasoning: `GPT-5 ${options.taskType || 'standard'} mode with ${options.qualityMode || 'balanced'} quality`
      };
    },

    async createChatCompletion(messages: any[], options: any = {}): Promise<any> {
      const data = await callLLM({
        provider: 'openai',
        op: 'chat',
        messages,
        model: options.model,
        max_tokens: options.maxTokens ?? options.max_tokens ?? 1000,
        temperature: options.temperature ?? 0.7
      });

      const content =
        data && typeof data.output_text === 'string' && !data.demo
          ? data.output_text
          : `[Simulated response to conversation with ${messages.length} messages]`;

      return { choices: [{ message: { content } }] };
    }
  };

  gemini: GeminiService = {
    async generateText(prompt: string, maxTokens: number = 500): Promise<string> {
      const data = await callLLM({ provider: 'gemini', op: 'text', prompt, maxTokens });
      if (data && typeof data.text === 'string' && !data.demo) {
        return data.text;
      }
      return simulateGemini(prompt);
    }
  };

  composio: ComposioService = {
    async executeAction(action: string, params: any): Promise<any> {
      return { success: false, message: 'Composio not configured' };
    },

    async getAvailableActions(): Promise<any[]> {
      return [];
    }
  };

  elevenlabs: ElevenLabsService = {
    async generateSpeech(text: string, voice: string = 'default'): Promise<string> {
      return '';
    },

    async getAvailableVoices(): Promise<any[]> {
      return [];
    }
  };

  // Check if APIs are configured
  isConfigured(): boolean {
    return apiConfig.openai.isConfigured || apiConfig.gemini.isConfigured;
  }
}

export const realApiService = new RealApiService();
