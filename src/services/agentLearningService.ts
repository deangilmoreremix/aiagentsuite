import { realApiService } from './realApiService';
import { supabaseService } from './supabaseClient';

interface AgentPerformanceData {
  agentName: string;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  userSatisfactionScore: number;
  improvementTrends: {
    timeframe: string;
    metricChange: number;
  }[];
  commonFailureReasons: string[];
  optimizationSuggestions: string[];
}

interface LearningInsight {
  id: string;
  agentName: string;
  insightType: 'performance_improvement' | 'user_preference' | 'process_optimization' | 'error_pattern';
  title: string;
  description: string;
  actionable: boolean;
  implementationSuggestion?: string;
  expectedImprovement: string;
  confidence: number;
  createdAt: Date;
}

interface UserInteractionPattern {
  userId: string;
  preferredAgents: string[];
  commonWorkflows: string[];
  successfulInteractions: {
    pattern: string;
    successRate: number;
    frequency: number;
  }[];
  challengingAreas: string[];
  learningOpportunities: string[];
}

export class AgentLearningService {
  private static instance: AgentLearningService;
  private performanceData: Map<string, AgentPerformanceData> = new Map();
  private learningInsights: Map<string, LearningInsight[]> = new Map();
  private userPatterns: Map<string, UserInteractionPattern> = new Map();

  static getInstance(): AgentLearningService {
    if (!AgentLearningService.instance) {
      AgentLearningService.instance = new AgentLearningService();
    }
    return AgentLearningService.instance;
  }

  // Analyze agent performance and generate learning insights
  async analyzeAgentPerformance(userId: string): Promise<LearningInsight[]> {
    try {
      console.log('📊 Analyzing agent performance for learning insights...');

      const performanceData = await this.gatherPerformanceData(userId);
      const userPatterns = await this.analyzeUserInteractionPatterns(userId);

      const learningPrompt = `
        Analyze agent performance data and user interaction patterns to generate learning insights:
        
        Agent Performance Data:
        ${JSON.stringify(performanceData, null, 2)}
        
        User Interaction Patterns:
        ${JSON.stringify(userPatterns, null, 2)}
        
        GPT-5 ADVANCED PERFORMANCE ANALYSIS:
        Apply sophisticated reasoning to generate insights that go beyond surface-level metrics:
        - Identify subtle performance patterns and correlation factors
        - Analyze cross-agent synergies and optimization opportunities
        - Evaluate business impact optimization strategies
        - Consider predictive improvement pathways
        
        Generate insights that help:
        1. Improve agent performance based on success/failure patterns
        2. Adapt to user preferences and communication styles
        3. Optimize workflows based on usage patterns
        4. Identify training opportunities for better results
        
        Return JSON array:
        [
          {
            "agentName": "AI SDR Agent",
            "insightType": "performance_improvement",
            "title": "Improve email personalization success",
            "description": "Advanced pattern analysis reveals Email Agent shows 15% lower success rate with tech prospects due to insufficient technical context",
            "actionable": true,
            "implementationSuggestion": "Implement dynamic technical content insertion based on prospect company technology stack analysis",
            "expectedImprovement": "Increase tech prospect response rate by 20-25% with 95% confidence based on pattern analysis",
            "confidence": 95,
            "sophisticatedReasoning": "GPT-5 analysis identified correlation between technical depth and engagement rates",
            "crossAgentSynergy": ["Lead Scoring Agent can provide technical intelligence", "Research Agent can gather tech stack data"],
            "predictiveValue": "This optimization will likely improve performance across all technical verticals",
            "implementationComplexity": "medium",
            "expectedTimeToValue": "2-3 weeks",
            "measurementStrategy": "A/B test technical vs standard templates with engagement rate tracking"
          }
        ]
        
        Focus on sophisticated, actionable insights that leverage GPT-5's advanced analytical capabilities for maximum agent optimization.
      `;

      const response = await realApiService.openai.generateAIResponse(
        learningPrompt,
        'Generate advanced learning insights with GPT-5 intelligence',
        {
          taskType: 'complex_reasoning',
          complexity: 'advanced',
          enableChainOfThought: true,
          temperature: 0.2,
          maxTokens: 2000,
          qualityMode: 'accuracy',
          store: true
        }
      );
      
      const insightsText = response.output_text || '';
      const parsedInsights: LearningInsight[] = JSON.parse(insightsText).map((insight: any) => ({
        ...insight,
        id: `insight-${Date.now()}-${Math.random()}`,
        createdAt: new Date()
      }));

      this.learningInsights.set(userId, parsedInsights);
      console.log(`✅ Generated ${parsedInsights.length} GPT-5 enhanced learning insights`);
      return parsedInsights;

    } catch (error) {
      console.error('❌ Failed to analyze agent performance:', error);
      return [];
    }
  }

  // Gather agent performance data
  private async gatherPerformanceData(_userId: string): Promise<Record<string, AgentPerformanceData>> {
    try {
      // In a real implementation, this would query actual execution logs
      // For now, we'll simulate based on available data
      
      const agentNames = [
        'AI SDR Agent', 'AI AE Agent', 'Email Agent', 'Voice Agent',
        'Calendar Agent', 'Follow-up Agent', 'Lead Scoring Agent'
      ];

      const performanceData: Record<string, AgentPerformanceData> = {};

      agentNames.forEach(agentName => {
        performanceData[agentName] = {
          agentName,
          totalExecutions: Math.floor(Math.random() * 100) + 20,
          successRate: Math.floor(Math.random() * 20) + 75, // 75-95%
          averageExecutionTime: Math.floor(Math.random() * 3000) + 1000, // 1-4 seconds
          userSatisfactionScore: Math.floor(Math.random() * 15) + 80, // 80-95%
          improvementTrends: [
            {
              timeframe: 'last_week',
              metricChange: Math.floor(Math.random() * 10) - 5 // -5 to +5
            }
          ],
          commonFailureReasons: this.getCommonFailureReasons(agentName),
          optimizationSuggestions: []
        };
      });

      return performanceData;

    } catch (error) {
      console.error('Failed to gather performance data:', error);
      return {};
    }
  }

  // Analyze user interaction patterns
  private async analyzeUserInteractionPatterns(userId: string): Promise<UserInteractionPattern> {
    try {
      // This would analyze actual user interaction data
      const pattern: UserInteractionPattern = {
        userId,
        preferredAgents: ['AI SDR Agent', 'Email Agent'],
        commonWorkflows: ['lead_generation', 'follow_up_sequences'],
        successfulInteractions: [
          {
            pattern: 'email_then_call',
            successRate: 85,
            frequency: 12
          }
        ],
        challengingAreas: ['complex_negotiations', 'objection_handling'],
        learningOpportunities: ['voice_interaction_improvement', 'advanced_automation']
      };

      this.userPatterns.set(userId, pattern);
      return pattern;

    } catch (error) {
      console.error('Failed to analyze user patterns:', error);
      return {
        userId,
        preferredAgents: [],
        commonWorkflows: [],
        successfulInteractions: [],
        challengingAreas: [],
        learningOpportunities: []
      };
    }
  }

  // Get common failure reasons for specific agents
  private getCommonFailureReasons(agentName: string): string[] {
    const reasonMap: Record<string, string[]> = {
      'AI SDR Agent': ['Invalid contact data', 'Rate limiting', 'Email deliverability'],
      'Email Agent': ['Template formatting', 'Personalization failures', 'Spam filters'],
      'Voice Agent': ['Audio processing errors', 'Network latency', 'Voice recognition'],
      'Calendar Agent': ['Timezone conflicts', 'Availability sync', 'Permission issues']
    };

    return reasonMap[agentName] || ['Configuration issues', 'Network timeouts'];
  }

  // Apply learning insights to improve agent behavior
  async applyLearningInsights(userId: string, insights: LearningInsight[]): Promise<boolean> {
    try {
      console.log('🧠 Applying learning insights to improve agent performance...');

      for (const insight of insights.filter(i => i.actionable)) {
        // Log the learning application
        if (supabaseService.isAvailable()) {
          await supabaseService.logActivity({
            customer_id: userId,
            type: 'agent_learning',
            title: `Applied learning: ${insight.title}`,
            description: insight.implementationSuggestion || insight.description,
            metadata: {
              agentName: insight.agentName,
              insightType: insight.insightType,
              expectedImprovement: insight.expectedImprovement,
              confidence: insight.confidence
            }
          });
        }

        // Update agent performance tracking
        const currentPerformance = this.performanceData.get(insight.agentName);
        if (currentPerformance) {
          currentPerformance.optimizationSuggestions.push(insight.implementationSuggestion || insight.description);
          this.performanceData.set(insight.agentName, currentPerformance);
        }
      }

      console.log('✅ Learning insights applied successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to apply learning insights:', error);
      return false;
    }
  }

  // Get performance data for a specific agent
  getAgentPerformance(agentName: string): AgentPerformanceData | null {
    return this.performanceData.get(agentName) || null;
  }

  // Get all learning insights for a user
  getLearningInsights(userId: string): LearningInsight[] {
    return this.learningInsights.get(userId) || [];
  }

  // Get user interaction patterns
  getUserInteractionPatterns(userId: string): UserInteractionPattern | null {
    return this.userPatterns.get(userId) || null;
  }

  // Record agent execution result for learning
  recordAgentExecution(
    agentName: string,
    success: boolean,
    executionTime: number
  ): void {
    const currentData = this.performanceData.get(agentName) || {
      agentName,
      totalExecutions: 0,
      successRate: 0,
      averageExecutionTime: 0,
      userSatisfactionScore: 0,
      improvementTrends: [],
      commonFailureReasons: [],
      optimizationSuggestions: []
    };

    // Update performance metrics
    currentData.totalExecutions++;
    const oldSuccessRate = currentData.successRate;
    currentData.successRate = ((oldSuccessRate * (currentData.totalExecutions - 1)) + (success ? 100 : 0)) / currentData.totalExecutions;
    currentData.averageExecutionTime = ((currentData.averageExecutionTime * (currentData.totalExecutions - 1)) + executionTime) / currentData.totalExecutions;

    this.performanceData.set(agentName, currentData);
  }

  // Generate agent improvement recommendations
  async generateAgentImprovements(agentName: string): Promise<string[]> {
    try {
      const performanceData = this.performanceData.get(agentName);
      if (!performanceData) return [];

      const improvementPrompt = `
        Analyze this agent's performance and suggest improvements:
        
        Agent: ${agentName}
        Performance Data: ${JSON.stringify(performanceData, null, 2)}
        
        Generate 3-5 specific improvement suggestions that could:
        1. Increase success rate
        2. Reduce execution time
        3. Improve user satisfaction
        4. Address common failure reasons
        
        Return as simple text array of actionable suggestions.
      `;

      const improvements = await realApiService.openai.generateText(improvementPrompt, 400, 0.4);
      return improvements.split('\n').filter(i => i.trim().length > 0);

    } catch (error) {
      console.error('Failed to generate agent improvements:', error);
      return [];
    }
  }
}

export const agentLearningService = AgentLearningService.getInstance();