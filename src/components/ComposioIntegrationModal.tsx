import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  Check, 
  ExternalLink, 
  Star, 
  Filter,
  Clock,
  ArrowRight,
  Globe,
  Zap,
  ShieldCheck,
  Key,
  RefreshCw,
  AlertTriangle,
  Link as LinkIcon,
  HelpCircle
} from 'lucide-react';
import { composioTools, composioToolCategories, getToolsByCategory, getToolsByStatus, searchTools, ComposioTool } from '../data/composioToolsData';
import { apiConfig } from '../config/apiConfig';
import Tooltip from './Tooltip';

interface ComposioIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSelect?: (tool: ComposioTool) => void;
}

const ComposioIntegrationModal: React.FC<ComposioIntegrationModalProps> = ({
  isOpen,
  onClose,
  onToolSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'coming-soon'>('all');
  const [popularOnly, setPopularOnly] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});
  const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>({});
  const [selectedTool, setSelectedTool] = useState<ComposioTool | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter tools based on current filters
  const filteredTools = (() => {
    let filtered = composioTools;
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = getToolsByCategory(selectedCategory);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tool => tool.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = searchTools(searchQuery);
    }
    
    // Apply popular filter
    if (popularOnly) {
      filtered = filtered.filter(tool => (tool.popularityScore || 0) >= 90);
    }
    
    return filtered;
  })();
  
  // Categories with counts
  const categoriesWithCounts = composioToolCategories.map(category => ({
    ...category,
    currentCount: getToolsByCategory(category.id).length,
    filteredCount: getToolsByCategory(category.id).filter(tool => {
      if (statusFilter !== 'all' && tool.status !== statusFilter) return false;
      if (searchQuery && !searchTools(searchQuery).includes(tool)) return false;
      if (popularOnly && (tool.popularityScore || 0) < 90) return false;
      return true;
    }).length
  }));

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedTool) {
          setSelectedTool(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, selectedTool]);

  // Simulate connecting to tool
  const handleConnectTool = async (tool: ComposioTool) => {
    if (isConnecting[tool.id]) return;

    setIsConnecting(prev => ({ ...prev, [tool.id]: true }));

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setConnectionStatus(prev => ({ ...prev, [tool.id]: true }));
    setIsConnecting(prev => ({ ...prev, [tool.id]: false }));

    // Notify parent component about tool selection
    if (onToolSelect) {
      onToolSelect(tool);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => selectedTool ? setSelectedTool(null) : onClose()} />
      
      {/* Main modal */}
      <div className="relative w-full max-w-7xl max-h-[90vh] bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Composio Integration Hub</h2>
              <p className="text-gray-300">Connect your AI agents to 250+ tools and services</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm ${
              apiConfig.composio.isConfigured 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  apiConfig.composio.isConfigured ? 'bg-green-400' : 'bg-yellow-400'
                }`}></div>
                <span>
                  {apiConfig.composio.isConfigured ? 'API Configured' : 'API Not Configured'}
                </span>
                <Tooltip 
                  content={apiConfig.composio.isConfigured 
                    ? "Your Composio API key is configured" 
                    : "Set up your Composio API key in settings to enable real tool integration"
                  }
                  position="left"
                />
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {selectedTool ? (
          // Tool detail view
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setSelectedTool(null)}
                className="mb-6 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowRight className="h-5 w-5 rotate-180" />
                Back to all integrations
              </button>
              
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-2xl border border-slate-600/50 p-8">
                <div className="flex items-start gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-400/30 text-center">
                    <div className="text-6xl mb-4">{selectedTool.icon}</div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedTool.status === 'active' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {selectedTool.status === 'active' ? 'Active' : 'Coming Soon'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-3xl font-bold text-white">{selectedTool.name}</h3>
                      <div className="flex items-center gap-2">
                        {selectedTool.popularityScore && selectedTool.popularityScore >= 90 && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="h-4 w-4 fill-yellow-400" />
                            <span className="text-sm font-medium">Popular</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-blue-400 mb-6">
                      {composioToolCategories.find(c => c.id === selectedTool.category)?.name}
                    </div>
                    
                    <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                      {selectedTool.description}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-slate-700/30 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-400" />
                          Key Features
                        </h4>
                        <ul className="space-y-2 text-gray-300">
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-400" />
                            Direct API integration
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-400" />
                            Secure OAuth authentication
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-400" />
                            Real-time data syncing
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-400" />
                            Automatic error handling
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-slate-700/30 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-purple-400" />
                          Integration Details
                        </h4>
                        <div className="space-y-2 text-gray-300">
                          <div className="flex justify-between">
                            <span>Setup Time:</span>
                            <span className="text-blue-400">{selectedTool.setupTime || '5 min'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Auth Type:</span>
                            <span className="text-purple-400">{selectedTool.authType || 'OAuth'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Data Access:</span>
                            <span className="text-green-400">Read & Write</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Auto-Refresh:</span>
                            <span className="text-blue-400">Enabled</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        Common Use Cases
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedTool.useCases || ['Automation', 'Integration', 'Workflow', 'Data Sync']).map((useCase, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {selectedTool.status === 'active' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => handleConnectTool(selectedTool)}
                          disabled={isConnecting[selectedTool.id] || connectionStatus[selectedTool.id]}
                          className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                            connectionStatus[selectedTool.id]
                              ? 'bg-green-600 text-white cursor-default'
                              : isConnecting[selectedTool.id]
                              ? 'bg-blue-600/50 text-white cursor-wait'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {connectionStatus[selectedTool.id] ? (
                            <>
                              <Check className="h-5 w-5" />
                              Connected
                            </>
                          ) : isConnecting[selectedTool.id] ? (
                            <>
                              <RefreshCw className="h-5 w-5 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <LinkIcon className="h-5 w-5" />
                              Connect {selectedTool.name}
                            </>
                          )}
                        </button>
                        
                        <a
                          href={`https://composio.dev/docs/integrations/${selectedTool.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                        >
                          <HelpCircle className="h-5 w-5" />
                          View Documentation
                        </a>
                      </div>
                    ) : (
                      <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-1" />
                          <div>
                            <h4 className="font-medium text-yellow-300 mb-1">Coming Soon</h4>
                            <p className="text-yellow-200 text-sm">
                              This integration is currently in development and will be available soon.
                              You can sign up to be notified when it's ready.
                            </p>
                            <button className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm text-white font-medium">
                              Get Notified
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-600/50">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-400" />
                        Security & Privacy
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Composio uses OAuth for secure access and never stores your credentials.
                        All data is encrypted in transit and at rest.
                      </p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                        <Key className="h-4 w-4 text-blue-400" />
                        Authentication Method
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {selectedTool.authType === 'oauth' ? (
                          "Uses OAuth 2.0 for secure access without storing your password"
                        ) : selectedTool.authType === 'apiKey' ? (
                          "Requires an API key from your account settings"
                        ) : (
                          "Supports both OAuth and API key authentication methods"
                        )}
                      </p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-purple-400" />
                        Auto-Refresh Tokens
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Composio automatically refreshes access tokens to ensure continuous 
                        operation without manual intervention.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Tools list view
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tools by name or functionality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Status Filter */}
              <div className="flex flex-wrap gap-3">
                {['all', 'active', 'coming-soon'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {status === 'all' 
                      ? 'All Status' 
                      : status === 'active' 
                        ? 'Active Only' 
                        : 'Coming Soon'}
                  </button>
                ))}
                
                {/* Popular Filter */}
                <button
                  onClick={() => setPopularOnly(!popularOnly)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    popularOnly
                      ? 'bg-yellow-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  <Star className={`h-4 w-4 ${popularOnly ? 'fill-white' : ''}`} />
                  Popular Tools
                </button>
                
                {/* View Toggle */}
                <div className="flex rounded-lg overflow-hidden">
                  <button
                    onClick={() => setView('grid')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      view === 'grid' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-gray-300'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      view === 'list' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-gray-300'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6 flex flex-nowrap overflow-x-auto pb-2 -mx-2 px-2 gap-3 custom-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                }`}
              >
                All Categories
              </button>
              
              {categoriesWithCounts.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  disabled={category.filteredCount === 0}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : category.filteredCount === 0
                      ? 'bg-slate-700/20 text-gray-500 cursor-not-allowed'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                  }`}
                >
                  {category.iconText} {category.name} ({category.filteredCount})
                </button>
              ))}
            </div>

            {/* Results Count */}
            <div className="mb-6 text-gray-300">
              Showing <span className="font-semibold text-white">{filteredTools.length}</span> of {composioTools.length} integrations
              {searchQuery && <span> matching "<span className="text-blue-400">{searchQuery}</span>"</span>}
            </div>

            {/* No Results */}
            {filteredTools.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No integrations found</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Try adjusting your search query or filters to find the tools you're looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setStatusFilter('all');
                    setPopularOnly(false);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Tools Grid/List View */}
            {view === 'grid' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => setSelectedTool(tool)}
                    className={`p-6 border rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      tool.status === 'active'
                        ? 'bg-slate-700/30 border-slate-600/50 hover:border-blue-500/30 hover:shadow-lg'
                        : 'bg-slate-700/20 border-yellow-500/30 hover:border-yellow-400/50'
                    }`}
                  >
                    <div className="flex justify-between mb-4">
                      <div className="text-4xl">{tool.icon}</div>
                      
                      {tool.popularityScore && tool.popularityScore >= 90 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="h-4 w-4 fill-yellow-400" />
                          <span className="text-xs font-medium">Popular</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-1">{tool.name}</h3>
                    <div className="text-blue-400 text-sm mb-2">
                      {composioToolCategories.find(c => c.id === tool.category)?.name}
                    </div>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {tool.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                        tool.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tool.status === 'active' ? 'Ready to use' : 'Coming soon'}
                      </div>
                      
                      {tool.status === 'active' && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <Clock className="h-3 w-3" />
                          {tool.setupTime || '5 min'} setup
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => setSelectedTool(tool)}
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-500/30 ${
                      tool.status === 'active'
                        ? 'bg-slate-700/30 border-slate-600/50'
                        : 'bg-slate-700/20 border-yellow-500/30'
                    }`}
                  >
                    <div className="text-3xl">{tool.icon}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{tool.name}</h3>
                        {tool.popularityScore && tool.popularityScore >= 90 && (
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      <p className="text-gray-300 text-sm truncate">
                        {tool.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                        tool.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tool.status === 'active' ? 'Active' : 'Coming Soon'}
                      </div>
                      
                      <div className="text-blue-400 text-sm">
                        {composioToolCategories.find(c => c.id === tool.category)?.name}
                      </div>
                      
                      {tool.status === 'active' && (
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              Powered by <a href="https://composio.dev" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Composio.dev</a> 
              - The universal API integration platform
            </p>
            
            <div className="flex gap-3">
              {!selectedTool && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setStatusFilter('all');
                    setPopularOnly(false);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Clear Filters
                </button>
              )}
              
              <a
                href="https://composio.dev/integrations" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                View All Integrations
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposioIntegrationModal;