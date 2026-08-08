import { contextualMemoryService } from './contextualMemoryService';
import { supabaseService } from './supabaseClient';
import { realApiService } from './realApiService';
import { allGoals } from '../data/goalsData';

interface ProactiveSuggestion {
  id: string;
  type: 'action' | 'insight' | 'goal' | 'optimization' | 'warning';
  title: string;
  description: string;
  confidence: number;
  category: string;
  actionable: boolean;
  crmData?: any;
  suggestedCommand?: string;
  estimatedValue?: number;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

interface CRMAnalysis {
  contacts: {
    total: number;
    recent: number;
    needsFollowUp: number;
    highPriority: number;
  };
  deals: {
    total: number;
    stale: number;
    closingThisWeek: number;
    needsAttention: number;
  };
  activities: {
    todayCount: number;
    missedFollowUps: number;
    scheduledMeetings: number;
  };
  insights: string[];
}

export class ProactiveAssistantService {
  private static instance: ProactiveAssistantService;
  private suggestionCache: Map<string, ProactiveSuggestion[]> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;

  static getInstance(): ProactiveAssistantService {
    if (!ProactiveAssistantService.instance) {
      ProactiveAssistantService.instance = new ProactiveAssistantService();
    }
    return ProactiveAssistantService.instance;
  }

  // Start proactive monitoring
  startProactiveMonitoring(userId: string): void {
    if (this.analysisInterval) return;

    console.log('🔍 Starting proactive AI assistant monitoring...');
    
    // Run analysis every 30 seconds
    this.analysisInterval = setInterval(() => {
      this.generateProactiveSuggestions(userId);
    }, 30000);

    // Run initial analysis
    this.generateProactiveSuggestions(userId);
  }

  // Stop proactive monitoring
  stopProactiveMonitoring(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  // Generate intelligent suggestions based on current context
  async generateProactiveSuggestions(userId: string): Promise<ProactiveSuggestion[]> {
    try {
      console.log('🧠 Generating proactive suggestions with GPT-5...');

      const crmAnalysis = await this.analyzeCRMState(userId);
      const contextSummary = await contextualMemoryService.getContextualSummary();

      const suggestionPrompt = `
        You are a proactive AI business assistant. Analyze the current situation and generate helpful suggestions.
        
        User Context: ${contextSummary}
        
        CRM Analysis: ${JSON.stringify(crmAnalysis, null, 2)}
        
        Available Goals: ${allGoals.slice(0, 10).map(g => `${g.title}: ${g.description}`).join('\n')}
        
        Generate 3-5 proactive suggestions that would be valuable right now. Consider:
        1. Immediate actions the user could take
        2. Opportunities based on CRM data
        3. Relevant goals they might want to execute
        4. Potential issues that need attention
        5. Optimization opportunities
        
        For each suggestion, provide:
        - Type: action, insight, goal, optimization, or warning
        - Title: Clear, actionable title
        - Description: Brief explanation of value
        - Confidence: 0-100 score
        - Priority: low, medium, or high
        - Suggested command: Exact text the user could say/type
        - Estimated value: Dollar amount if applicable
        
        Return as JSON array with this structure:
        [
          {
            "type": "action",
            "title": "Follow up with hot leads",
            "description": "3 leads opened your emails but haven't responded",
            "confidence": 85,
            "category": "sales",
            "priority": "high",
            "suggestedCommand": "Send follow-up emails to leads who opened but didn't respond",
            "estimatedValue": 15000
          }
        ]
      `;

      const suggestions = await realApiService.openai.generateText(suggestionPrompt, 1000, 0.3);
      const parsedSuggestions: ProactiveSuggestion[] = JSON.parse(suggestions).map((s: any) => ({
        ...s,
        id: `suggestion-${Date.now()}-${Math.random()}`,
        actionable: true,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour expiry
      }));

      // Cache suggestions
      this.suggestionCache.set(userId, parsedSuggestions);
      
      console.log(`✅ Generated ${parsedSuggestions.length} proactive suggestions`);
      return parsedSuggestions;

    } catch (error) {
      console.error('❌ Failed to generate proactive suggestions:', error);
      return [];
    }
  }

  // Get current suggestions for user
  getActiveSuggestions(userId: string): ProactiveSuggestion[] {
    const suggestions = this.suggestionCache.get(userId) || [];
    const now = new Date();
    
    // Filter out expired suggestions
    return suggestions.filter(s => !s.expiresAt || s.expiresAt > now);
  }

  // Analyze current CRM state for insights
  private async analyzeCRMState(userId: string): Promise<CRMAnalysis> {
    try {
      if (!supabaseService.isAvailable()) {
        return this.getMockCRMAnalysis();
      }

      // Get recent CRM data
      const [contacts, deals] = await Promise.all([
        supabaseService.getContacts(userId),
        supabaseService.getDeals(userId)
      ]);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const analysis: CRMAnalysis = {
        contacts: {
          total: contacts.length,
          recent: contacts.filter(c => new Date(c.created_at) > weekAgo).length,
          needsFollowUp: contacts.filter(c => {
            const lastContact = new Date(c.last_contacted || c.created_at);
            return (now.getTime() - lastContact.getTime()) > 7 * 24 * 60 * 60 * 1000;
          }).length,
          highPriority: contacts.filter(c => c.lead_score >= 80).length
        },
        deals: {
          total: deals.length,
          stale: deals.filter(d => {
            const updated = new Date(d.updated_at);
            return (now.getTime() - updated.getTime()) > 14 * 24 * 60 * 60 * 1000;
          }).length,
          closingThisWeek: deals.filter(d => {
            if (!d.expected_close_date) return false;
            const closeDate = new Date(d.expected_close_date);
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return closeDate <= weekFromNow && closeDate >= now;
          }).length,
          needsAttention: deals.filter(d => d.probability < 30 && d.status === 'open').length
        },
        activities: {
          todayCount: 0, // Would query activities table
          missedFollowUps: 0,
          scheduledMeetings: 0
        },
        insights: []
      };

      return analysis;
    } catch (error) {
      console.error('Failed to analyze CRM state:', error);
      return this.getMockCRMAnalysis();
    }
  }

  private getMockCRMAnalysis(): CRMAnalysis {
    return {
      contacts: {
        total: 234,
        recent: 12,
        needsFollowUp: 18,
        highPriority: 7
      },
      deals: {
        total: 45,
        stale: 8,
        closingThisWeek: 3,
        needsAttention: 5
      },
      activities: {
        todayCount: 6,
        missedFollowUps: 3,
        scheduledMeetings: 2
      },
      insights: [
        'Your response rate increased 23% this week',
        '3 deals are approaching close date',
        '18 contacts need follow-up attention'
      ]
    };
  }

  // Dismiss a suggestion
  dismissSuggestion(userId: string, suggestionId: string): void {
    const suggestions = this.suggestionCache.get(userId) || [];
    const filtered = suggestions.filter(s => s.id !== suggestionId);
    this.suggestionCache.set(userId, filtered);
  }

  // Execute a suggested action
  async executeSuggestion(userId: string, suggestion: ProactiveSuggestion): Promise<any> {
    if (!suggestion.suggestedCommand) {
      throw new Error('Suggestion does not have an executable command');
    }

    try {
      console.log(`🚀 Executing suggested action: ${suggestion.title}`);
      
      // Add context about this being a proactive suggestion
      await contextualMemoryService.addMessage(
        'system',
        `User accepted proactive suggestion: ${suggestion.title}`,
        'Proactive Assistant'
      );

      // Execute the suggested command using existing agent system
      const result = await realApiService.openai.generateText(
        `Execute this proactive suggestion: ${suggestion.suggestedCommand}. 
         Context: ${await contextualMemoryService.getContextualSummary()}`,
        500
      );

      // Log successful execution
      await contextualMemoryService.addMessage(
        'ai',
        `Successfully executed: ${suggestion.title}. ${result}`,
        'Proactive Assistant',
        ['proactive_execution']
      );

      // Remove executed suggestion
      this.dismissSuggestion(userId, suggestion.id);

      return result;
    } catch (error) {
      console.error('Failed to execute suggestion:', error);
      throw error;
    }
  }

  // Get personalized insights
  async getPersonalizedInsights(userId: string): Promise<string[]> {
    try {
      const crmAnalysis = await this.analyzeCRMState(userId);
      const contextSummary = await contextualMemoryService.getContextualSummary();

      const insightPrompt = `
        Generate 3-5 personalized business insights based on this data:
        
        CRM Analysis: ${JSON.stringify(crmAnalysis, null, 2)}
        User Context: ${contextSummary}
        
        Create insights that are:
        1. Specific to this user's situation
        2. Actionable and valuable
        3. Based on data patterns
        4. Forward-looking
        
        Examples:
        - "Your follow-up timing has improved response rates by 34%"
        - "TechCorp prospects convert 2x better with technical content"
        - "Scheduling demos on Tuesdays increases show-up rates"
        
        Return as simple text array.
      `;

      const insights = await realApiService.openai.generateText(insightPrompt, 400, 0.4);
      return insights.split('\n').filter(i => i.trim().length > 0);
    } catch (error) {
      console.error('Failed to generate personalized insights:', error);
      return [];
    }
  }
}

export const proactiveAssistantService = ProactiveAssistantService.getInstance();