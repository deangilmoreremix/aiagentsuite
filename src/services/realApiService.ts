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
      console.log('📊 Analyzing agent performance with GPT-5 advanced learning capabilities...');

      const performanceData = await this.gatherPerformanceData(userId);
      const userPatterns = await this.analyzeUserInteractionPatterns(userId);
      const businessOutcomes = await this.getBusinessOutcomesData(userId);
      const competitiveContext = await this.getIndustryBenchmarks(userId);

      const instructions = `You are an expert AI performance analyst and machine learning specialist with deep expertise in:
- Multi-agent system optimization and coordination
- Business process improvement and automation effectiveness
- User behavior analysis and personalization strategies
- Performance analytics and predictive modeling
- Continuous learning and adaptive system design

ADVANCED LEARNING MISSION:
Conduct sophisticated analysis of agent performance, user behavior, and business outcomes to generate actionable insights that will significantly improve system effectiveness and user satisfaction.

LEARNING FRAMEWORK:
1. PERFORMANCE PATTERN ANALYSIS
   - Identify success patterns and failure modes
   - Analyze correlation between agent configurations and outcomes
   - Detect performance degradation or improvement trends
   - Map user satisfaction to specific agent behaviors

2. USER BEHAVIOR INSIGHTS
   - Understand user preferences and communication styles
   - Identify workflow optimization opportunities
   - Recognize patterns in successful vs. unsuccessful interactions
   - Predict user needs based on historical patterns

3. BUSINESS IMPACT ASSESSMENT
   - Connect agent performance to business outcomes
   - Identify high-value optimization opportunities
   - Assess ROI potential of different improvements
   - Benchmark against industry standards

4. PREDICTIVE RECOMMENDATIONS
   - Forecast performance improvements from proposed changes
   - Identify potential risks or unintended consequences
   - Prioritize improvements by impact and feasibility
   - Generate implementation roadmaps

ANALYSIS DATA:
Agent Performance Metrics:
${JSON.stringify(performanceData, null, 2)}

User Interaction Patterns:
${JSON.stringify(userPatterns, null, 2)}

Business Context:
${JSON.stringify(businessOutcomes, null, 2)}

Industry Benchmarks:
${JSON.stringify(competitiveContext, null, 2)}

INSIGHT GENERATION REQUIREMENTS:
Generate 5-8 high-value learning insights that are:
1. Actionable - Can be implemented with specific steps
2. Measurable - Include expected improvement metrics
3. Prioritized - Focus on highest impact opportunities
4. Evidence-based - Supported by the performance data
5. User-centric - Consider user experience and satisfaction
6. Business-aligned - Connect to revenue and efficiency goals

For each insight, provide:
- Clear problem identification
- Root cause analysis
- Specific implementation steps
- Expected quantitative improvements
- Risk assessment and mitigation
- Success measurement criteria

Return as JSON array with this structure:
[
  {
    "agentName": "specific agent name",
    "insightType": "performance_improvement|user_preference|process_optimization|error_pattern",
    "title": "Clear, actionable title",
    "description": "Detailed analysis of the issue and opportunity",
    "actionable": true,
    "implementationSuggestion": "Specific steps to implement the improvement",
    "expectedImprovement": "Quantified expected improvement with metrics",
    "confidence": 85
  }
]

Focus on insights that will drive measurable business value and user satisfaction improvements.`;

      const insights = await realApiService.openai.generateText(instructions, 1000, 0.3);
      const parsedInsights: LearningInsight[] = JSON.parse(insights).map((insight: any) => ({
        ...insight,
        id: `insight-${Date.now()}-${Math.random()}`,
        createdAt: new Date()
      }));

      this.learningInsights.set(userId, parsedInsights);
      console.log(`✅ Generated ${parsedInsights.length} learning insights`);
      return parsedInsights;

    } catch (error) {
      console.error('❌ Failed to analyze agent performance:', error);
      return [];
    }
  }

  // Gather agent performance data
  private async gatherPerformanceData(userId: string): Promise<Record<string, AgentPerformanceData>> {
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

  // Get business outcomes data
  private async getBusinessOutcomesData(userId: string): Promise<any> {
    // This would fetch actual business metrics
    return {
      revenueImpact: Math.floor(Math.random() * 50000) + 10000,
      conversionRates: {
        leadToOpportunity: Math.floor(Math.random() * 20) + 15,
        opportunityToClose: Math.floor(Math.random() * 15) + 20
      },
      timeToClose: Math.floor(Math.random() * 30) + 45,
      customerSatisfaction: Math.floor(Math.random() * 10) + 85
    };
  }

  // Get industry benchmarks
  private async getIndustryBenchmarks(userId: string): Promise<any> {
    // This would fetch industry benchmark data
    return {
      averageResponseTime: 2400,
      industrySuccessRate: 78,
      competitorPerformance: {
        emailOpenRate: 22,
        callConnectRate: 35,
        meetingBookRate: 12
      }
    };
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
    executionTime: number,
    context?: any
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