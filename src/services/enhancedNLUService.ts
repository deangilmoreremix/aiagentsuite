import { realApiService } from './realApiService';
import { contextualMemoryService } from './contextualMemoryService';
import { supabaseService } from './supabaseClient';

interface ParsedCommand {
  intent: string;
  entities: Entity[];
  confidence: number;
  actionType: 'crm_action' | 'query' | 'task_creation' | 'navigation' | 'complex_workflow';
  parameters: Record<string, any>;
  requiredAgents: string[];
  suggestedTools: string[];
  ambiguities: string[];
  clarificationQuestions: string[];
}

interface Entity {
  type: 'person' | 'company' | 'date' | 'email' | 'phone' | 'amount' | 'product' | 'location';
  value: string;
  confidence: number;
  normalizedValue?: string;
  crmReference?: { type: string; id: string };
}

interface CommandContext {
  previousCommands: string[];
  crmEntities: any[];
  userPreferences: any;
  businessContext: string;
  currentFocus?: string;
}

export class EnhancedNLUService {
  private static instance: EnhancedNLUService;
  private commandHistory: string[] = [];
  private entityCache: Map<string, Entity[]> = new Map();

  static getInstance(): EnhancedNLUService {
    if (!EnhancedNLUService.instance) {
      EnhancedNLUService.instance = new EnhancedNLUService();
    }
    return EnhancedNLUService.instance;
  }

  // Enhanced command parsing with GPT-5
  async parseCommand(
    userInput: string, 
    includeContext: boolean = true
  ): Promise<ParsedCommand> {
    try {
      console.log('🧠 Parsing command with enhanced NLU...');

      const context = includeContext ? await this.buildCommandContext() : null;
      
      const parsePrompt = `
        You are an advanced natural language understanding system for a CRM platform. Parse this user command with deep understanding:
        
        User Command: "${userInput}"
        
        ${context ? `
        Context:
        ${JSON.stringify(context, null, 2)}
        ` : ''}
        
        Available CRM Actions:
        - create_contact, update_contact, search_contacts
        - create_deal, update_deal, move_deal_stage
        - schedule_meeting, send_email, make_call
        - create_task, assign_task, complete_task
        - generate_report, analyze_performance
        - execute_workflow, trigger_automation
        
        Available AI Agents:
        - AI SDR Agent, AI AE Agent, Lead Scoring Agent
        - Email Agent, Voice Agent, Calendar Agent
        - Follow-up Agent, Objection Handler Agent
        - Timeline Logger Agent, Content Generator Agent
        
        Parse the command and return JSON with this exact structure:
        {
          "intent": "primary intent in simple terms",
          "entities": [
            {
              "type": "person|company|date|email|phone|amount|product|location",
              "value": "extracted value",
              "confidence": 0-100,
              "normalizedValue": "standardized format if applicable"
            }
          ],
          "confidence": 0-100,
          "actionType": "crm_action|query|task_creation|navigation|complex_workflow",
          "parameters": {
            "primaryAction": "main action to take",
            "targetEntity": "what to act on",
            "additionalParams": {}
          },
          "requiredAgents": ["list of agents needed"],
          "suggestedTools": ["list of tools/integrations needed"],
          "ambiguities": ["unclear aspects that need clarification"],
          "clarificationQuestions": ["specific questions to ask user"]
        }
        
        Handle complex commands like:
        - "Send follow-up emails to everyone who downloaded the whitepaper but hasn't scheduled a demo"
        - "Find all TechCorp contacts and create a custom nurture sequence"
        - "Analyze my pipeline and tell me which deals are most likely to close this month"
        
        Be thorough in entity extraction and provide specific clarification questions if the command is ambiguous.
      `;

      const parseResult = await realApiService.openai.generateText(parsePrompt, 1200, 0.2);
      const parsedCommand: ParsedCommand = JSON.parse(parseResult);

      // Enhance with CRM entity resolution
      parsedCommand.entities = await this.resolveCRMEntities(parsedCommand.entities);
      
      // Cache entities for future reference
      this.entityCache.set(userInput.toLowerCase(), parsedCommand.entities);
      
      // Add to command history
      this.commandHistory.push(userInput);
      if (this.commandHistory.length > 20) {
        this.commandHistory = this.commandHistory.slice(-20);
      }

      console.log('✅ Command parsed successfully');
      return parsedCommand;

    } catch (error) {
      console.error('❌ Enhanced NLU parsing failed:', error);
      
      // Fallback to basic parsing
      return this.basicCommandParse(userInput);
    }
  }

  // Resolve entities against actual CRM data
  private async resolveCRMEntities(entities: Entity[]): Promise<Entity[]> {
    try {
      const resolvedEntities = [...entities];

      for (const entity of resolvedEntities) {
        if (entity.type === 'person' && supabaseService.isAvailable()) {
          // Try to find matching contact in CRM
          const contacts = await supabaseService.getContacts('default');
          const match = contacts.find(c => 
            c.first_name?.toLowerCase().includes(entity.value.toLowerCase()) ||
            c.last_name?.toLowerCase().includes(entity.value.toLowerCase()) ||
            `${c.first_name} ${c.last_name}`.toLowerCase().includes(entity.value.toLowerCase())
          );

          if (match) {
            entity.crmReference = { type: 'contact', id: match.id };
            entity.normalizedValue = `${match.first_name} ${match.last_name}`;
            entity.confidence = Math.min(100, entity.confidence + 20);
          }
        }

        if (entity.type === 'company' && supabaseService.isAvailable()) {
          // Try to find matching company in contacts
          const contacts = await supabaseService.getContacts('default');
          const match = contacts.find(c => 
            c.company?.toLowerCase().includes(entity.value.toLowerCase())
          );

          if (match) {
            entity.crmReference = { type: 'contact', id: match.id };
            entity.normalizedValue = match.company;
            entity.confidence = Math.min(100, entity.confidence + 15);
          }
        }

        // Normalize dates
        if (entity.type === 'date') {
          try {
            const normalizedDate = new Date(entity.value);
            if (!isNaN(normalizedDate.getTime())) {
              entity.normalizedValue = normalizedDate.toISOString();
            }
          } catch (error) {
            console.warn('Failed to normalize date:', entity.value);
          }
        }

        // Normalize amounts
        if (entity.type === 'amount') {
          const numericValue = parseFloat(entity.value.replace(/[^\d.-]/g, ''));
          if (!isNaN(numericValue)) {
            entity.normalizedValue = numericValue.toString();
          }
        }
      }

      return resolvedEntities;
    } catch (error) {
      console.error('Failed to resolve CRM entities:', error);
      return entities;
    }
  }

  // Handle ambiguous commands by asking clarifying questions
  async handleAmbiguousCommand(
    originalCommand: string, 
    ambiguities: string[]
  ): Promise<string[]> {
    try {
      const clarificationPrompt = `
        The user said: "${originalCommand}"
        
        These aspects are ambiguous: ${ambiguities.join(', ')}
        
        Generate 2-3 specific clarifying questions that would help execute this command perfectly.
        Make them conversational and helpful.
        
        Examples:
        - "Which TechCorp contact are you referring to? I found Sarah Johnson and Mike Chen."
        - "Should I send the follow-up immediately or schedule it for a specific time?"
        - "What type of meeting - demo, discovery call, or check-in?"
        
        Return as simple text array, one question per line.
      `;

      const questions = await realApiService.openai.generateText(clarificationPrompt, 300, 0.5);
      return questions.split('\n').filter(q => q.trim().length > 0);

    } catch (error) {
      console.error('Failed to generate clarifying questions:', error);
      return [`Could you please clarify: ${ambiguities.join(', ')}?`];
    }
  }

  // Suggest command completions as user types
  async getCommandSuggestions(partialInput: string): Promise<string[]> {
    if (partialInput.length < 3) return [];

    try {
      const instructions = `
        Suggest 3-5 likely command completions that are:
        1. Relevant to CRM/sales activities
        2. Commonly used business actions
        3. Natural extensions of what they're typing
        
        Examples for "create contact":
        - "create contact for John Smith at TechCorp"
        - "create contact from business card scan"
        - "create contact and schedule demo"
        
        Return as simple text array, one suggestion per line.
      `;

      const suggestionInput = `User is typing: "${partialInput}"
        
        Recent command history: ${this.commandHistory.slice(-5).join(', ')}`;

      const response = await realApiService.openai.generateAIResponse(
        instructions,
        suggestionInput,
        {
          maxTokens: 200,
          temperature: 0.8
        }
      );
      
      const suggestions = response.output_text || '';
      return suggestions.split('\n').filter(s => s.trim().length > 0);

    } catch (error) {
      console.warn('Failed to get command suggestions:', error);
      return [];
    }
  }

  // Build comprehensive context for command parsing
  private async buildCommandContext(): Promise<CommandContext> {
    const conversationContext = contextualMemoryService.getCurrentContext();
    
    return {
      previousCommands: this.commandHistory.slice(-5),
      crmEntities: conversationContext?.crmContext.recentContacts || [],
      userPreferences: conversationContext?.userProfile || {},
      businessContext: conversationContext?.crmContext.businessContext || 'No context',
      currentFocus: this.detectCurrentFocus()
    };
  }

  // Detect what user is currently focused on
  private detectCurrentFocus(): string | undefined {
    const recent = this.commandHistory.slice(-3);
    
    if (recent.some(cmd => cmd.toLowerCase().includes('contact'))) {
      return 'contact_management';
    }
    if (recent.some(cmd => cmd.toLowerCase().includes('deal') || cmd.toLowerCase().includes('sales'))) {
      return 'deal_management';
    }
    if (recent.some(cmd => cmd.toLowerCase().includes('email') || cmd.toLowerCase().includes('follow'))) {
      return 'communication';
    }
    if (recent.some(cmd => cmd.toLowerCase().includes('meeting') || cmd.toLowerCase().includes('calendar'))) {
      return 'scheduling';
    }
    
    return undefined;
  }

  // Fallback basic parsing
  private basicCommandParse(userInput: string): ParsedCommand {
    return {
      intent: 'unknown',
      entities: [],
      confidence: 30,
      actionType: 'query',
      parameters: { originalInput: userInput },
      requiredAgents: ['Command Analyzer Agent'],
      suggestedTools: [],
      ambiguities: ['Command needs manual interpretation'],
      clarificationQuestions: ['Could you please rephrase your request more specifically?']
    };
  }

  // Get command history
  getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  // Clear history
  clearHistory(): void {
    this.commandHistory = [];
    this.entityCache.clear();
  }
}

export const enhancedNLUService = EnhancedNLUService.getInstance();