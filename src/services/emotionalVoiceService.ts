import { realApiService } from './realApiService';
import { contextualMemoryService } from './contextualMemoryService';

interface EmotionalContext {
  userEmotion: 'excited' | 'frustrated' | 'neutral' | 'confused' | 'satisfied' | 'urgent';
  conversationTone: 'professional' | 'casual' | 'supportive' | 'celebratory' | 'instructional';
  businessContext: 'success' | 'challenge' | 'learning' | 'planning' | 'execution';
  responseStyle: 'concise' | 'detailed' | 'encouraging' | 'technical' | 'strategic';
}

interface VoicePersonality {
  baseVoice: string; // ElevenLabs voice ID
  emotionalRange: {
    excited: { speed: number; pitch: number; emphasis: number };
    supportive: { speed: number; pitch: number; emphasis: number };
    professional: { speed: number; pitch: number; emphasis: number };
    celebratory: { speed: number; pitch: number; emphasis: number };
  };
  speakingPatterns: {
    pauseBetweenSentences: number;
    emphasisWords: string[];
    transitionPhrases: string[];
  };
}

export class EmotionalVoiceService {
  private static instance: EmotionalVoiceService;
  private currentEmotionalContext: EmotionalContext = {
    userEmotion: 'neutral',
    conversationTone: 'professional',
    businessContext: 'learning',
    responseStyle: 'detailed'
  };

  static getInstance(): EmotionalVoiceService {
    if (!EmotionalVoiceService.instance) {
      EmotionalVoiceService.instance = new EmotionalVoiceService();
    }
    return EmotionalVoiceService.instance;
  }

  // Analyze emotional context from conversation
  async analyzeEmotionalContext(userMessage: string): Promise<EmotionalContext> {
    try {
      const conversationHistory = contextualMemoryService.getCurrentContext()?.messages.slice(-5) || [];
      
      const emotionalAnalysisPrompt = `
        Analyze the emotional context of this conversation:
        
        Latest User Message: "${userMessage}"
        
        Recent Conversation:
        ${conversationHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n')}
        
        Determine:
        1. User's current emotional state (excited, frustrated, neutral, confused, satisfied, urgent)
        2. Appropriate conversation tone (professional, casual, supportive, celebratory, instructional)
        3. Business context (success, challenge, learning, planning, execution)
        4. Best response style (concise, detailed, encouraging, technical, strategic)
        
        Consider indicators like:
        - Exclamation marks, caps = excited/urgent
        - Questions, "I don't understand" = confused
        - "Great!", "Perfect!" = satisfied
        - "This isn't working", "Why" = frustrated
        - Technical terms = professional context
        - Casual language = relaxed interaction
        
        Return JSON:
        {
          "userEmotion": "neutral",
          "conversationTone": "professional", 
          "businessContext": "learning",
          "responseStyle": "detailed"
        }
      `;

      const analysis = await realApiService.openai.generateText(emotionalAnalysisPrompt, 300, 0.3);
      const emotionalContext: EmotionalContext = JSON.parse(analysis);
      
      this.currentEmotionalContext = emotionalContext;
      return emotionalContext;
    } catch (error) {
      console.error('Failed to analyze emotional context:', error);
      return this.currentEmotionalContext;
    }
  }

  // Generate emotionally intelligent response
  async generateEmotionalResponse(
    content: string,
    agentName: string,
    context?: any
  ): Promise<string> {
    try {
      const emotionalContext = this.currentEmotionalContext;
      const summaryResult = await contextualMemoryService.getContextualSummary();
      const conversationSummary = summaryResult.summary;

      const instructions = `
        You are ${agentName}, responding with emotional intelligence.
        Rewrite your response to match the emotional context:
        
        User Emotion: ${emotionalContext.userEmotion}
        - If excited: Match their energy, use enthusiastic language
        - If frustrated: Be supportive, acknowledge their concern, focus on solutions
        - If confused: Be patient, break down complex concepts, offer clarification
        - If satisfied: Celebrate their success, build on positive momentum
        - If urgent: Be direct, focus on immediate actions, show urgency understanding
        
        Conversation Tone: ${emotionalContext.conversationTone}
        - Professional: Use formal language, focus on business value
        - Casual: Use friendly language, be conversational
        - Supportive: Be encouraging, empathetic, solution-focused
        - Celebratory: Express excitement, highlight achievements
        - Instructional: Be clear, step-by-step, educational
        
        Response Style: ${emotionalContext.responseStyle}
        - Concise: Keep it brief and actionable
        - Detailed: Provide comprehensive information
        - Encouraging: Focus on positive outcomes and motivation
        - Technical: Include specific details and methods
        - Strategic: Focus on big-picture impact and planning
        
        Guidelines:
        - Maintain the core information from the original response
        - Adjust tone and style to match emotional context
        - Add appropriate emotional markers (enthusiasm, empathy, etc.)
        - Include relevant context references when helpful
        - Keep it natural and human-like
        
        Return only the enhanced response text.
      `;

      const responseInput = `Your response: "${content}"
        
        Emotional Context: ${JSON.stringify(emotionalContext, null, 2)}
        Conversation Context: ${conversationSummary}
        Additional Context: ${context ? JSON.stringify(context, null, 2) : 'None'}`;

      const response = await realApiService.openai.generateAIResponse(
        instructions,
        responseInput,
        {
          maxTokens: 400,
          temperature: 0.6,
          previousResponseId: summaryResult.lastResponseId
        }
      );
      
      const enhancedResponse = response.output_text || content;
      return enhancedResponse;
    } catch (error) {
      console.error('Failed to generate emotional response:', error);
      return content; // Fallback to original
    }
  }

  // Generate voice synthesis parameters based on emotion
  generateVoiceParameters(emotionalContext?: EmotionalContext): any {
    const context = emotionalContext || this.currentEmotionalContext;
    
    const baseParams = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5
    };

    // Adjust parameters based on emotional context
    switch (context.userEmotion) {
      case 'excited':
        return {
          ...baseParams,
          stability: 0.7, // More animated
          style: 0.8, // More expressive
          speaking_rate: 1.1 // Slightly faster
        };
      
      case 'frustrated':
        return {
          ...baseParams,
          stability: 0.8, // More calm and steady
          style: 0.3, // Less expressive, more soothing
          speaking_rate: 0.9 // Slightly slower
        };
      
      case 'confused':
        return {
          ...baseParams,
          stability: 0.9, // Very clear and steady
          style: 0.4, // Patient and clear
          speaking_rate: 0.85 // Slower for clarity
        };
      
      case 'satisfied':
        return {
          ...baseParams,
          stability: 0.6,
          style: 0.7, // Warm and positive
          speaking_rate: 1.0
        };
      
      case 'urgent':
        return {
          ...baseParams,
          stability: 0.7,
          style: 0.6, // Focused and direct
          speaking_rate: 1.2 // Faster to convey urgency
        };
      
      default: // neutral
        return baseParams;
    }
  }

  // Generate voice response with emotional intelligence
  async generateEmotionalVoiceResponse(
    text: string,
    agentName: string,
    context?: any
  ): Promise<string | null> {
    try {
      // First enhance the text content for emotional appropriateness
      const enhancedText = await this.generateEmotionalResponse(text, agentName, context);
      
      // Generate voice parameters based on emotional context
      const voiceParams = this.generateVoiceParameters();
      
      // Generate speech with ElevenLabs if available
      if (!realApiService.elevenlabs) {
        console.warn('ElevenLabs not configured, skipping voice generation');
        return null;
      }

      const audioUrl = await realApiService.elevenlabs.generateSpeech(enhancedText);
      
      if (audioUrl) {
        console.log('🎙️ Generated emotionally intelligent voice response');
        
        // Log the emotional enhancement
        await contextualMemoryService.addMessage(
          'system',
          `Generated emotional voice response with ${this.currentEmotionalContext.conversationTone} tone`,
          'Emotional Voice Service'
        );
      }
      
      return audioUrl;
    } catch (error) {
      console.error('Failed to generate emotional voice response:', error);
      return null;
    }
  }

  // Adapt response based on user feedback
  async adaptToUserFeedback(feedback: 'positive' | 'negative' | 'neutral', context?: string): Promise<void> {
    try {
      if (feedback === 'positive') {
        // User liked the response style, continue with similar approach
        console.log('👍 Positive feedback received, maintaining current emotional approach');
      } else if (feedback === 'negative') {
        // Adjust emotional approach
        if (this.currentEmotionalContext.conversationTone === 'casual') {
          this.currentEmotionalContext.conversationTone = 'professional';
        } else if (this.currentEmotionalContext.responseStyle === 'detailed') {
          this.currentEmotionalContext.responseStyle = 'concise';
        }
        console.log('👎 Negative feedback received, adjusting emotional approach');
      }

      // Log feedback for learning
      await contextualMemoryService.addMessage(
        'system',
        `User feedback: ${feedback}. Context: ${context || 'none'}`,
        'Emotional Voice Service'
      );
    } catch (error) {
      console.error('Failed to adapt to user feedback:', error);
    }
  }

  // Get current emotional context
  getCurrentEmotionalContext(): EmotionalContext {
    return { ...this.currentEmotionalContext };
  }

  // Set emotional context manually (for testing or specific scenarios)
  setEmotionalContext(context: Partial<EmotionalContext>): void {
    this.currentEmotionalContext = {
      ...this.currentEmotionalContext,
      ...context
    };
  }

  // Reset to neutral emotional state
  resetEmotionalState(): void {
    this.currentEmotionalContext = {
      userEmotion: 'neutral',
      conversationTone: 'professional',
      businessContext: 'learning',
      responseStyle: 'detailed'
    };
  }
}

export const emotionalVoiceService = EmotionalVoiceService.getInstance();