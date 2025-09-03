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
  async getContextualSummary(): Promise<{ summary: string; lastResponseId?: string }> {
    if (!this.currentContext || this.currentContext.messages.length === 0) {
      return { summary: 'No previous conversation context.' };
    }

    try {
      const recentMessages = this.currentContext.messages.slice(-10);
      const crmContext = this.currentContext.crmContext;
      
      // Build conversation input for new API
      const conversationInput = `
        Summarize this conversation context for an AI agent:
        
        User Profile: ${JSON.stringify(this.currentContext.userProfile, null, 2)}
        
        Recent Conversation:
        ${recentMessages.map(msg => `${msg.type}: ${msg.content}`).join('\n')}
        
        CRM Context:
        ${JSON.stringify(crmContext, null, 2)}
      `;
      
      const instructions = `
        Provide a concise summary that helps an AI agent understand:
        1. What the user is trying to accomplish
        2. Key CRM entities involved
        3. Current conversation state
        4. Relevant business context
        
        Keep it under 300 words and focus on actionable insights.
      `;

      const response = await realApiService.openai.generateAIResponse(
        instructions,
        conversationInput,
        {
          maxTokens: 300,
          temperature: 0.3,
          previousResponseId: crmContext.lastResponseId,
          store: true
        }
      );
      
      return {
        summary: response.output_text || 'No summary available.',
        lastResponseId: response.id
      };
    } catch (error) {
      console.error('Failed to generate contextual summary:', error);
      return { summary: 'Error generating context summary.' };
    }
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