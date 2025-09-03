interface OpenAIService {
  generateText(prompt: string, maxTokens?: number, temperature?: number): Promise<string>;
  generateAIResponse(instructions: string, input: string, options?: {
    maxTokens?: number;
    temperature?: number;
    previousResponseId?: string;
    store?: boolean;
  }): Promise<{ output_text: string; id?: string }>;
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
  openai: OpenAIService = {
    async generateText(prompt: string, maxTokens: number = 500, temperature: number = 0.7): Promise<string> {
      console.warn('OpenAI API not configured. Please set up your API key in the settings.');
      return `[Simulated response to: ${prompt.substring(0, 100)}...]`;
    },

    async generateAIResponse(
      instructions: string,
      input: string,
      options: {
        maxTokens?: number;
        temperature?: number;
        previousResponseId?: string;
        store?: boolean;
      } = {}
    ): Promise<{ output_text: string; id?: string }> {
      console.warn('OpenAI API not configured. Please set up your API key in the settings.');
      return {
        output_text: `[Simulated response to: ${input.substring(0, 100)}...]`,
        id: `sim-${Date.now()}`
      };
    },

    async createChatCompletion(messages: any[], options: any = {}): Promise<any> {
      console.warn('OpenAI API not configured. Please set up your API key in the settings.');
      return {
        choices: [{
          message: {
            content: `[Simulated response to conversation with ${messages.length} messages]`
          }
        }]
      };
    }
  };

  gemini: GeminiService = {
    async generateText(prompt: string, maxTokens: number = 500): Promise<string> {
      console.warn('Gemini API not configured. Please set up your API key in the settings.');
      return `[Simulated Gemini response to: ${prompt.substring(0, 100)}...]`;
    }
  };

  composio: ComposioService = {
    async executeAction(action: string, params: any): Promise<any> {
      console.warn('Composio API not configured. Please set up your API key in the settings.');
      return { success: false, message: 'Composio not configured' };
    },

    async getAvailableActions(): Promise<any[]> {
      console.warn('Composio API not configured. Please set up your API key in the settings.');
      return [];
    }
  };

  elevenlabs: ElevenLabsService = {
    async generateSpeech(text: string, voice: string = 'default'): Promise<string> {
      console.warn('ElevenLabs API not configured. Please set up your API key in the settings.');
      return '';
    },

    async getAvailableVoices(): Promise<any[]> {
      console.warn('ElevenLabs API not configured. Please set up your API key in the settings.');
      return [];
    }
  };

  // Check if APIs are configured
  isConfigured(): boolean {
    return false; // Will be true when real API keys are configured
  }
}

export const realApiService = new RealApiService();