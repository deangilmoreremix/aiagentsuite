import { realApiService } from './realApiService';
import { contextualMemoryService } from './contextualMemoryService';
import { supabaseService } from './supabaseClient';

interface ConversationInsight {
  id: string;
  type: 'communication_pattern' | 'effectiveness_tip' | 'goal_suggestion' | 'optimization_opportunity';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
  potentialImpact: string;
  createdAt: Date;
}

interface ConversationAnalytics {
  totalInteractions: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
  topTopics: string[];
  communicationPatterns: {
    preferredStyle: 'concise' | 'detailed' | 'conversational';
    peakActivityTimes: string[];
    frequentRequests: string[];
  };
  improvementOpportunities: string[];
}

export class ConversationInsightsService {
  private static instance: ConversationInsightsService;
  private insightsCache: Map<string, ConversationInsight[]> = new Map();
  private analyticsCache: Map<string, ConversationAnalytics> = new Map();

  static getInstance(): ConversationInsightsService {
    if (!ConversationInsightsService.instance) {
      ConversationInsightsService.instance = new ConversationInsightsService();
    }
    return ConversationInsightsService.instance;
  }

  // Generate real-time conversation insights
  async generateConversationInsights(userId: string): Promise<ConversationInsight[]> {
    try {
      console.log('🔍 Analyzing conversation patterns for insights...');

      const context = contextualMemoryService.getCurrentContext();
      if (!context || context.messages.length < 3) {
        return []; // Need some conversation history to analyze
      }

      const recentMessages = context.messages.slice(-20);
      const conversationSummary = await contextualMemoryService.getContextualSummary();

      const insightsPrompt = `
        Analyze this conversation and provide actionable insights:
        
        Recent Messages:
        ${recentMessages.map(msg => `${msg.type}: ${msg.content}`).join('\n')}
        
        Conversation Summary: ${conversationSummary}
        
        Generate 3-5 insights that help the user improve their CRM usage and communication effectiveness.
        
        Focus on:
        1. Communication patterns and efficiency opportunities
        2. Frequently discussed topics that could be automated
        3. Goal suggestions based on conversation themes
        4. Process optimization opportunities
        
        Return JSON array:
        [
          {
            "type": "communication_pattern|effectiveness_tip|goal_suggestion|optimization_opportunity",
            "title": "Clear, actionable title",
            "description": "Detailed explanation of the insight",
            "confidence": 85,
            "actionable": true,
            "suggestedAction": "Specific action the user can take",
            "potentialImpact": "Expected business benefit"
          }
        ]
        
        Make insights specific, actionable, and valuable for CRM/sales improvement.
      `;

      const insights = await realApiService.openai.generateText(insightsPrompt, 1000, 0.4);
      const parsedInsights: ConversationInsight[] = JSON.parse(insights).map((insight: any) => ({
        ...insight,
        id: `insight-${Date.now()}-${Math.random()}`,
        createdAt: new Date()
      }));

      this.insightsCache.set(userId, parsedInsights);
      console.log(`✅ Generated ${parsedInsights.length} conversation insights`);
      return parsedInsights;

    } catch (error) {
      console.error('❌ Failed to generate conversation insights:', error);
      return [];
    }
  }

  // Analyze conversation effectiveness and patterns
  async analyzeConversationEffectiveness(userId: string): Promise<ConversationAnalytics> {
    try {
      const context = contextualMemoryService.getCurrentContext();
      if (!context) {
        return this.getDefaultAnalytics();
      }

      const effectivenessPrompt = `
        Analyze conversation effectiveness and patterns:
        
        Messages: ${context.messages.length}
        Recent Conversation:
        ${context.messages.slice(-15).map(msg => `${msg.type}: ${msg.content}`).join('\n')}
        
        Analyze and return JSON:
        {
          "totalInteractions": ${context.messages.length},
          "averageResponseTime": 2.5,
          "userSatisfactionScore": 85,
          "topTopics": ["topic1", "topic2", "topic3"],
          "communicationPatterns": {
            "preferredStyle": "detailed|concise|conversational",
            "peakActivityTimes": ["morning", "afternoon"],
            "frequentRequests": ["request1", "request2"]
          },
          "improvementOpportunities": ["opportunity1", "opportunity2"]
        }
        
        Base your analysis on actual conversation content and patterns.
      `;

      const analysis = await realApiService.openai.generateText(effectivenessPrompt, 500, 0.3);
      const analytics: ConversationAnalytics = JSON.parse(analysis);
      
      this.analyticsCache.set(userId, analytics);
      return analytics;

    } catch (error) {
      console.error('Failed to analyze conversation effectiveness:', error);
      return this.getDefaultAnalytics();
    }
  }

  // Get conversation insights with caching
  getConversationInsights(userId: string): ConversationInsight[] {
    return this.insightsCache.get(userId) || [];
  }

  // Get conversation analytics with caching
  getConversationAnalytics(userId: string): ConversationAnalytics {
    return this.analyticsCache.get(userId) || this.getDefaultAnalytics();
  }

  private getDefaultAnalytics(): ConversationAnalytics {
    return {
      totalInteractions: 0,
      averageResponseTime: 0,
      userSatisfactionScore: 0,
      topTopics: [],
      communicationPatterns: {
        preferredStyle: 'conversational',
        peakActivityTimes: [],
        frequentRequests: []
      },
      improvementOpportunities: []
    };
  }

  // Clear insights cache
  clearInsights(userId: string): void {
    this.insightsCache.delete(userId);
    this.analyticsCache.delete(userId);
  }
}

export const conversationInsightsService = ConversationInsightsService.getInstance();