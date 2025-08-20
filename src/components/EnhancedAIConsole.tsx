import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Mic, 
  Send, 
  Volume2, 
  Brain, 
  Lightbulb, 
  Sparkles,
  History,
  Search,
  MicOff,
  Eye,
  MessageSquare,
  Zap,
  Star,
  ArrowRight,
  Clock,
  User,
  TrendingUp,
  Target,
  CheckCircle,
  Info,
  HelpCircle,
  Activity
} from 'lucide-react';
import { contextualMemoryService } from '../services/contextualMemoryService';
import { proactiveAssistantService } from '../services/proactiveAssistantService';
import { enhancedNLUService } from '../services/enhancedNLUService';
import { emotionalVoiceService } from '../services/emotionalVoiceService';
import { realApiService } from '../services/realApiService';
import Tooltip from './Tooltip';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system' | 'suggestion';
  content: string;
  timestamp: Date;
  agentName?: string;
  thinking?: string;
  actions?: string[];
  toolsUsed?: string[];
  entities?: any[];
  confidence?: number;
  emotionalTone?: string;
  audioUrl?: string;
}

interface ProactiveSuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  suggestedCommand?: string;
  estimatedValue?: number;
  priority: string;
}

interface EnhancedAIConsoleProps {
  realMode?: boolean;
  onModeToggle?: () => void;
  className?: string;
  showProactiveSuggestions?: boolean;
}

const EnhancedAIConsole: React.FC<EnhancedAIConsoleProps> = ({
  realMode = false,
  onModeToggle,
  className = '',
  showProactiveSuggestions = true
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [commandSuggestions, setCommandSuggestions] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationSummary, setConversationSummary] = useState<string>('');
  const [currentEmotionalContext, setCurrentEmotionalContext] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize contextual memory and proactive assistant
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await contextualMemoryService.initializeContext('default-user', `session-${Date.now()}`);
        
        if (realMode) {
          proactiveAssistantService.startProactiveMonitoring('default-user');
        }
        
        setIsInitialized(true);
        console.log('🧠 Enhanced AI Console initialized');
      } catch (error) {
        console.error('Failed to initialize AI console:', error);
        setIsInitialized(true); // Continue anyway
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      proactiveAssistantService.stopProactiveMonitoring();
    };
  }, [realMode]);

  // Load proactive suggestions periodically
  useEffect(() => {
    if (!realMode || !isInitialized) return;

    const loadSuggestions = async () => {
      try {
        const suggestions = await proactiveAssistantService.generateProactiveSuggestions('default-user');
        if (isMountedRef.current) {
          setProactiveSuggestions(suggestions.slice(0, 3)); // Show top 3
        }
      } catch (error) {
        console.error('Failed to load proactive suggestions:', error);
      }
    };

    loadSuggestions();
    const interval = setInterval(loadSuggestions, 60000); // Every minute
    return () => clearInterval(interval);
  }, [realMode, isInitialized]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update conversation summary when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const updateSummary = async () => {
        try {
          const summary = await contextualMemoryService.getContextualSummary();
          if (isMountedRef.current) {
            setConversationSummary(summary);
          }
        } catch (error) {
          console.error('Failed to update conversation summary:', error);
        }
      };
      updateSummary();
    }
  }, [messages]);

  // Generate command suggestions as user types
  useEffect(() => {
    if (inputValue.length >= 3 && realMode) {
      const getSuggestions = async () => {
        try {
          const suggestions = await enhancedNLUService.getCommandSuggestions(inputValue);
          if (isMountedRef.current) {
            setCommandSuggestions(suggestions.slice(0, 3));
          }
        } catch (error) {
          console.error('Failed to get command suggestions:', error);
        }
      };

      const debounceTimer = setTimeout(getSuggestions, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      setCommandSuggestions([]);
    }
  }, [inputValue, realMode]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsProcessing(true);
    setCommandSuggestions([]);

    try {
      // Add to contextual memory
      await contextualMemoryService.addMessage('user', currentInput);

      // Analyze emotional context
      const emotionalContext = await emotionalVoiceService.analyzeEmotionalContext(currentInput);
      setCurrentEmotionalContext(emotionalContext);

      if (realMode) {
        // Enhanced NLU parsing
        const parsedCommand = await enhancedNLUService.parseCommand(currentInput);
        
        // Check for ambiguities
        if (parsedCommand.ambiguities.length > 0) {
          const clarificationQuestions = await enhancedNLUService.handleAmbiguousCommand(
            currentInput,
            parsedCommand.ambiguities
          );

          const clarificationMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: `I need some clarification: ${clarificationQuestions.join(' ')}`,
            agentName: 'Enhanced NLU Agent',
            timestamp: new Date(),
            confidence: parsedCommand.confidence,
            emotionalTone: emotionalContext.conversationTone
          };

          setMessages(prev => [...prev, clarificationMessage]);
          await contextualMemoryService.addMessage('ai', clarificationMessage.content, 'Enhanced NLU Agent');
          return;
        }

        // Execute with real agents
        const thinkingMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: 'Enhanced AI agents analyzing your request with full context...',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, thinkingMessage]);

        // Generate enhanced response
        const contextSummary = await contextualMemoryService.getContextualSummary();
        const enhancedPrompt = `
          Context: ${contextSummary}
          User Request: ${currentInput}
          Parsed Command: ${JSON.stringify(parsedCommand, null, 2)}
          Emotional Context: ${JSON.stringify(emotionalContext, null, 2)}
          
          Execute this request with full contextual understanding and emotional intelligence.
        `;

        const result = await realApiService.openai.generateText(enhancedPrompt, 600);

        // Remove thinking message
        setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));

        // Generate emotionally intelligent response
        const enhancedResponse = await emotionalVoiceService.generateEmotionalResponse(
          result,
          'Enhanced AI Assistant',
          { parsedCommand, emotionalContext }
        );

        // Generate voice response if available
        let audioUrl: string | null = null;
        if (realMode) {
          audioUrl = await emotionalVoiceService.generateEmotionalVoiceResponse(
            enhancedResponse,
            'Enhanced AI Assistant'
          );
        }

        const aiResponse: Message = {
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: enhancedResponse,
          agentName: 'Enhanced AI Assistant',
          timestamp: new Date(),
          thinking: `Analyzed with ${parsedCommand.confidence}% confidence. Emotional context: ${emotionalContext.conversationTone}`,
          entities: parsedCommand.entities,
          confidence: parsedCommand.confidence,
          emotionalTone: emotionalContext.conversationTone,
          audioUrl: audioUrl || undefined,
          toolsUsed: parsedCommand.suggestedTools
        };

        setMessages(prev => [...prev, aiResponse]);
        await contextualMemoryService.addMessage('ai', enhancedResponse, 'Enhanced AI Assistant');

        // Play audio if available
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.play().catch(e => console.log('Audio playback failed:', e));
        }

      } else {
        // Demo mode with enhanced simulation
        const simulatedResponse = await this.generateEnhancedDemo(currentInput);
        setMessages(prev => [...prev, simulatedResponse]);
      }

    } catch (error) {
      console.error('Enhanced AI processing failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'system',
        content: 'Enhanced AI processing encountered an issue. Please check your configuration.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateEnhancedDemo = async (input: string): Promise<Message> => {
    // Enhanced demo responses with contextual awareness
    const demoResponses = [
      `I understand you want to work with "${input}". In Live Mode, I would analyze this request with full CRM context, coordinate multiple AI agents, and execute real actions in your business tools.`,
      `That's an interesting request about "${input}". With GPT-5 coordination, I would break this down into specific agent tasks, check your CRM for relevant data, and provide emotionally intelligent responses.`,
      `For "${input}", I would typically engage our specialized agent network, analyze your conversation history for context, and execute with precise emotional intelligence matching your current needs.`
    ];

    return {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: demoResponses[Math.floor(Math.random() * demoResponses.length)],
      agentName: 'Enhanced Demo Agent',
      timestamp: new Date(),
      thinking: 'Demo mode: Simulating enhanced contextual understanding and emotional intelligence',
      emotionalTone: 'professional'
    };
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice input with enhanced commands
      const enhancedCommands = [
        "Analyze my pipeline and suggest next steps for high-value deals",
        "Create a personalized follow-up sequence for TechCorp prospects",
        "Find all contacts who haven't been contacted in over 2 weeks",
        "Schedule demos with qualified leads and send calendar invites"
      ];
      
      setTimeout(() => {
        setInputValue(enhancedCommands[Math.floor(Math.random() * enhancedCommands.length)]);
        setIsListening(false);
      }, 3000);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setCommandSuggestions([]);
    inputRef.current?.focus();
  };

  const handleProactiveSuggestionClick = async (suggestion: ProactiveSuggestion) => {
    if (suggestion.suggestedCommand) {
      setInputValue(suggestion.suggestedCommand);
      
      // Optionally auto-execute the suggestion
      setTimeout(() => {
        handleSendMessage();
      }, 100);
    }
  };

  const dismissProactiveSuggestion = (suggestionId: string) => {
    setProactiveSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    proactiveAssistantService.dismissSuggestion('default-user', suggestionId);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Console Header */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Brain className="h-8 w-8 text-blue-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Enhanced AI Console</h3>
              <p className="text-gray-300 text-sm">GPT-5 powered with contextual memory & emotional intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {conversationSummary && (
              <Tooltip 
                content={conversationSummary}
                position="left"
                className="p-2 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-300"
              >
                <Brain className="h-5 w-5" />
              </Tooltip>
            )}
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-gray-400 hover:text-white transition-colors"
            >
              <History className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Emotional Context Indicator */}
        {currentEmotionalContext && realMode && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <span className="text-blue-300">
                Tone: {currentEmotionalContext.conversationTone} • 
                Context: {currentEmotionalContext.businessContext} • 
                Style: {currentEmotionalContext.responseStyle}
              </span>
              <Tooltip 
                content="GPT-5 analyzes your communication style and adapts responses accordingly"
                position="top"
              />
            </div>
          </div>
        )}

        {/* Proactive Suggestions */}
        {showProactiveSuggestions && proactiveSuggestions.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-purple-300 mb-3">
              <Lightbulb className="h-4 w-4" />
              <span>AI suggests you might want to:</span>
            </div>
            {proactiveSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between p-3 bg-purple-500/10 dark:bg-purple-500/10 border border-purple-400/30 dark:border-purple-400/30 rounded-lg hover:bg-purple-500/20 dark:hover:bg-purple-500/20 transition-colors cursor-pointer group"
                onClick={() => handleProactiveSuggestionClick(suggestion)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-purple-800 dark:text-purple-200 text-sm">{suggestion.title}</span>
                    {suggestion.priority === 'high' && <Star className="h-3 w-3 text-yellow-400" />}
                    {suggestion.estimatedValue && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        ${suggestion.estimatedValue.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-purple-700/80 dark:text-purple-300/80">{suggestion.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-600 dark:text-purple-400">{suggestion.confidence}%</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissProactiveSuggestion(suggestion.id);
                    }}
                    className="p-1 rounded text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat Messages */}
        <div className="h-64 overflow-y-auto space-y-3 mb-4 bg-gray-50 dark:bg-slate-900/30 rounded-xl p-4 border border-gray-300/50 dark:border-slate-700/30">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Enhanced AI Console Ready</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                {realMode 
                  ? 'I have contextual memory, emotional intelligence, and access to your CRM data. How can I help?'
                  : 'Try the enhanced AI features in Demo Mode. I can simulate contextual understanding and intelligent responses.'
                }
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-sm ${message.type === 'user' ? 'order-2' : ''}`}>
                {message.agentName && (
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-400 mb-1">
                    <span>{message.agentName}</span>
                    {message.confidence && (
                      <span className="bg-blue-500/20 px-2 py-1 rounded-full">
                        {message.confidence}%
                      </span>
                    )}
                    {message.emotionalTone && (
                      <span className="bg-purple-500/20 px-2 py-1 rounded-full">
                        {message.emotionalTone}
                      </span>
                    )}
                  </div>
                )}
                
                <div
                  className={`px-4 py-3 rounded-xl text-sm ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'system'
                      ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border border-yellow-400 dark:border-yellow-500/30'
                      : 'bg-white dark:bg-slate-700/50 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-slate-600/30 shadow-sm'
                  }`}
                >
                  {message.content}
                  
                  {message.audioUrl && (
                    <button
                      onClick={() => {
                        const audio = new Audio(message.audioUrl);
                        audio.play();
                      }}
                      className="ml-2 p-1 rounded bg-green-500/20 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 dark:hover:bg-green-500/30 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {message.thinking && (
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-slate-600/30 rounded border-l-2 border-blue-500 text-xs text-gray-600 dark:text-gray-400">
                    <Brain className="inline h-3 w-3 mr-1" />
                    {message.thinking}
                  </div>
                )}

                {message.entities && message.entities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.entities.map((entity, index) => (
                      <span key={index} className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                        {entity.type}: {entity.value}
                      </span>
                    ))}
                  </div>
                )}

                {message.toolsUsed && message.toolsUsed.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.toolsUsed.map((tool, index) => (
                      <span key={index} className="text-xs bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
                        🔧 {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 order-3">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
              <div className="bg-white dark:bg-slate-700/50 px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600/30 shadow-sm">
                <span className="text-sm text-gray-800 dark:text-gray-300">Enhanced AI processing with contextual understanding...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Command Suggestions */}
        {commandSuggestions.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Suggested completions:
            </div>
            {commandSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left p-2 text-sm bg-gray-100 dark:bg-slate-600/30 hover:bg-gray-200 dark:hover:bg-slate-600/50 border border-gray-300 dark:border-slate-500/30 hover:border-blue-500/50 dark:hover:border-blue-500/30 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Enhanced Input */}
        <div className="flex items-center gap-3 relative">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={realMode 
                ? "Ask anything - I have full context and memory..." 
                : "Try enhanced AI features in Demo Mode..."
              }
              className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              disabled={isProcessing}
            />
            
            {realMode && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                Enhanced NLU active
              </div>
            )}
          </div>
          
          <button
            onClick={handleVoiceToggle}
            className={`p-3 rounded-xl transition-all duration-300 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-white'
            }`}
            disabled={isProcessing}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white p-3 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Enhanced Features Indicator */}
        {realMode && (
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
              <CheckCircle className="h-3 w-3" />
              Contextual Memory
            </div>
            <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full">
              <Brain className="h-3 w-3" />
              Emotional Intelligence
            </div>
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
              <Lightbulb className="h-3 w-3" />
              Proactive Suggestions
            </div>
            <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full">
              <Volume2 className="h-3 w-3" />
              Emotional Voice
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAIConsole;