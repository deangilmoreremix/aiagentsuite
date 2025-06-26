import React, { useState, useEffect } from 'react';
import { Goal } from '../types/goals';
import { 
  Users, 
  Target, 
  Calendar, 
  Mail, 
  Phone, 
  TrendingUp,
  Plus,
  Edit,
  Check,
  Clock,
  ArrowRight,
  Bot,
  Activity,
  Zap,
  FileText,
  MessageSquare,
  DollarSign,
  Star,
  AlertCircle,
  CheckCircle,
  User,
  Building,
  MapPin,
  Globe
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';
  value: number;
  lastContact: Date;
  notes: string[];
  agentActions: AgentAction[];
}

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: 'discovery' | 'demo' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  closeDate: Date;
  contact: string;
  agentActions: AgentAction[];
}

interface AgentAction {
  id: string;
  agentName: string;
  action: string;
  timestamp: Date;
  status: 'pending' | 'executing' | 'completed';
  result?: string;
  icon: any;
  color: string;
}

interface CRMWorkspaceProps {
  goal: Goal;
  isExecuting: boolean;
  onActionComplete?: (action: AgentAction) => void;
}

const CRMWorkspace: React.FC<CRMWorkspaceProps> = ({
  goal,
  isExecuting,
  onActionComplete
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'deals' | 'calendar' | 'activities'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [liveAgentActions, setLiveAgentActions] = useState<AgentAction[]>([]);
  const [recentActivities, setRecentActivities] = useState<AgentAction[]>([]);

  // Initialize sample CRM data
  useEffect(() => {
    setContacts([
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@techcorp.com',
        company: 'TechCorp Inc.',
        phone: '+1 (555) 123-4567',
        status: 'new',
        value: 50000,
        lastContact: new Date(Date.now() - 86400000 * 2),
        notes: ['Initial contact made', 'Interested in enterprise features'],
        agentActions: []
      },
      {
        id: '2',
        name: 'John Smith',
        email: 'john@acmecorp.com',
        company: 'Acme Corporation',
        phone: '+1 (555) 234-5678',
        status: 'contacted',
        value: 75000,
        lastContact: new Date(Date.now() - 86400000),
        notes: ['Demo scheduled for Friday'],
        agentActions: []
      },
      {
        id: '3',
        name: 'Emily Chen',
        email: 'emily@startupx.io',
        company: 'StartupX',
        phone: '+1 (555) 345-6789',
        status: 'qualified',
        value: 25000,
        lastContact: new Date(Date.now() - 86400000 * 3),
        notes: ['Budget confirmed', 'Decision maker identified'],
        agentActions: []
      }
    ]);

    setDeals([
      {
        id: '1',
        name: 'TechCorp Enterprise Deal',
        company: 'TechCorp Inc.',
        value: 50000,
        stage: 'discovery',
        probability: 30,
        closeDate: new Date(Date.now() + 86400000 * 30),
        contact: 'Sarah Johnson',
        agentActions: []
      },
      {
        id: '2',
        name: 'Acme Implementation',
        company: 'Acme Corporation',
        value: 75000,
        stage: 'demo',
        probability: 60,
        closeDate: new Date(Date.now() + 86400000 * 21),
        contact: 'John Smith',
        agentActions: []
      }
    ]);
  }, []);

  // Simulate agent actions when goal is executing
  useEffect(() => {
    if (!isExecuting) return;

    const agentActionsForGoal = generateAgentActionsForGoal(goal);
    let actionIndex = 0;

    const executeNextAction = () => {
      if (actionIndex >= agentActionsForGoal.length) return;

      const action = agentActionsForGoal[actionIndex];
      
      // Add action to live actions
      setLiveAgentActions(prev => [action, ...prev.slice(0, 4)]);
      
      // Execute the action after a delay
      setTimeout(() => {
        const completedAction = { ...action, status: 'completed' as const };
        
        // Apply action to CRM data
        applyActionToCRM(completedAction);
        
        // Move to recent activities
        setRecentActivities(prev => [completedAction, ...prev.slice(0, 9)]);
        
        // Remove from live actions
        setLiveAgentActions(prev => prev.filter(a => a.id !== action.id));
        
        onActionComplete?.(completedAction);
        
        actionIndex++;
        
        // Schedule next action
        if (actionIndex < agentActionsForGoal.length) {
          setTimeout(executeNextAction, Math.random() * 2000 + 1000);
        }
      }, Math.random() * 3000 + 2000);
    };

    // Start executing actions
    setTimeout(executeNextAction, 1000);
  }, [isExecuting, goal]);

  const generateAgentActionsForGoal = (goal: Goal): AgentAction[] => {
    const actions: AgentAction[] = [];
    const timestamp = new Date();

    // Generate actions based on goal type
    if (goal.category === 'Sales') {
      actions.push(
        {
          id: `action-${Date.now()}-1`,
          agentName: 'AI SDR Agent',
          action: 'Identifying new prospects in target market',
          timestamp: new Date(timestamp.getTime() + 1000),
          status: 'pending',
          icon: Users,
          color: 'blue'
        },
        {
          id: `action-${Date.now()}-2`,
          agentName: 'Lead Enrichment Agent',
          action: 'Enriching contact data with LinkedIn profiles',
          timestamp: new Date(timestamp.getTime() + 3000),
          status: 'pending',
          icon: User,
          color: 'purple'
        },
        {
          id: `action-${Date.now()}-3`,
          agentName: 'Personalized Email Agent',
          action: 'Creating personalized outreach emails',
          timestamp: new Date(timestamp.getTime() + 5000),
          status: 'pending',
          icon: Mail,
          color: 'green'
        },
        {
          id: `action-${Date.now()}-4`,
          agentName: 'Function Trigger Agent',
          action: 'Sending emails and updating CRM records',
          timestamp: new Date(timestamp.getTime() + 7000),
          status: 'pending',
          icon: Zap,
          color: 'orange'
        },
        {
          id: `action-${Date.now()}-5`,
          agentName: 'Timeline Logger Agent',
          action: 'Logging all activities to contact timeline',
          timestamp: new Date(timestamp.getTime() + 9000),
          status: 'pending',
          icon: FileText,
          color: 'indigo'
        }
      );
    } else if (goal.category === 'Marketing') {
      actions.push(
        {
          id: `action-${Date.now()}-1`,
          agentName: 'AI Journeys Agent',
          action: 'Setting up multi-channel nurture sequence',
          timestamp: new Date(timestamp.getTime() + 1000),
          status: 'pending',
          icon: ArrowRight,
          color: 'purple'
        },
        {
          id: `action-${Date.now()}-2`,
          agentName: 'SMS Campaigner Agent',
          action: 'Creating SMS campaign for warm leads',
          timestamp: new Date(timestamp.getTime() + 3000),
          status: 'pending',
          icon: MessageSquare,
          color: 'blue'
        }
      );
    }

    return actions;
  };

  const applyActionToCRM = (action: AgentAction) => {
    if (action.agentName === 'AI SDR Agent') {
      // Add new contacts
      const newContact: Contact = {
        id: `contact-${Date.now()}`,
        name: `Prospect ${Math.floor(Math.random() * 1000)}`,
        email: `prospect${Math.floor(Math.random() * 1000)}@company.com`,
        company: `Company ${Math.floor(Math.random() * 100)}`,
        phone: '+1 (555) 000-0000',
        status: 'new',
        value: Math.floor(Math.random() * 50000) + 10000,
        lastContact: new Date(),
        notes: ['Added by AI SDR Agent'],
        agentActions: [action]
      };
      setContacts(prev => [newContact, ...prev]);
    } else if (action.agentName === 'Personalized Email Agent') {
      // Update contact status to contacted
      setContacts(prev => prev.map(contact => 
        contact.status === 'new' ? {
          ...contact,
          status: 'contacted',
          lastContact: new Date(),
          notes: [...contact.notes, 'Personalized email sent by AI'],
          agentActions: [...contact.agentActions, action]
        } : contact
      ));
    } else if (action.agentName === 'Lead Enrichment Agent') {
      // Update contact information
      setContacts(prev => prev.map(contact => ({
        ...contact,
        notes: [...contact.notes, 'Contact data enriched with social profiles'],
        agentActions: [...contact.agentActions, action]
      })));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'contacted': return 'bg-yellow-500/20 text-yellow-400';
      case 'qualified': return 'bg-green-500/20 text-green-400';
      case 'proposal': return 'bg-purple-500/20 text-purple-400';
      case 'closed': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'discovery': return 'bg-blue-500/20 text-blue-400';
      case 'demo': return 'bg-yellow-500/20 text-yellow-400';
      case 'proposal': return 'bg-purple-500/20 text-purple-400';
      case 'negotiation': return 'bg-orange-500/20 text-orange-400';
      case 'closed-won': return 'bg-green-500/20 text-green-400';
      case 'closed-lost': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
      {/* CRM Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Live CRM Workspace</h2>
            <p className="text-gray-300 text-sm">Watch AI agents work on your CRM in real-time</p>
          </div>
        </div>
        
        {isExecuting && (
          <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full border border-blue-400/30">
            <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
            <span className="text-blue-300 text-sm font-medium">Agents Active</span>
          </div>
        )}
      </div>

      {/* Live Agent Actions */}
      {liveAgentActions.length > 0 && (
        <div className="mb-6 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
          <h3 className="text-blue-300 font-medium mb-3 flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Live Agent Activity
          </h3>
          <div className="space-y-2">
            {liveAgentActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <div key={action.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className={`p-2 rounded-lg bg-${action.color}-500/20`}>
                    <IconComponent className={`h-4 w-4 text-${action.color}-400`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{action.agentName}</div>
                    <div className="text-gray-300 text-sm">{action.action}</div>
                  </div>
                  <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CRM Navigation */}
      <div className="flex space-x-4 mb-6 border-b border-slate-700/50">
        {[
          { id: 'contacts', label: 'Contacts', icon: Users, count: contacts.length },
          { id: 'deals', label: 'Deals', icon: Target, count: deals.length },
          { id: 'calendar', label: 'Calendar', icon: Calendar, count: 3 },
          { id: 'activities', label: 'Activities', icon: FileText, count: recentActivities.length }
        ].map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              {tab.label}
              <span className="bg-slate-600/50 text-xs px-2 py-1 rounded-full">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* CRM Content */}
      <div className="space-y-4">
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Contacts</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                Add Contact
              </button>
            </div>
            
            <div className="grid gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-4 rounded-xl border transition-all duration-500 ${
                    contact.agentActions.length > 0
                      ? 'bg-blue-500/5 border-blue-400/30 ring-1 ring-blue-500/20'
                      : 'bg-slate-700/30 border-slate-600/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{contact.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Building className="h-3 w-3" />
                          {contact.company}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </div>
                      <div className="text-green-400 font-medium mt-1">${contact.value.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </div>
                  </div>
                  
                  {contact.notes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600/30">
                      <div className="text-xs text-gray-400 mb-2">Recent Notes:</div>
                      <div className="space-y-1">
                        {contact.notes.slice(-2).map((note, index) => (
                          <div key={index} className="text-sm text-gray-300 flex items-center gap-2">
                            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {contact.agentActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-500/30">
                      <div className="text-xs text-blue-400 mb-2 flex items-center gap-2">
                        <Bot className="h-3 w-3" />
                        Recent AI Actions:
                      </div>
                      <div className="space-y-1">
                        {contact.agentActions.slice(-2).map((action, index) => (
                          <div key={index} className="text-sm text-blue-300 flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            {action.agentName}: {action.action}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Deals Pipeline</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="h-4 w-4" />
                Add Deal
              </button>
            </div>
            
            <div className="grid gap-4">
              {deals.map((deal) => (
                <div key={deal.id} className="p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-white">{deal.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Building className="h-3 w-3" />
                        {deal.company}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                        {deal.stage.replace('-', ' ')}
                      </div>
                      <div className="text-green-400 font-medium mt-1">${deal.value.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Probability</div>
                      <div className="text-white font-medium">{deal.probability}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Close Date</div>
                      <div className="text-white">{deal.closeDate.toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Contact</div>
                      <div className="text-white">{deal.contact}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-600/30">
                    <div className="w-full bg-slate-600/50 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${deal.probability}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
            
            <div className="space-y-3">
              {recentActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-4 p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
                    <div className={`p-2 rounded-lg bg-${activity.color}-500/20`}>
                      <IconComponent className={`h-5 w-5 text-${activity.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{activity.agentName}</span>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <div className="text-gray-300">{activity.action}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {activity.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {recentActivities.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activities. Start executing goals to see agent actions!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Upcoming Meetings</h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-white">Demo with John Smith</div>
                  <div className="text-blue-400 text-sm">Tomorrow 2:00 PM</div>
                </div>
                <div className="text-gray-300 text-sm">Product demonstration for Acme Corporation</div>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                  <Calendar className="h-3 w-3" />
                  Zoom Meeting
                </div>
              </div>
              
              <div className="p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-white">Follow-up with Sarah</div>
                  <div className="text-green-400 text-sm">Friday 10:00 AM</div>
                </div>
                <div className="text-gray-300 text-sm">Discuss TechCorp implementation timeline</div>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                  <Phone className="h-3 w-3" />
                  Phone Call
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRMWorkspace;