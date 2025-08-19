import { realApiService } from './realApiService';
import { contextualMemoryService } from './contextualMemoryService';
import { allGoals, goalCategories } from '../data/goalsData';
import { Goal } from '../types/goals';

interface PersonalizedRecommendation {
  goal: Goal;
  relevanceScore: number;
  reasoning: string;
  expectedImpact: string;
  setupPriority: number;
  personalizedDescription: string;
  estimatedROI: number;
  timeToValue: string;
  prerequisites?: string[];
  customizationSuggestions: string[];
}

interface UserBusinessProfile {
  industry?: string;
  companySize?: string;
  salesProcess?: string;
  currentChallenges: string[];
  technicalSkill: 'beginner' | 'intermediate' | 'advanced';
  priorities: string[];
  crmUsage: any;
  goalHistory: string[];
}

export class PersonalizedGoalService {
  private static instance: PersonalizedGoalService;
  private recommendationCache: Map<string, PersonalizedRecommendation[]> = new Map();
  private userProfiles: Map<string, UserBusinessProfile> = new Map();

  static getInstance(): PersonalizedGoalService {
    if (!PersonalizedGoalService.instance) {
      PersonalizedGoalService.instance = new PersonalizedGoalService();
    }
    return PersonalizedGoalService.instance;
  }

  // Generate personalized goal recommendations using GPT-5
  async generatePersonalizedRecommendations(
    userId: string,
    refreshCache: boolean = false
  ): Promise<PersonalizedRecommendation[]> {
    // Check cache first
    if (!refreshCache && this.recommendationCache.has(userId)) {
      return this.recommendationCache.get(userId)!;
    }

    try {
      console.log('🎯 Generating personalized goal recommendations with GPT-5...');

      const userProfile = await this.buildUserProfile(userId);
      const contextSummary = await contextualMemoryService.getContextualSummary();
      const crmAnalysis = await this.analyzeCRMForGoalFit(userId);

      const recommendationPrompt = `
        You are an expert business consultant specializing in sales automation and CRM optimization.
        
        User Profile: ${JSON.stringify(userProfile, null, 2)}
        
        Current Context: ${contextSummary}
        
        CRM Analysis: ${JSON.stringify(crmAnalysis, null, 2)}
        
        Available Goals: ${JSON.stringify(allGoals.slice(0, 20).map(g => ({
          id: g.id,
          title: g.title,
          category: g.category,
          description: g.description,
          businessImpact: g.businessImpact,
          complexity: g.complexity,
          priority: g.priority,
          roi: g.roi
        })), null, 2)}
        
        Analyze this user's situation and recommend the top 8 most relevant goals. For each recommendation, provide:
        
        1. Relevance score (0-100) based on user needs
        2. Detailed reasoning for why this goal fits
        3. Expected impact specific to their situation
        4. Setup priority (1-10, where 1 = do first)
        5. Personalized description tailored to their context
        6. Estimated ROI in dollars
        7. Time to see value
        8. Any prerequisites they should complete first
        9. Customization suggestions for their specific use case
        
        Consider:
        - User's technical skill level
        - Current CRM state and data quality
        - Business priorities and challenges
        - Industry-specific best practices
        - Progressive complexity (start simple, build up)
        
        Return as JSON array with this structure:
        [
          {
            "goalId": "goal-id-from-available-goals",
            "relevanceScore": 95,
            "reasoning": "Based on your TechCorp industry focus and need for lead generation...",
            "expectedImpact": "Should generate 50+ qualified SaaS leads per week",
            "setupPriority": 1,
            "personalizedDescription": "Customized description for this user",
            "estimatedROI": 25000,
            "timeToValue": "2 weeks",
            "prerequisites": ["Clean up existing contact data"],
            "customizationSuggestions": ["Focus on enterprise SaaS prospects", "Use technical messaging"]
          }
        ]
      `;

      const recommendations = await realApiService.openai.generateText(recommendationPrompt, 2000, 0.3);
      const parsedRecommendations = JSON.parse(recommendations);

      // Map to full recommendation objects
      const fullRecommendations: PersonalizedRecommendation[] = parsedRecommendations
        .map((rec: any) => {
          const goal = allGoals.find(g => g.id === rec.goalId);
          if (!goal) return null;

          return {
            goal,
            relevanceScore: rec.relevanceScore,
            reasoning: rec.reasoning,
            expectedImpact: rec.expectedImpact,
            setupPriority: rec.setupPriority,
            personalizedDescription: rec.personalizedDescription,
            estimatedROI: rec.estimatedROI,
            timeToValue: rec.timeToValue,
            prerequisites: rec.prerequisites || [],
            customizationSuggestions: rec.customizationSuggestions || []
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Cache recommendations
      this.recommendationCache.set(userId, fullRecommendations);
      
      console.log(`✅ Generated ${fullRecommendations.length} personalized recommendations`);
      return fullRecommendations;

    } catch (error) {
      console.error('❌ Failed to generate personalized recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }

  // Build comprehensive user profile for personalization
  private async buildUserProfile(userId: string): Promise<UserBusinessProfile> {
    // Check cache first
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    try {
      const context = contextualMemoryService.getCurrentContext();
      const conversationHistory = context?.messages.slice(-20) || [];
      
      const profilePrompt = `
        Analyze this user's conversation history and build a business profile:
        
        Conversation History:
        ${conversationHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n')}
        
        CRM Context: ${JSON.stringify(context?.crmContext, null, 2)}
        
        Infer the following about this user:
        1. Industry/business type
        2. Company size (startup, SMB, enterprise)
        3. Current sales process maturity
        4. Main business challenges
        5. Technical skill level
        6. Primary business priorities
        
        Return as JSON:
        {
          "industry": "technology/healthcare/finance/etc",
          "companySize": "startup/smb/enterprise",
          "salesProcess": "basic/intermediate/advanced",
          "currentChallenges": ["challenge1", "challenge2"],
          "technicalSkill": "beginner/intermediate/advanced",
          "priorities": ["priority1", "priority2"],
          "crmUsage": {
            "dataQuality": "poor/good/excellent",
            "automationLevel": "none/basic/advanced",
            "teamSize": "1-5/6-20/20+"
          }
        }
      `;

      const profile = await realApiService.openai.generateText(profilePrompt, 500, 0.4);
      const parsedProfile: UserBusinessProfile = {
        ...JSON.parse(profile),
        goalHistory: [] // Will be populated from actual goal execution history
      };

      this.userProfiles.set(userId, parsedProfile);
      return parsedProfile;

    } catch (error) {
      console.error('Failed to build user profile:', error);
      return this.getDefaultProfile();
    }
  }

  // Analyze CRM data to determine goal fit
  private async analyzeCRMForGoalFit(userId: string): Promise<any> {
    try {
      if (!supabaseService.isAvailable()) {
        return this.getMockCRMAnalysis();
      }

      const [contacts, deals] = await Promise.all([
        supabaseService.getContacts(userId),
        supabaseService.getDeals(userId)
      ]);

      return {
        contactsCount: contacts.length,
        dataQuality: this.assessDataQuality(contacts),
        dealsPipeline: {
          total: deals.length,
          averageValue: deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length,
          staleDeals: deals.filter(d => {
            const updated = new Date(d.updated_at || d.created_at);
            return (Date.now() - updated.getTime()) > 14 * 24 * 60 * 60 * 1000;
          }).length
        },
        activityLevel: {
          lastWeekContacts: contacts.filter(c => {
            const lastContact = new Date(c.last_contacted || c.created_at);
            return (Date.now() - lastContact.getTime()) < 7 * 24 * 60 * 60 * 1000;
          }).length
        },
        gaps: this.identifyProcessGaps(contacts, deals)
      };
    } catch (error) {
      console.error('Failed to analyze CRM for goal fit:', error);
      return this.getMockCRMAnalysis();
    }
  }

  // Assess data quality for goal recommendations
  private assessDataQuality(contacts: any[]): string {
    if (contacts.length === 0) return 'empty';
    
    const withEmail = contacts.filter(c => c.email).length;
    const withPhone = contacts.filter(c => c.phone).length;
    const withCompany = contacts.filter(c => c.company).length;
    
    const completeness = (withEmail + withPhone + withCompany) / (contacts.length * 3);
    
    if (completeness > 0.8) return 'excellent';
    if (completeness > 0.6) return 'good';
    if (completeness > 0.4) return 'fair';
    return 'poor';
  }

  // Identify gaps in current sales process
  private identifyProcessGaps(contacts: any[], deals: any[]): string[] {
    const gaps = [];
    
    if (contacts.length > 0 && deals.length === 0) {
      gaps.push('no_deal_conversion');
    }
    
    if (contacts.filter(c => c.lead_score).length < contacts.length * 0.3) {
      gaps.push('missing_lead_scoring');
    }
    
    if (contacts.filter(c => c.last_contacted).length < contacts.length * 0.5) {
      gaps.push('poor_follow_up_tracking');
    }
    
    return gaps;
  }

  // Get goal recommendations with dynamic learning
  async getSmartGoalSuggestions(
    userId: string,
    currentGoals: string[] = [],
    userIntent?: string
  ): Promise<PersonalizedRecommendation[]> {
    try {
      const allRecommendations = await this.generatePersonalizedRecommendations(userId);
      
      // Filter out already selected goals
      const availableRecommendations = allRecommendations.filter(
        rec => !currentGoals.includes(rec.goal.id)
      );

      // If user has specific intent, filter by relevance
      if (userIntent) {
        const intentFilterPrompt = `
          User intent: "${userIntent}"
          
          Filter these recommendations to only include those relevant to the user's current intent:
          ${JSON.stringify(availableRecommendations.map(r => ({
            id: r.goal.id,
            title: r.goal.title,
            description: r.goal.description
          })), null, 2)}
          
          Return array of goal IDs that match the intent.
        `;

        try {
          const filteredIds = await realApiService.openai.generateText(intentFilterPrompt, 200, 0.2);
          const relevantIds = JSON.parse(filteredIds);
          
          return availableRecommendations.filter(rec => 
            relevantIds.includes(rec.goal.id)
          );
        } catch (error) {
          console.warn('Failed to filter by intent, returning all recommendations');
        }
      }

      return availableRecommendations.slice(0, 6);
    } catch (error) {
      console.error('Failed to get smart goal suggestions:', error);
      return [];
    }
  }

  // Learn from user goal selections to improve future recommendations
  async learnFromGoalSelection(userId: string, selectedGoalId: string, context?: string): Promise<void> {
    try {
      const profile = this.userProfiles.get(userId) || this.getDefaultProfile();
      profile.goalHistory.push(selectedGoalId);
      
      // Update user preferences based on selection
      const selectedGoal = allGoals.find(g => g.id === selectedGoalId);
      if (selectedGoal) {
        if (!profile.priorities.includes(selectedGoal.category)) {
          profile.priorities.push(selectedGoal.category);
        }
      }

      this.userProfiles.set(userId, profile);
      
      // Invalidate recommendation cache to trigger fresh analysis
      this.recommendationCache.delete(userId);
      
      console.log(`📚 Learned from goal selection: ${selectedGoalId}`);
    } catch (error) {
      console.error('Failed to learn from goal selection:', error);
    }
  }

  // Get contextual goal explanations
  async getContextualGoalExplanation(goal: Goal, userId: string): Promise<string> {
    try {
      const userProfile = this.userProfiles.get(userId) || this.getDefaultProfile();
      const contextSummary = await contextualMemoryService.getContextualSummary();

      const explanationPrompt = `
        Explain this goal in the context of this specific user's situation:
        
        Goal: ${goal.title}
        Description: ${goal.description}
        Business Impact: ${goal.businessImpact}
        
        User Profile: ${JSON.stringify(userProfile, null, 2)}
        Current Context: ${contextSummary}
        
        Provide a personalized explanation that:
        1. Shows how this goal specifically helps their business
        2. Mentions relevant aspects of their current situation
        3. Explains the value in their industry/context
        4. Suggests specific customizations for their needs
        
        Keep it conversational and focused on their specific benefits.
        Maximum 150 words.
      `;

      const explanation = await realApiService.openai.generateText(explanationPrompt, 200, 0.5);
      return explanation;
    } catch (error) {
      console.error('Failed to generate contextual explanation:', error);
      return goal.description;
    }
  }

  // Suggest goal combinations that work well together
  async suggestGoalCombinations(
    userId: string,
    selectedGoals: string[]
  ): Promise<{ goals: Goal[]; synergy: string; estimatedImpact: string }[]> {
    try {
      const userProfile = this.userProfiles.get(userId) || this.getDefaultProfile();
      
      const combinationPrompt = `
        User has selected these goals: ${selectedGoals.map(id => 
          allGoals.find(g => g.id === id)?.title
        ).join(', ')}
        
        User Profile: ${JSON.stringify(userProfile, null, 2)}
        
        Available Goals: ${JSON.stringify(allGoals.map(g => ({
          id: g.id,
          title: g.title,
          category: g.category,
          businessImpact: g.businessImpact
        })), null, 2)}
        
        Suggest 3 combinations of 2-3 additional goals that would:
        1. Create powerful synergies with selected goals
        2. Build upon each other logically
        3. Maximize business impact for this user
        
        Return JSON array:
        [
          {
            "goalIds": ["goal-id-1", "goal-id-2"],
            "synergy": "explanation of how these work together",
            "estimatedImpact": "combined business impact description"
          }
        ]
      `;

      const combinations = await realApiService.openai.generateText(combinationPrompt, 800, 0.4);
      const parsed = JSON.parse(combinations);

      return parsed.map((combo: any) => ({
        goals: combo.goalIds.map((id: string) => allGoals.find(g => g.id === id)).filter(Boolean),
        synergy: combo.synergy,
        estimatedImpact: combo.estimatedImpact
      }));
    } catch (error) {
      console.error('Failed to suggest goal combinations:', error);
      return [];
    }
  }

  // Dynamic goal prioritization based on user context
  async prioritizeGoalsForUser(userId: string, availableGoals: Goal[]): Promise<Goal[]> {
    try {
      const userProfile = this.userProfiles.get(userId) || this.getDefaultProfile();
      const contextSummary = await contextualMemoryService.getContextualSummary();

      const prioritizationPrompt = `
        Prioritize these goals for this specific user:
        
        User Profile: ${JSON.stringify(userProfile, null, 2)}
        Current Context: ${contextSummary}
        
        Available Goals: ${JSON.stringify(availableGoals.map(g => ({
          id: g.id,
          title: g.title,
          category: g.category,
          priority: g.priority,
          complexity: g.complexity,
          businessImpact: g.businessImpact,
          roi: g.roi
        })), null, 2)}
        
        Rank these goals by priority for this user considering:
        1. Their current business needs
        2. Technical skill level and complexity preference
        3. Industry best practices
        4. Logical progression (simple to advanced)
        5. Maximum business impact potential
        
        Return array of goal IDs in priority order (highest priority first).
      `;

      const prioritizedIds = await realApiService.openai.generateText(prioritizationPrompt, 300, 0.2);
      const parsedIds = JSON.parse(prioritizedIds);

      // Return goals in prioritized order
      return parsedIds
        .map((id: string) => availableGoals.find(g => g.id === id))
        .filter(Boolean);
    } catch (error) {
      console.error('Failed to prioritize goals:', error);
      return availableGoals; // Return original order as fallback
    }
  }

  // Get industry-specific insights
  async getIndustryInsights(userId: string): Promise<string[]> {
    try {
      const userProfile = this.userProfiles.get(userId) || this.getDefaultProfile();
      
      if (!userProfile.industry) {
        return [];
      }

      const insightPrompt = `
        Generate 3-4 industry-specific insights for ${userProfile.industry} companies using CRM automation:
        
        Focus on:
        1. Common automation opportunities in ${userProfile.industry}
        2. Industry-specific best practices
        3. Typical ROI expectations
        4. Success patterns from similar companies
        
        Make insights actionable and specific to ${userProfile.industry}.
        Return as simple text array.
      `;

      const insights = await realApiService.openai.generateText(insightPrompt, 400, 0.5);
      return insights.split('\n').filter(i => i.trim().length > 0);
    } catch (error) {
      console.error('Failed to get industry insights:', error);
      return [];
    }
  }

  // Update user profile based on behavior
  updateUserProfile(userId: string, updates: Partial<UserBusinessProfile>): void {
    const currentProfile = this.userProfiles.get(userId) || this.getDefaultProfile();
    const updatedProfile = { ...currentProfile, ...updates };
    this.userProfiles.set(userId, updatedProfile);
    
    // Invalidate recommendation cache
    this.recommendationCache.delete(userId);
  }

  // Helper methods
  private getDefaultProfile(): UserBusinessProfile {
    return {
      currentChallenges: [],
      technicalSkill: 'intermediate',
      priorities: [],
      crmUsage: {},
      goalHistory: []
    };
  }

  private getFallbackRecommendations(): PersonalizedRecommendation[] {
    return allGoals.filter(g => g.priority === 'High').slice(0, 5).map(goal => ({
      goal,
      relevanceScore: 75,
      reasoning: 'High-priority goal with proven business impact',
      expectedImpact: goal.businessImpact,
      setupPriority: 5,
      personalizedDescription: goal.description,
      estimatedROI: 10000,
      timeToValue: '2-3 weeks',
      customizationSuggestions: []
    }));
  }

  private getMockCRMAnalysis(): any {
    return {
      contactsCount: 150,
      dataQuality: 'good',
      dealsPipeline: {
        total: 25,
        averageValue: 15000,
        staleDeals: 5
      },
      activityLevel: {
        lastWeekContacts: 12
      },
      gaps: ['missing_lead_scoring', 'poor_follow_up_tracking']
    };
  }

  // Clear caches
  clearCache(userId?: string): void {
    if (userId) {
      this.recommendationCache.delete(userId);
    } else {
      this.recommendationCache.clear();
    }
  }
}

export const personalizedGoalService = PersonalizedGoalService.getInstance();