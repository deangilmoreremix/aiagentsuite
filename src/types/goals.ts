export interface Goal {
  id: string;
  category: 'Sales' | 'Marketing' | 'Relationship' | 'Automation' | 'Analytics' | 'Content' | 'Admin' | 'AI-Native';
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  agentsRequired: string[];
  toolsNeeded: string[];
  estimatedSetupTime: string;
  businessImpact: string;
  complexity: 'Simple' | 'Intermediate' | 'Advanced';
  realWorldExample: string;
  successMetrics: string[];
  prerequisite?: string[];
  roi: string;
}

export interface GoalCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  totalGoals: number;
}

export interface GoalProgress {
  goalId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  completedSteps: string[];
  lastUpdated: Date;
  metrics: Record<string, any>;
}

export interface AgentGoalMapping {
  agentId: string;
  goalIds: string[];
  primaryGoals: string[];
  supportingGoals: string[];
}