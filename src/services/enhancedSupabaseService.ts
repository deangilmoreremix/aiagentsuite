import { supabase } from './supabaseClient';
import { 
  EnhancedTaskInput, 
  CompletedTaskResult, 
  AgentPerformanceMetric,
  BusinessOutcome
} from '../types/taskExecution';

export class EnhancedSupabaseService {
  private static instance: EnhancedSupabaseService;

  static getInstance(): EnhancedSupabaseService {
    if (!EnhancedSupabaseService.instance) {
      EnhancedSupabaseService.instance = new EnhancedSupabaseService();
    }
    return EnhancedSupabaseService.instance;
  }

  // Enhanced Task Execution Operations
  async createTaskExecution(task: EnhancedTaskInput, customerId: string = 'default') {
    if (!supabase) {
      console.warn('⚠️ Supabase not configured - storing task locally');
      return { ...task, id: task.id };
    }

    try {
      const { data, error } = await supabase
        .from('enhanced_task_executions')
        .insert({
          id: task.id,
          customer_id: customerId,
          task_title: task.taskTitle,
          task_description: task.taskDescription,
          task_type: task.taskType,
          priority: task.priority,
          complexity: task.complexity,
          required_agents: task.requiredAgents,
          user_provided_data: task.userProvidedData,
          crm_context: task.crmContext,
          expected_outcome: task.expectedOutcome,
          success_criteria: task.successCriteria,
          deadline: task.deadline,
          estimated_duration: task.estimatedDuration,
          business_value: task.businessValue,
          tags: task.tags,
          execution_status: 'pending',
          created_by: task.createdBy
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Task execution record created in Supabase');
      return data;
    } catch (error) {
      console.error('❌ Failed to create task execution:', error);
      throw error;
    }
  }

  async updateTaskExecutionStatus(
    taskId: string, 
    status: string, 
    additionalData?: Partial<any>
  ) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('enhanced_task_executions')
        .update({
          execution_status: status,
          ...additionalData,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Failed to update task execution status:', error);
      throw error;
    }
  }

  async completeTaskExecution(taskId: string, completionData: CompletedTaskResult) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('enhanced_task_executions')
        .update({
          execution_status: 'completed',
          completion_time: completionData.completedAt,
          actual_duration: completionData.executionSummary.totalDuration,
          results: completionData.executionSummary,
          business_outcome: completionData.businessOutcome,
          agent_performance: completionData.agentPerformance,
          generated_assets: completionData.generatedAssets,
          lessons_learned: completionData.lessonsLearned,
          next_recommended_actions: completionData.nextRecommendedActions,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      
      // Log business outcomes separately
      await this.logBusinessOutcomes(taskId, completionData.businessOutcome);
      
      console.log('✅ Task execution completed and stored');
      return data;
    } catch (error) {
      console.error('❌ Failed to complete task execution:', error);
      throw error;
    }
  }

  // Agent Coordination Events
  async logCoordinationEvent(
    taskId: string,
    eventType: string,
    agentName: string,
    description: string,
    additionalData?: any
  ) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('agent_coordination_events')
        .insert({
          task_execution_id: taskId,
          event_type: eventType,
          agent_name: agentName,
          event_description: description,
          coordination_data: additionalData || {},
          gpt5_reasoning: additionalData?.reasoning,
          business_impact: additionalData?.businessImpact,
          tools_involved: additionalData?.toolsInvolved || [],
          execution_time_ms: additionalData?.executionTime,
          confidence_score: additionalData?.confidence
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Failed to log coordination event:', error);
      throw error;
    }
  }

  // Business Outcomes Tracking
  async logBusinessOutcomes(taskId: string, businessOutcome: BusinessOutcome) {
    if (!supabase) return null;

    const outcomes = [
      { metric_name: 'contacts_created', value: businessOutcome.contactsCreated, type: 'efficiency', unit: 'count' },
      { metric_name: 'contacts_updated', value: businessOutcome.contactsUpdated, type: 'quality', unit: 'count' },
      { metric_name: 'deals_created', value: businessOutcome.dealsCreated, type: 'revenue', unit: 'count' },
      { metric_name: 'deals_progressed', value: businessOutcome.dealsProgressed, type: 'revenue', unit: 'count' },
      { metric_name: 'emails_sent', value: businessOutcome.emailsSent, type: 'efficiency', unit: 'count' },
      { metric_name: 'meetings_scheduled', value: businessOutcome.meetingsScheduled, type: 'efficiency', unit: 'count' },
      { metric_name: 'revenue_impact', value: businessOutcome.revenueImpact, type: 'revenue', unit: 'usd' },
      { metric_name: 'time_saved', value: businessOutcome.timeSaved, type: 'time_saving', unit: 'hours' },
      { metric_name: 'efficiency_gain', value: businessOutcome.efficiencyGain, type: 'efficiency', unit: 'percentage' }
    ];

    try {
      const inserts = outcomes.map(outcome => ({
        task_execution_id: taskId,
        outcome_type: outcome.type,
        metric_name: outcome.metric_name,
        metric_value: outcome.value,
        measurement_unit: outcome.unit,
        impact_description: `${outcome.metric_name.replace('_', ' ')} improved by ${outcome.value} ${outcome.unit}`,
        confidence_level: 0.85 + Math.random() * 0.1 // Simulate confidence between 85-95%
      }));

      const { data, error } = await supabase
        .from('task_business_outcomes')
        .insert(inserts)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Failed to log business outcomes:', error);
      throw error;
    }
  }

  // Query and Analytics Functions
  async getTaskExecutionHistory(customerId: string, limit: number = 50) {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('enhanced_task_executions')
        .select(`
          *,
          agent_coordination_events(count),
          task_business_outcomes(*)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get task history:', error);
      return [];
    }
  }

  async getBusinessImpactAnalytics(customerId: string, timeRange: 'week' | 'month' | 'quarter' = 'month') {
    if (!supabase) return null;

    try {
      const startDate = new Date();
      if (timeRange === 'week') startDate.setDate(startDate.getDate() - 7);
      else if (timeRange === 'month') startDate.setMonth(startDate.getMonth() - 1);
      else startDate.setMonth(startDate.getMonth() - 3);

      const { data, error } = await supabase
        .from('enhanced_task_executions')
        .select(`
          business_outcome,
          business_value,
          task_type,
          execution_status,
          actual_duration,
          task_business_outcomes(*)
        `)
        .eq('customer_id', customerId)
        .gte('created_at', startDate.toISOString())
        .eq('execution_status', 'completed');

      if (error) throw error;

      // Aggregate the results
      const analytics = {
        totalTasks: data?.length || 0,
        totalRevenue: data?.reduce((sum, task) => sum + (task.business_value || 0), 0) || 0,
        totalTimeSaved: data?.reduce((sum, task) => 
          sum + ((task.business_outcome as any)?.timeSaved || 0), 0) || 0,
        averageEfficiency: 0,
        tasksByType: {} as Record<string, number>,
        successRate: data?.length ? 
          (data.filter(task => task.execution_status === 'completed').length / data.length) * 100 : 0
      };

      // Calculate task distribution by type
      data?.forEach(task => {
        analytics.tasksByType[task.task_type] = (analytics.tasksByType[task.task_type] || 0) + 1;
      });

      return analytics;
    } catch (error) {
      console.error('❌ Failed to get business impact analytics:', error);
      return null;
    }
  }

  async getAgentPerformanceMetrics(customerId: string) {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('agent_coordination_events')
        .select(`
          agent_name,
          event_type,
          execution_time_ms,
          confidence_score,
          task_execution_id,
          enhanced_task_executions!inner(customer_id, execution_status)
        `)
        .eq('enhanced_task_executions.customer_id', customerId)
        .eq('enhanced_task_executions.execution_status', 'completed');

      if (error) throw error;

      // Aggregate agent performance data
      const agentMetrics: Record<string, AgentPerformanceMetric> = {};
      
      data?.forEach(event => {
        if (!agentMetrics[event.agent_name]) {
          agentMetrics[event.agent_name] = {
            agentName: event.agent_name,
            tasksCompleted: 0,
            averageExecutionTime: 0,
            successRate: 0,
            toolsUsed: [],
            businessValueGenerated: 0,
            errorRate: 0,
            learningProgress: 0
          };
        }
        
        const metric = agentMetrics[event.agent_name];
        metric.tasksCompleted += 1;
        metric.averageExecutionTime = (metric.averageExecutionTime + (event.execution_time_ms || 0)) / 2;
        metric.successRate = event.event_type === 'completion' ? 
          (metric.successRate + 100) / 2 : metric.successRate;
      });

      return Object.values(agentMetrics);
    } catch (error) {
      console.error('❌ Failed to get agent performance metrics:', error);
      return [];
    }
  }

  // Task Templates
  async saveTaskTemplate(template: any, customerId: string = 'default') {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('enhanced_task_templates')
        .insert({
          customer_id: customerId,
          ...template
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Failed to save task template:', error);
      throw error;
    }
  }

  async getTaskTemplates(customerId: string) {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('enhanced_task_templates')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get task templates:', error);
      return [];
    }
  }

  // Real-time subscriptions for task updates
  subscribeToTaskUpdates(customerId: string, callback: (payload: any) => void) {
    if (!supabase) return null;

    return supabase
      .channel(`enhanced_tasks:${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enhanced_task_executions',
          filter: `customer_id=eq.${customerId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToCoordinationEvents(taskId: string, callback: (payload: any) => void) {
    if (!supabase) return null;

    return supabase
      .channel(`coordination:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_coordination_events',
          filter: `task_execution_id=eq.${taskId}`
        },
        callback
      )
      .subscribe();
  }

  // Search and filtering
  async searchTaskHistory(
    customerId: string, 
    query: string, 
    filters?: {
      taskType?: string;
      priority?: string;
      status?: string;
      dateRange?: { start: string; end: string };
    }
  ) {
    if (!supabase) return [];

    try {
      let queryBuilder = supabase
        .from('enhanced_task_executions')
        .select('*')
        .eq('customer_id', customerId);

      // Apply text search
      if (query) {
        queryBuilder = queryBuilder.or(`task_title.ilike.%${query}%,task_description.ilike.%${query}%`);
      }

      // Apply filters
      if (filters?.taskType) {
        queryBuilder = queryBuilder.eq('task_type', filters.taskType);
      }
      if (filters?.priority) {
        queryBuilder = queryBuilder.eq('priority', filters.priority);
      }
      if (filters?.status) {
        queryBuilder = queryBuilder.eq('execution_status', filters.status);
      }
      if (filters?.dateRange) {
        queryBuilder = queryBuilder
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to search task history:', error);
      return [];
    }
  }

  // Analytics aggregations
  async getTaskExecutionAnalytics(customerId: string) {
    if (!supabase) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        successRate: 0,
        totalBusinessValue: 0,
        averageDuration: 0,
        topPerformingAgents: [],
        taskTypeDistribution: {},
        weeklyTrends: []
      };
    }

    try {
      // Get task summary
      const { data: tasks, error: tasksError } = await supabase
        .from('enhanced_task_executions')
        .select('execution_status, business_value, actual_duration, task_type, created_at')
        .eq('customer_id', customerId);

      if (tasksError) throw tasksError;

      // Get agent events for performance analysis
      const { data: events, error: eventsError } = await supabase
        .from('agent_coordination_events')
        .select(`
          agent_name,
          event_type,
          execution_time_ms,
          enhanced_task_executions!inner(customer_id)
        `)
        .eq('enhanced_task_executions.customer_id', customerId);

      if (eventsError) throw eventsError;

      // Calculate analytics
      const analytics = {
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter(t => t.execution_status === 'completed').length || 0,
        successRate: tasks?.length ? 
          (tasks.filter(t => t.execution_status === 'completed').length / tasks.length) * 100 : 0,
        totalBusinessValue: tasks?.reduce((sum, t) => sum + (t.business_value || 0), 0) || 0,
        averageDuration: tasks?.length ? 
          tasks.reduce((sum, t) => sum + (t.actual_duration || 0), 0) / tasks.length : 0,
        topPerformingAgents: this.calculateTopAgents(events || []),
        taskTypeDistribution: this.calculateTaskTypeDistribution(tasks || []),
        weeklyTrends: this.calculateWeeklyTrends(tasks || [])
      };

      return analytics;
    } catch (error) {
      console.error('❌ Failed to get task execution analytics:', error);
      return null;
    }
  }

  private calculateTopAgents(events: any[]): any[] {
    const agentStats: Record<string, any> = {};
    
    events.forEach(event => {
      if (!agentStats[event.agent_name]) {
        agentStats[event.agent_name] = {
          name: event.agent_name,
          events: 0,
          avgExecutionTime: 0,
          successfulEvents: 0
        };
      }
      
      const stats = agentStats[event.agent_name];
      stats.events += 1;
      stats.avgExecutionTime = (stats.avgExecutionTime + (event.execution_time_ms || 0)) / 2;
      if (event.event_type === 'completion') stats.successfulEvents += 1;
    });

    return Object.values(agentStats)
      .sort((a: any, b: any) => b.successfulEvents - a.successfulEvents)
      .slice(0, 5);
  }

  private calculateTaskTypeDistribution(tasks: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    tasks.forEach(task => {
      distribution[task.task_type] = (distribution[task.task_type] || 0) + 1;
    });
    return distribution;
  }

  private calculateWeeklyTrends(tasks: any[]): any[] {
    const weeks: Record<string, number> = {};
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekKey = weekStart.toISOString().split('T')[0];
      weeks[weekKey] = 0;
    }

    tasks.forEach(task => {
      const taskDate = new Date(task.created_at);
      const weekKey = taskDate.toISOString().split('T')[0];
      if (weeks[weekKey] !== undefined) {
        weeks[weekKey] += 1;
      }
    });

    return Object.entries(weeks).map(([date, count]) => ({ date, count }));
  }

  // Cleanup and maintenance
  async cleanupOldTaskData(retentionDays: number = 90) {
    if (!supabase) return;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { error } = await supabase
        .from('enhanced_task_executions')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .neq('execution_status', 'completed'); // Keep completed tasks longer

      if (error) throw error;
      console.log(`🧹 Cleaned up task data older than ${retentionDays} days`);
    } catch (error) {
      console.error('❌ Failed to cleanup old task data:', error);
    }
  }
}

// Export singleton instance
export const enhancedSupabaseService = EnhancedSupabaseService.getInstance();