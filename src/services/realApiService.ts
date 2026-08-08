import OpenAI from 'openai';
import { apiConfig } from '../config/apiConfig';

const openaiClient = apiConfig.openai.isConfigured ? new OpenAI({
  apiKey: apiConfig.openai.apiKey,
  dangerouslyAllowBrowser: true
}) : null;

interface ElevenLabsService {
  generateSpeech(text: string, voice?: string): Promise<string>;
  getAvailableVoices(): Promise<any[]>;
}

class RealApiService {
  openai = {
    async generateText(prompt: string, maxTokens: number = 500, temperature: number = 0.7): Promise<string> {
      if (!openaiClient) {
        console.warn('OpenAI API not configured');
        return `[Simulated response to: ${prompt.substring(0, 100)}...]`;
      }

      try {
        // Use GPT-5 with optimized parameters
        const completion = await openaiClient.chat.completions.create({
          model: apiConfig.openai.defaultModel, // GPT-5 main
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
      if (!openaiClient) {
        console.warn('OpenAI API not configured');
        return {
          output_text: `[Simulated response to: ${input.substring(0, 100)}...]`,
          id: `sim-${Date.now()}`
        };
      }

      try {
        // Select optimal model based on task complexity and quality mode
        const modelSelection = this.selectOptimalModel(options.taskType, options.complexity, options.qualityMode);
        
        // Build GPT-5 optimized prompt
        const enhancedPrompt = this.buildGPT5Prompt(instructions, input, options);

        const completion = await openaiClient.chat.completions.create({
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
        console.error('OpenAI GPT-5 API call failed:', error);
        return {
          output_text: `[Error: ${error}]`,
          id: `error-${Date.now()}`
        };
      }
    },

    // GPT-5 model selection logic
    selectOptimalModel(taskType?: string, complexity?: string, qualityMode?: string) {
      // Default to main model
      let model = apiConfig.openai.defaultModel;
      let maxTokens = 1000;
      let temperature = 0.7;

      // Use reasoning model for complex tasks
      if (taskType === 'complex_reasoning' || complexity === 'advanced') {
        model = apiConfig.openai.reasoningModel;
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
          { role: 'system' as const, content: systemMessage },
          { role: 'user' as const, content: input }
        ],
        reasoning: `GPT-5 ${options.taskType || 'standard'} mode with ${options.qualityMode || 'balanced'} quality`
      };
    },

    async createChatCompletion(messages: any[], _options: any = {}): Promise<any> {
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

  // Check if APIs are configured
  isConfigured(): boolean {
    return apiConfig.openai.isConfigured;
  }
}

export const realApiService = new RealApiService();