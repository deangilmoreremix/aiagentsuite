import { supabaseService } from './supabaseClient';
import { realApiService } from './realApiService';

interface ConversationContext {
  id: string;
  userId: string;
  sessionId: string;
  messages: ConversationMessage[];
  crmContext: CRMContext;
  userProfile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
  actions?: string[];
  crmEntities?: CRMEntity[];
  embedding?: number[];
}

interface CRMContext {
  recentContacts: any[];
  activeDealId?: string;
  lastActivity?: any;
  userIntent?: string;
  businessContext: string;
}

interface UserProfile {
  industry?: string;
  teamSize?: string;
  primaryGoals: string[];
  preferredCommunication: 'text' | 'voice' | 'both';
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced';
  workingHours?: { start: string; end: string; timezone: string };
}

interface CRMEntity {
  type: 'contact' | 'deal' | 'activity' | 'task';
  id: string;
  name: string;
  relevanceScore: number;
}

export class ContextualMemoryService {
  private static instance: ContextualMemoryService;
  private currentContext: ConversationContext | null = null;
  private embeddings: Map<string, number[]> = new Map();

  static getInstance(): ContextualMemoryService {
    if (!ContextualMemoryService.instance) {
      ContextualMemoryService.instance = new ContextualMemoryService();
    }
    return ContextualMemoryService.instance;
  }

  // Initialize or load conversation context
  async initializeContext(userId: string, sessionId?: string): Promise<ConversationContext> {
    try {
      // Try to load existing context
      if (sessionId) {
        const existingContext = await this.loadContext(userId, sessionId);
        if (existingContext) {
          this.currentContext = existingContext;
          return existingContext;
        }
      }

      // Create new context
      const newContext: ConversationContext = {
        id: sessionId || `session-${Date.now()}`,
        userId,
        sessionId: sessionId || `session-${Date.now()}`,
        messages: [],
        crmContext: {
          recentContacts: [],
          businessContext: 'Initial session started'
        },
        userProfile: await this.loadUserProfile(userId),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.currentContext = newContext;
      await this.saveContext(newContext);
      return newContext;
    } catch (error) {
      console.error('Failed to initialize context:', error);
      throw error;
    }
  }

  // Add message to conversation with context enrichment
  async addMessage(
    type: 'user' | 'ai' | 'system',
    content: string,
    agentName?: string,
    actions?: string[]
  ): Promise<ConversationMessage> {
    if (!this.currentContext) {
      throw new Error('Context not initialized');
    }

    try {
      // Generate embedding for semantic search
      let embedding: number[] | undefined;
      if (type === 'user' && realApiService.openai) {
        try {
          embedding = await this.generateEmbedding(content);
        } catch (error) {
          console.warn('Failed to generate embedding:', error);
        }
      }

      // Extract CRM entities mentioned in the message
      const crmEntities = await this.extractCRMEntities(content);

      const message: ConversationMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        type,
        content,
        timestamp: new Date(),
        agentName,
        actions,
        crmEntities,
        embedding
      };

      this.currentContext.messages.push(message);
      this.currentContext.updatedAt = new Date();

      // Update CRM context based on new message
      if (type === 'user') {
        await this.updateCRMContext(content);
      }

      // Save updated context
      await this.saveContext(this.currentContext);

      return message;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  // Get contextual summary for AI agents
  async getContextualSummary(
    maxContextLength: number = 8000,
    includeDetailedCRM: boolean = true,
    prioritizeRecentInteractions: boolean = true
  ): Promise<{ summary: string; lastResponseId?: string }> {
    if (!this.currentContext || this.currentContext.messages.length === 0) {
      return { summary: 'No previous conversation context.' };
    }

    try {
      // Enhanced context selection for GPT-5's larger context window
      const contextWindow = Math.min(this.currentContext.messages.length, 25); // Increased from 10 to 25
      const recentMessages = prioritizeRecentInteractions 
        ? this.currentContext.messages.slice(-contextWindow)
        : this.getBalancedMessageContext(contextWindow);
        
      const crmContext = this.currentContext.crmContext;
      
      // Enhanced CRM context for better agent coordination
      const enhancedCRMContext = includeDetailedCRM 
        ? await this.buildEnhancedCRMContext()
        : crmContext;
      
      const conversationInput = `CONVERSATION HISTORY:
${recentMessages.map(msg => `${msg.timestamp.toLocaleTimeString()} | ${msg.type.toUpperCase()}${msg.agentName ? ` (${msg.agentName})` : ''}: ${msg.content}`).join('\n')}

USER PROFILE & PREFERENCES:
${JSON.stringify(this.currentContext.userProfile, null, 2)}

CRM CONTEXT & BUSINESS DATA:
${JSON.stringify(enhancedCRMContext, null, 2)}

CONVERSATION ANALYTICS:
- Total Messages: ${this.currentContext.messages.length}
- User Messages: ${this.currentContext.messages.filter(m => m.type === 'user').length}
- AI Responses: ${this.currentContext.messages.filter(m => m.type === 'ai').length}
- Session Duration: ${this.getSessionDuration()}
- Key Topics Discussed: ${this.extractKeyTopics(recentMessages)}
- Last User Intent: ${this.inferCurrentUserIntent(recentMessages)}`;
      
      const instructions = `You are an expert conversation analyst providing contextual intelligence to AI agents.

ANALYSIS OBJECTIVES:
1. Identify the user's current goals and intentions
2. Understand their business context and challenges
3. Recognize patterns in their communication style and preferences
4. Extract actionable insights for agent coordination
5. Highlight important CRM entities and relationships
6. Assess conversation momentum and engagement level

SUMMARIZATION REQUIREMENTS:
Create a comprehensive yet concise summary that enables other AI agents to:
- Understand exactly what the user is trying to accomplish
- Recognize their communication style and emotional state  
- Access relevant CRM data and business context
- Make informed decisions about next best actions
- Provide personalized and contextually appropriate responses

RESPONSE FORMAT:
Structure your summary with these key sections:
1. CURRENT OBJECTIVE: What the user is focused on right now
2. BUSINESS CONTEXT: Industry, company situation, and relevant background
3. CONVERSATION TONE: Communication style, emotional state, and preferences
4. CRM INSIGHTS: Relevant contacts, deals, and business data
5. NEXT LIKELY ACTIONS: What the user will probably want to do next
6. AGENT COORDINATION NOTES: Important context for multi-agent workflows

Keep the summary comprehensive but under 500 words, focusing on actionable insights.`;
      
      const response = await realApiService.openai.generateAIResponse(
        instructions,
        conversationInput,
        {
          taskType: 'analytical',
          complexity: 'intermediate',
          temperature: 0.2,
          maxTokens: 600,
          previousResponseId: crmContext.lastResponseId,
          store: true
        }
      );
      
      return {
        summary: response.output_text || 'Enhanced context analysis unavailable.',
        lastResponseId: response.id
      };
    } catch (error) {
      console.error('Failed to generate enhanced contextual summary:', error);
      return { summary: 'Error generating enhanced context summary.' };
    }
  }

  // Enhanced context selection for better agent coordination
  private getBalancedMessageContext(limit: number): ConversationMessage[] {
    if (!this.currentContext) return [];
    
    const messages = this.currentContext.messages;
    const recent = Math.ceil(limit * 0.6); // 60% recent messages
    const important = Math.floor(limit * 0.4); // 40% important historical messages
    
    // Get recent messages
    const recentMessages = messages.slice(-recent);
    
    // Get important historical messages (those with high action content)
    const historicalMessages = messages
      .slice(0, -recent)
      .filter(msg => 
        msg.actions && msg.actions.length > 0 || 
        msg.content.toLowerCase().includes('create') ||
        msg.content.toLowerCase().includes('schedule') ||
        msg.content.toLowerCase().includes('send')
      )
      .slice(-important);
    
    return [...historicalMessages, ...recentMessages];
  }

  // Build enhanced CRM context for GPT-5
  private async buildEnhancedCRMContext(): Promise<any> {
    if (!this.currentContext) return {};
    
    try {
      // Get fresh CRM data if available
      if (supabaseService.isAvailable()) {
        const [contacts, deals] = await Promise.all([
          supabaseService.getContacts().catch(() => []),
          supabaseService.getDeals().catch(() => [])
        ]);
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return {
          ...this.currentContext.crmContext,
          freshCRMData: {
            contacts: {
              total: contacts.length,
              recent: contacts.filter(c => new Date(c.created_at || '') > weekAgo).length,
              needsAttention: contacts.filter(c => !c.last_contacted || new Date(c.last_contacted) < weekAgo).length,
              highPriority: contacts.filter(c => c.lead_score && c.lead_score >= 80).length
            },
            deals: {
              total: deals.length,
              open: deals.filter(d => d.status === 'open').length,
              closingThisWeek: deals.filter(d => {
                if (!d.expected_close_date) return false;
                const closeDate = new Date(d.expected_close_date);
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return closeDate <= weekFromNow && closeDate >= now;
              }).length,
              totalValue: deals.reduce((sum, d) => sum + (d.value || 0), 0)
            }
          }
        };
      }
      
      return this.currentContext.crmContext;
    } catch (error) {
      console.error('Failed to build enhanced CRM context:', error);
      return this.currentContext.crmContext;
    }
  }

  // Extract key topics using GPT-5's improved understanding
  private extractKeyTopics(messages: ConversationMessage[]): string {
    const topics = new Set<string>();
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      if (content.includes('lead') || content.includes('prospect')) topics.add('lead management');
      if (content.includes('deal') || content.includes('sale')) topics.add('deal management');
      if (content.includes('email') || content.includes('campaign')) topics.add('email marketing');
      if (content.includes('meeting') || content.includes('calendar')) topics.add('scheduling');
      if (content.includes('follow') && content.includes('up')) topics.add('follow-up');
      if (content.includes('report') || content.includes('analyt')) topics.add('analytics');
    });
    
    return Array.from(topics).join(', ') || 'general CRM usage';
  }

  // Infer current user intent with enhanced analysis
  private inferCurrentUserIntent(messages: ConversationMessage[]): string {
    const lastUserMessage = messages.filter(m => m.type === 'user').pop();
    if (!lastUserMessage) return 'unknown';
    
    const content = lastUserMessage.content.toLowerCase();
    
    if (content.includes('create') || content.includes('add')) return 'creation';
    if (content.includes('schedule') || content.includes('book')) return 'scheduling';
    if (content.includes('send') || content.includes('email')) return 'communication';
    if (content.includes('analyze') || content.includes('report')) return 'analysis';
    if (content.includes('update') || content.includes('change')) return 'modification';
    if (content.includes('find') || content.includes('search')) return 'search';
    
    return 'exploration';
  }

  // Calculate session duration
  private getSessionDuration(): string {
    if (!this.currentContext || this.currentContext.messages.length === 0) return '0 minutes';
    
    const start = this.currentContext.messages[0].timestamp;
    const end = this.currentContext.messages[this.currentContext.messages.length - 1].timestamp;
    const durationMs = end.getTime() - start.getTime();
    const durationMin = Math.round(durationMs / 60000);
    
    return `${durationMin} minutes`;
  }

  // Search conversation history semantically
  async searchConversationHistory(query: string, limit: number = 5): Promise<ConversationMessage[]> {
    if (!this.currentContext) return [];

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) return [];

      // Calculate similarity scores with stored embeddings
      const messagesWithScores = this.currentContext.messages
        .filter(msg => msg.embedding)
        .map(msg => ({
          message: msg,
          similarity: this.calculateCosineSimilarity(queryEmbedding, msg.embedding!)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return messagesWithScores.map(item => item.message);
    } catch (error) {
      console.error('Failed to search conversation history:', error);
      return [];
    }
  }

  // Generate proactive suggestions based on context
  async generateProactiveSuggestions(): Promise<string[]> {
    if (!this.currentContext) return [];

    try {
      const contextSummary = await this.getContextualSummary();
      
      const suggestionPrompt = `
        Based on this conversation and CRM context, generate 3-5 proactive suggestions for what the user might want to do next:
        
        Context: ${contextSummary}
        
        Suggestions should be:
        1. Specific and actionable
        2. Relevant to current conversation
        3. Focused on CRM/sales activities
        4. Written as natural commands the user could say
        
        Examples:
        - "Schedule a follow-up call with John for next week"
        - "Send a proposal to TechCorp based on our discussion"
        - "Create a task to research competitor pricing"
        
        Return only the suggestion text, one per line.
      `;

      const suggestions = await realApiService.openai.generateText(suggestionPrompt, 300, 0.7);
      return suggestions.split('\n').filter(s => s.trim().length > 0).slice(0, 5);
    } catch (error) {
      console.error('Failed to generate proactive suggestions:', error);
      return [];
    }
  }

  // Private helper methods
  private async generateEmbedding(text: string): Promise<number[] | undefined> {
    try {
      // This would use OpenAI's embedding API if available
      // For now, return undefined to indicate embedding generation is not available
      return undefined;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      return undefined;
    }
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async extractCRMEntities(content: string): Promise<CRMEntity[]> {
    try {
      const extractionPrompt = `
        Extract CRM entities from this text: "${content}"
        
        Look for:
        - Contact names (people)
        - Company names
        - Deal references
        - Activity mentions
        
        Return JSON array with format:
        [{"type": "contact", "name": "John Smith", "relevanceScore": 0.9}]
      `;

      const extraction = await realApiService.openai.generateText(extractionPrompt, 200, 0.1);
      return JSON.parse(extraction);
    } catch (error) {
      console.warn('Failed to extract CRM entities:', error);
      return [];
    }
  }

  private async updateCRMContext(userMessage: string): Promise<void> {
    if (!this.currentContext) return;

    try {
      // Update CRM context based on user message
      const contextUpdatePrompt = `
        Update CRM context based on this user message: "${userMessage}"
        
        Current context: ${JSON.stringify(this.currentContext.crmContext, null, 2)}
        
        Determine:
        1. User's current intent/goal
        2. Relevant business context
        3. Any CRM entities that should be highlighted
        
        Return updated context as JSON.
      `;

      const updatedContext = await realApiService.openai.generateText(contextUpdatePrompt, 300, 0.2);
      const parsed = JSON.parse(updatedContext);
      
      this.currentContext.crmContext = {
        ...this.currentContext.crmContext,
        ...parsed,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Failed to update CRM context:', error);
    }
  }

  private async loadUserProfile(userId: string): Promise<UserProfile> {
    // Load from Supabase or return default
    return {
      primaryGoals: [],
      preferredCommunication: 'both',
      expertiseLevel: 'intermediate'
    };
  }

  private async loadContext(userId: string, sessionId: string): Promise<ConversationContext | null> {
    // Implementation would load from Supabase
    return null;
  }

  private async saveContext(context: ConversationContext): Promise<void> {
    // Implementation would save to Supabase
    console.log('Context saved:', context.id);
  }

  // Get current context
  getCurrentContext(): ConversationContext | null {
    return this.currentContext;
  }

  // Clear context (for new sessions)
  clearContext(): void {
    this.currentContext = null;
  }
}

export const contextualMemoryService = ContextualMemoryService.getInstance();