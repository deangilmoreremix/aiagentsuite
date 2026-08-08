import { realApiService } from './realApiService';
import { contextualMemoryService } from './contextualMemoryService';
import { supabaseService } from './supabaseClient';
import { allGoals } from '../data/goalsData';

interface WorkflowSuggestion {
  id: string;
  name: string;
  description: string;
  triggerConditions: string[];
  steps: WorkflowStep[];
  estimatedImpact: string;
  confidence: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'triggered';
  category: 'sales' | 'marketing' | 'customer_service' | 'data_management';
  priority: 'low' | 'medium' | 'high';
  requiredTools: string[];
  estimatedSetupTime: string;
  potentialROI: number;
}

interface WorkflowStep {
  stepNumber: number;
  agentName: string;
  action: string;
  parameters: Record<string, any>;
  dependsOn?: number[];
  estimatedDuration: number;
}

interface UserBehaviorPattern {
  userId: string;
  commonActions: string[];
  timePatterns: Record<string, number>;
  goalPreferences: string[];
  toolUsage: Record<string, number>;
  automationOpportunities: string[];
  lastAnalyzed: Date;
}

export class SmartWorkflowService {
  private static instance: SmartWorkflowService;
  private workflowSuggestions: Map<string, WorkflowSuggestion[]> = new Map();
  private behaviorPatterns: Map<string, UserBehaviorPattern> = new Map();

  static getInstance(): SmartWorkflowService {
    if (!SmartWorkflowService.instance) {
      SmartWorkflowService.instance = new SmartWorkflowService();
    }
    return SmartWorkflowService.instance;
  }

  // Analyze user behavior and suggest workflow automations
  async generateWorkflowSuggestions(userId: string): Promise<WorkflowSuggestion[]> {
    try {
      console.log('🔄 Analyzing user patterns for workflow suggestions...');

      const behaviorPattern = await this.analyzeBehaviorPatterns(userId);
      const conversationContext = await contextualMemoryService.getContextualSummary();
      const crmData = await this.getCRMDataSummary(userId);

      const workflowPrompt = `
        GPT-5 ENHANCED WORKFLOW INTELLIGENCE:
        Apply advanced pattern recognition and business optimization to suggest sophisticated workflow automations:
        
        User Behavior Pattern: ${JSON.stringify(behaviorPattern, null, 2)}
        Conversation Context: ${conversationContext}
        CRM Data Summary: ${JSON.stringify(crmData, null, 2)}
        
        ADVANCED REASONING REQUIREMENTS:
        - Identify subtle patterns and optimization opportunities
        - Consider business process maturity and scalability
        - Evaluate cross-functional impact and dependencies
        - Predict workflow evolution and adaptation needs
        
        Available Goals for Workflow Building:
        ${allGoals.slice(0, 15).map(g => `${g.id}: ${g.title} - ${g.description}`).join('\n')}
        
        Generate 4-6 workflow suggestions that:
        1. Automate repetitive tasks the user performs
        2. Chain together related goals for maximum efficiency
        3. Address gaps in their current process
        4. Leverage their preferred tools and timing
        
        Return JSON array:
        [
          {
            "name": "Automated Lead Nurturing Workflow",
            "description": "Complete description of what this workflow does",
            "triggerConditions": ["New lead added", "Lead score increases"],
            "steps": [
              {
                "stepNumber": 1,
                "agentName": "AI SDR Agent",
                "action": "Send welcome email",
                "parameters": {"template": "welcome_sequence"},
                "estimatedDuration": 60
              }
            ],
            "estimatedImpact": "Increase lead conversion by 40%",
            "confidence": 90,
            "frequency": "triggered",
            "category": "sales",
            "priority": "high",
            "requiredTools": ["gmail", "hubspot"],
            "estimatedSetupTime": "15 minutes",
            "potentialROI": 25000
          }
        ]
      `;

      const suggestions = await realApiService.openai.generateText(workflowPrompt, 1500, 0.3);
      const parsedSuggestions: WorkflowSuggestion[] = JSON.parse(suggestions).map((suggestion: any) => ({
        ...suggestion,
        id: `workflow-${Date.now()}-${Math.random()}`
      }));

      this.workflowSuggestions.set(userId, parsedSuggestions);
      console.log(`✅ Generated ${parsedSuggestions.length} workflow suggestions`);
      return parsedSuggestions;

    } catch (error) {
      console.error('❌ Failed to generate workflow suggestions:', error);
      return this.getFallbackWorkflows();
    }
  }

  // Analyze user behavior patterns
  private async analyzeBehaviorPatterns(userId: string): Promise<UserBehaviorPattern> {
    try {
      const context = contextualMemoryService.getCurrentContext();
      const messages = context?.messages || [];
      
      // Analyze message patterns
      const userMessages = messages.filter(msg => msg.type === 'user');
      const commonActions = this.extractCommonActions(userMessages.map(msg => msg.content));
      
      // Time pattern analysis
      const timePatterns = this.analyzeTimePatterns(userMessages);
      
      // Goal preferences (would be enhanced with actual goal execution data)
      const goalPreferences = this.inferGoalPreferences(userMessages);

      const pattern: UserBehaviorPattern = {
        userId,
        commonActions,
        timePatterns,
        goalPreferences,
        toolUsage: {}, // Would be populated from actual tool usage data
        automationOpportunities: this.identifyAutomationOpportunities(commonActions),
        lastAnalyzed: new Date()
      };

      this.behaviorPatterns.set(userId, pattern);
      return pattern;

    } catch (error) {
      console.error('Failed to analyze behavior patterns:', error);
      return {
        userId,
        commonActions: [],
        timePatterns: {},
        goalPreferences: [],
        toolUsage: {},
        automationOpportunities: [],
        lastAnalyzed: new Date()
      };
    }
  }

  // Extract common actions from user messages
  private extractCommonActions(messages: string[]): string[] {
    const actionKeywords = [
      'create contact', 'send email', 'schedule meeting', 'update deal',
      'follow up', 'generate report', 'analyze data', 'book demo'
    ];

    const actionCounts: Record<string, number> = {};
    
    messages.forEach(message => {
      const lowerMessage = message.toLowerCase();
      actionKeywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
          actionCounts[keyword] = (actionCounts[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action]) => action);
  }

  // Analyze time patterns of user activity
  private analyzeTimePatterns(messages: any[]): Record<string, number> {
    const patterns: Record<string, number> = {};
    
    messages.forEach(message => {
      const hour = message.timestamp.getHours();
      let period: string;
      
      if (hour < 6) period = 'early_morning';
      else if (hour < 12) period = 'morning';
      else if (hour < 18) period = 'afternoon';
      else period = 'evening';
      
      patterns[period] = (patterns[period] || 0) + 1;
    });

    return patterns;
  }

  // Infer goal preferences from conversation
  private inferGoalPreferences(messages: any[]): string[] {
    const preferences: Record<string, number> = {};
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      if (content.includes('lead') || content.includes('prospect')) {
        preferences['lead_generation'] = (preferences['lead_generation'] || 0) + 1;
      }
      if (content.includes('email') || content.includes('outreach')) {
        preferences['email_automation'] = (preferences['email_automation'] || 0) + 1;
      }
      if (content.includes('meeting') || content.includes('calendar')) {
        preferences['scheduling'] = (preferences['scheduling'] || 0) + 1;
      }
      if (content.includes('deal') || content.includes('sales')) {
        preferences['deal_management'] = (preferences['deal_management'] || 0) + 1;
      }
    });

    return Object.entries(preferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([pref]) => pref);
  }

  // Identify automation opportunities
  private identifyAutomationOpportunities(commonActions: string[]): string[] {
    const opportunities = [];
    
    if (commonActions.includes('send email') && commonActions.includes('follow up')) {
      opportunities.push('Automate follow-up email sequences');
    }
    if (commonActions.includes('create contact') && commonActions.includes('schedule meeting')) {
      opportunities.push('Auto-schedule demos after contact creation');
    }
    if (commonActions.includes('update deal') && commonActions.includes('send email')) {
      opportunities.push('Trigger emails on deal stage changes');
    }
    
    return opportunities;
  }

  // Get CRM data summary for workflow analysis
  private async getCRMDataSummary(_userId: string): Promise<any> {
    try {
      if (!supabaseService.isAvailable()) {
        return {
          contacts: { total: 0, recent: 0 },
          deals: { total: 0, active: 0 },
          activities: { total: 0, recent: 0 }
        };
      }

      const [contacts, deals] = await Promise.all([
        supabaseService.getContacts(),
        supabaseService.getDeals()
      ]);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      return {
        contacts: {
          total: contacts.length,
          recent: contacts.filter(c => new Date(c.created_at || '') > weekAgo).length,
          needsAttention: contacts.filter(c => !c.last_contacted).length
        },
        deals: {
          total: deals.length,
          active: deals.filter(d => d.status === 'open').length,
          stale: deals.filter(d => {
            const updated = new Date(d.updated_at || d.created_at || '');
            return (now.getTime() - updated.getTime()) > 14 * 24 * 60 * 60 * 1000;
          }).length
        },
        activities: {
          total: 0, // Would come from activities table
          recent: 0
        }
      };

    } catch (error) {
      console.error('Failed to get CRM data summary:', error);
      return { contacts: { total: 0 }, deals: { total: 0 }, activities: { total: 0 } };
    }
  }

  // Get workflow suggestions with caching
  getWorkflowSuggestions(userId: string): WorkflowSuggestion[] {
    return this.workflowSuggestions.get(userId) || [];
  }

  // Get behavior patterns
  getBehaviorPatterns(userId: string): UserBehaviorPattern | null {
    return this.behaviorPatterns.get(userId) || null;
  }

  // Fallback workflows for when AI analysis fails
  private getFallbackWorkflows(): WorkflowSuggestion[] {
    return [
      {
        id: 'fallback-1',
        name: 'Lead Follow-up Automation',
        description: 'Automatically follow up with new leads after 24 hours',
        triggerConditions: ['New contact created', '24 hours elapsed'],
        steps: [
          {
            stepNumber: 1,
            agentName: 'Email Agent',
            action: 'Send welcome email',
            parameters: { template: 'welcome' },
            estimatedDuration: 30
          }
        ],
        estimatedImpact: 'Increase response rates by 25%',
        confidence: 80,
        frequency: 'triggered',
        category: 'sales',
        priority: 'medium',
        requiredTools: ['gmail'],
        estimatedSetupTime: '10 minutes',
        potentialROI: 15000
      }
    ];
  }
}

export const smartWorkflowService = SmartWorkflowService.getInstance();