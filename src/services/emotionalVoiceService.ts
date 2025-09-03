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
      const summaryResult = await contextualMemoryService.getContextualSummary(
        12000, // Increased context length for GPT-5
        true,   // Include detailed CRM context
        true    // Prioritize recent interactions
      );
      const conversationSummary = summaryResult.summary;

      const instructions = `You are ${agentName}, an emotionally intelligent AI assistant with advanced empathy, business acumen, and communication expertise.

EMOTIONAL INTELLIGENCE MISSION:
Transform your response to be perfectly attuned to the user's emotional state, communication preferences, and business context.

EMOTIONAL ADAPTATION FRAMEWORK:

USER EMOTIONAL STATE: ${emotionalContext.userEmotion}
Response Strategy:
${this.getEmotionalResponseStrategy(emotionalContext.userEmotion)}

CONVERSATION TONE: ${emotionalContext.conversationTone}
Communication Style:
${this.getCommunicationStyleGuide(emotionalContext.conversationTone)}

BUSINESS CONTEXT: ${emotionalContext.businessContext}
Context Adaptation:
${this.getBusinessContextGuide(emotionalContext.businessContext)}

RESPONSE STYLE: ${emotionalContext.responseStyle}
Delivery Format:
${this.getResponseStyleGuide(emotionalContext.responseStyle)}

ENHANCEMENT GUIDELINES:
1. Emotional Mirroring: Match the user's energy level and emotional state
2. Communication Alignment: Adapt language formality to their preference
3. Business Focus: Frame responses within their business context and priorities
4. Value Emphasis: Highlight benefits and outcomes that matter to them
5. Action Orientation: Provide clear next steps aligned with their working style
6. Confidence Building: Reinforce positive outcomes and address concerns proactively

ORIGINAL RESPONSE TO ENHANCE: "${content}"

Please rewrite this response with advanced emotional intelligence, maintaining all factual content while optimizing the emotional delivery and business relevance.`;

      const responseInput = `CONVERSATION CONTEXT:
${conversationSummary}

ADDITIONAL CONTEXT:
${context ? JSON.stringify(context, null, 2) : 'No additional context provided'}

EMOTIONAL STATE DETAILS:
- User Emotion: ${emotionalContext.userEmotion}
- Conversation Tone: ${emotionalContext.conversationTone}
- Business Context: ${emotionalContext.businessContext}
- Response Style: ${emotionalContext.responseStyle}

Transform the response to be emotionally intelligent and contextually perfect.`;

      const response = await realApiService.openai.generateAIResponse(
        instructions,
        responseInput,
        {
          taskType: 'creative',
          complexity: 'intermediate',
          temperature: 0.6,
          maxTokens: 500,
          previousResponseId: summaryResult.lastResponseId,
          store: true
        }
      );
      
      const enhancedResponse = response.output_text || content;
      return enhancedResponse;
    } catch (error) {
      console.error('Failed to generate emotional response:', error);
      return content; // Fallback to original
    }
  }

  // Get emotional response strategy for GPT-5
  private getEmotionalResponseStrategy(emotion: string): string {
    const strategies = {
      excited: `- Match their enthusiasm with energetic language
- Use action-oriented words and immediate next steps
- Celebrate their momentum and build on their energy
- Include positive reinforcement and achievement recognition`,
      
      frustrated: `- Acknowledge their frustration with genuine empathy
- Focus immediately on solutions and relief
- Use calming, reassuring language
- Provide clear, step-by-step guidance to resolve issues
- Avoid overwhelming them with too many options`,
      
      confused: `- Use patient, educational tone
- Break down complex concepts into simple steps
- Provide examples and analogies for clarity
- Ask gentle clarifying questions if needed
- Reassure them that confusion is normal and you're here to help`,
      
      satisfied: `- Celebrate their success and positive outcomes
- Build on their satisfaction with related opportunities
- Use warm, appreciative language
- Suggest logical next steps that maintain momentum`,
      
      urgent: `- Respond with immediate, actionable solutions
- Use direct, concise language
- Prioritize speed and efficiency in recommendations
- Show understanding of time sensitivity
- Provide fastest path to resolution`,
      
      neutral: `- Use balanced, professional tone
- Provide comprehensive but organized information
- Include both immediate actions and strategic considerations
- Maintain engagement with relevant insights and suggestions`
    };
    
    return strategies[emotion] || strategies.neutral;
  }

  // Get communication style guide for GPT-5
  private getCommunicationStyleGuide(tone: string): string {
    const guides = {
      professional: `- Use formal business language and structure
- Focus on ROI, metrics, and business outcomes
- Include specific data points and measurable results
- Reference industry best practices and standards`,
      
      casual: `- Use conversational, friendly language
- Include personal touches and relatable examples
- Use contractions and informal expressions naturally
- Keep tone warm and approachable`,
      
      supportive: `- Use encouraging, reassuring language
- Focus on guidance and assistance
- Acknowledge challenges while providing solutions
- Include confidence-building statements`,
      
      celebratory: `- Use enthusiastic, positive language
- Highlight achievements and successes
- Include congratulatory expressions
- Build excitement for future opportunities`,
      
      instructional: `- Use clear, educational language
- Break information into digestible steps
- Include helpful tips and best practices
- Anticipate follow-up questions`
    };
    
    return guides[tone] || guides.professional;
  }

  // Get business context guide for GPT-5
  private getBusinessContextGuide(context: string): string {
    const guides = {
      success: `- Reinforce positive outcomes and build on momentum
- Suggest scaling successful strategies
- Highlight achievement metrics and ROI
- Encourage continued excellence`,
      
      challenge: `- Focus on problem-solving and solutions
- Provide practical, actionable steps
- Address root causes, not just symptoms
- Offer multiple solution pathways`,
      
      learning: `- Use educational, explanatory tone
- Provide context and background information
- Include examples and use cases
- Anticipate learning progression needs`,
      
      planning: `- Use strategic, forward-thinking language
- Include goal-setting and milestone frameworks
- Consider long-term implications and benefits
- Provide structured planning approaches`,
      
      execution: `- Focus on implementation and action
- Provide specific, immediate next steps
- Include monitoring and success tracking
- Emphasize efficiency and results`
    };
    
    return guides[context] || guides.learning;
  }

  // Get response style guide for GPT-5
  private getResponseStyleGuide(style: string): string {
    const guides = {
      concise: `- Keep responses brief and action-focused
- Use bullet points and numbered lists
- Prioritize essential information only
- Include clear, immediate next steps`,
      
      detailed: `- Provide comprehensive explanations and context
- Include background information and rationale
- Address multiple aspects and considerations
- Offer thorough guidance and support`,
      
      encouraging: `- Use motivational and confidence-building language
- Highlight positive aspects and potential outcomes
- Include supportive statements and reassurance
- Focus on empowerment and capability building`,
      
      technical: `- Use precise, specific terminology
- Include methodologies and detailed processes
- Reference technical specifications and requirements
- Provide systematic approaches and frameworks`,
      
      strategic: `- Focus on long-term thinking and planning
- Include business impact and competitive advantages
- Consider scalability and growth implications
- Emphasize strategic decision-making frameworks`
    };
    
    return guides[style] || guides.detailed;
  }
        
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