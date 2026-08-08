export interface TaskExecution {
  id: string;
  customer_id: string;
  task_type: string;
  task_title: string;
  task_description?: string;
  user_input: Record<string, any>;
  agent_workflow: AgentWorkflowStep[];
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  start_time: string;
  completion_time?: string;
  estimated_duration_minutes: number;
  actual_duration_seconds?: number;
  results: Record<string, any>;
  business_impact: Record<string, any>;
  success_metrics: string[];
  gpt5_reasoning?: string;
  error_message?: string;
  created_by?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  complexity: 'simple' | 'intermediate' | 'advanced';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentWorkflowStep {
  step_number: number;
  agent_name: string;
  action_description: string;
  tools_required: string[];
  input_parameters: Record<string, any>;
  depends_on_steps?: number[];
  estimated_duration_seconds: number;
  parallel_execution?: boolean;
}

export interface AgentTaskLog {
  id: string;
  task_execution_id: string;
  agent_name: string;
  step_number: number;
  action_description: string;
  tools_used: string[];
  input_parameters: Record<string, any>;
  execution_start: string;
  execution_end?: string;
  execution_time_seconds?: number;
  success: boolean;
  result_data: Record<string, any>;
  gpt5_reasoning?: string;
  error_message?: string;
  crm_changes: Record<string, any>;
  business_value_generated: number;
  created_at: string;
}

export interface TaskTemplate {
  id: string;
  customer_id: string;
  template_name: string;
  template_description?: string;
  task_type: string;
  input_schema: TaskInputSchema;
  default_values: Record<string, any>;
  agent_workflow: AgentWorkflowStep[];
  required_tools: string[];
  estimated_setup_time: string;
  business_impact_description?: string;
  success_metrics: string[];
  usage_count: number;
  last_used?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskInputSchema {
  fields: TaskInputField[];
  required_fields: string[];
  conditional_fields?: ConditionalField[];
}

export interface TaskInputField {
  name: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'datetime' | 'select' | 'multiselect' | 'contact' | 'deal' | 'number' | 'textarea' | 'checkbox';
  label: string;
  description?: string;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
  gpt5_suggestion_enabled?: boolean;
  crm_data_source?: string; // Field to populate from CRM data
}

export interface ConditionalField {
  field_name: string;
  condition: {
    depends_on_field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
    value: any;
  };
}

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'min_length' | 'max_length' | 'pattern';
  value?: any;
  message?: string;
}

export interface AgentCoordinationLog {
  id: string;
  task_execution_id: string;
  coordination_type: 'planning' | 'execution' | 'error_recovery' | 'optimization';
  gpt5_decision_reasoning: string;
  input_context: Record<string, any>;
  output_decision: Record<string, any>;
  agents_involved: string[];
  execution_time_ms?: number;
  confidence_score?: number;
  created_at: string;
}

export interface TaskExecutionRequest {
  task_type: string;
  task_title: string;
  task_description?: string;
  user_input: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  use_template_id?: string;
}

export interface TaskExecutionResult {
  success: boolean;
  task_execution_id: string;
  completion_time: string;
  business_impact: {
    contacts_created?: number;
    deals_updated?: number;
    emails_sent?: number;
    meetings_scheduled?: number;
    estimated_revenue_impact?: number;
    time_saved_minutes?: number;
  };
  agent_summary: {
    agents_used: string[];
    total_actions: number;
    success_rate: number;
    tools_utilized: string[];
  };
  next_recommended_actions?: string[];
}

export interface EnhancedTaskInput {
  id: string;
  taskTitle: string;
  taskDescription: string;
  taskType: 'sales' | 'marketing' | 'customer_service' | 'analytics' | 'automation' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  complexity: 'simple' | 'intermediate' | 'advanced';
  requiredAgents: string[];
  userProvidedData: Record<string, any>;
  crmContext: Record<string, any>;
  expectedOutcome: string;
  successCriteria: string[];
  deadline?: string;
  estimatedDuration: number;
  businessValue: number;
  tags: string[];
  createdBy: string;
  createdAt: string;
}

export interface GPT5TaskAnalysis {
  taskId: string;
  feasibilityScore: number;
  requiredInformation: RequiredTaskField[];
  suggestedAgents: AgentRecommendation[];
  estimatedSteps: TaskExecutionStep[];
  riskAssessment: RiskFactor[];
  expectedBusinessImpact: BusinessImpact;
  alternativeApproaches?: AlternativeApproach[];
}

export interface RequiredTaskField {
  fieldName: string;
  fieldType: 'text' | 'email' | 'phone' | 'date' | 'select' | 'multiselect' | 'contact' | 'deal' | 'number' | 'textarea';
  fieldLabel: string;
  fieldDescription: string;
  isRequired: boolean;
  validationRules: string[];
  gpt5Suggestions?: string[];
  crmDataSource?: string;
  placeholder?: string;
}

export interface AgentRecommendation {
  agentName: string;
  confidence: number;
  reasoning: string;
  estimatedContribution: string;
  requiredTools: string[];
  estimatedDuration: number;
}

export interface TaskExecutionStep {
  stepNumber: number;
  stepName: string;
  stepDescription: string;
  assignedAgent: string;
  requiredInputs: string[];
  expectedOutputs: string[];
  toolsRequired: string[];
  dependsOnSteps: number[];
  canRunInParallel: boolean;
  estimatedDuration: number;
  businessImpact: string;
}

export interface RiskFactor {
  riskType: 'data_quality' | 'tool_availability' | 'complexity' | 'business_impact';
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
  probability: number;
}

export interface BusinessImpact {
  estimatedRevenue: number;
  timeSaved: number;
  efficiencyGain: number;
  qualityImprovement: number;
  riskReduction: number;
  customerSatisfaction: number;
  scalabilityFactor: number;
  competitiveAdvantage: string;
  longTermValue: string;
}

export interface AlternativeApproach {
  approachName: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedEffort: number;
  recommendationScore: number;
}

export interface CompletedTaskResult {
  taskExecutionId: string;
  originalTask: EnhancedTaskInput;
  executionSummary: ExecutionSummary;
  businessOutcome: BusinessOutcome;
  agentPerformance: AgentPerformanceMetric[];
  crmUpdates: CrmUpdateRecord[];
  generatedAssets: GeneratedAsset[];
  lessonsLearned: string[];
  nextRecommendedActions: string[];
  completedAt: string;
}

export interface ExecutionSummary {
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalDuration: number;
  agentsUsed: number;
  toolsUtilized: string[];
  apiCallsMade: number;
  errorsEncountered: number;
  userInterventionsRequired: number;
}

export interface BusinessOutcome {
  contactsCreated: number;
  contactsUpdated: number;
  dealsCreated: number;
  dealsProgressed: number;
  emailsSent: number;
  meetingsScheduled: number;
  documentsGenerated: number;
  revenueImpact: number;
  timeSaved: number;
  efficiencyGain: number;
}

export interface AgentPerformanceMetric {
  agentName: string;
  tasksCompleted: number;
  averageExecutionTime: number;
  successRate: number;
  toolsUsed: string[];
  businessValueGenerated: number;
  errorRate: number;
  learningProgress: number;
}

export interface CrmUpdateRecord {
  recordType: 'contact' | 'deal' | 'activity' | 'appointment';
  recordId: string;
  updateType: 'created' | 'updated' | 'deleted';
  fieldChanges: Record<string, any>;
  agentResponsible: string;
  timestamp: string;
  businessReason: string;
}

export interface GeneratedAsset {
  assetType: 'email' | 'document' | 'presentation' | 'report' | 'script' | 'proposal';
  assetName: string;
  assetContent: string;
  generatedBy: string;
  usedFor: string;
  quality: number;
  timestamp: string;
}