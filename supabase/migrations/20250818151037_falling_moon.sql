/*
  # Enhanced Task Execution System with GPT-5

  1. New Tables
    - `task_executions` - Store user-initiated tasks and their execution status
    - `agent_task_logs` - Detailed logs of each agent's actions within a task
    - `task_templates` - Reusable task templates with input schemas
    - `agent_coordination_logs` - GPT-5 coordination decisions and reasoning

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own tasks
    - Add indexes for performance

  3. Features
    - Full audit trail of task execution
    - GPT-5 reasoning and decision logs
    - Business impact tracking
    - Agent collaboration history
*/

-- Task execution tracking
CREATE TABLE IF NOT EXISTS task_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  task_type text NOT NULL,
  task_title text NOT NULL,
  task_description text,
  user_input jsonb NOT NULL DEFAULT '{}',
  agent_workflow jsonb NOT NULL DEFAULT '[]',
  execution_status text DEFAULT 'pending' CHECK (execution_status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  start_time timestamptz DEFAULT now(),
  completion_time timestamptz,
  estimated_duration_minutes integer DEFAULT 15,
  actual_duration_seconds integer,
  results jsonb DEFAULT '{}',
  business_impact jsonb DEFAULT '{}',
  success_metrics jsonb DEFAULT '[]',
  gpt5_reasoning text,
  error_message text,
  created_by uuid,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  complexity text DEFAULT 'intermediate' CHECK (complexity IN ('simple', 'intermediate', 'advanced')),
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent task execution logs
CREATE TABLE IF NOT EXISTS agent_task_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_execution_id uuid REFERENCES task_executions(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  step_number integer NOT NULL,
  action_description text NOT NULL,
  tools_used text[] DEFAULT ARRAY[]::text[],
  input_parameters jsonb DEFAULT '{}',
  execution_start timestamptz DEFAULT now(),
  execution_end timestamptz,
  execution_time_seconds integer,
  success boolean DEFAULT true,
  result_data jsonb DEFAULT '{}',
  gpt5_reasoning text,
  error_message text,
  crm_changes jsonb DEFAULT '{}',
  business_value_generated numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Reusable task templates
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  template_description text,
  task_type text NOT NULL,
  input_schema jsonb NOT NULL DEFAULT '{}',
  default_values jsonb DEFAULT '{}',
  agent_workflow jsonb NOT NULL DEFAULT '[]',
  required_tools text[] DEFAULT ARRAY[]::text[],
  estimated_setup_time text DEFAULT '15 minutes',
  business_impact_description text,
  success_metrics text[] DEFAULT ARRAY[]::text[],
  usage_count integer DEFAULT 0,
  last_used timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- GPT-5 coordination and decision logs
CREATE TABLE IF NOT EXISTS agent_coordination_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_execution_id uuid REFERENCES task_executions(id) ON DELETE CASCADE,
  coordination_type text NOT NULL CHECK (coordination_type IN ('planning', 'execution', 'error_recovery', 'optimization')),
  gpt5_decision_reasoning text NOT NULL,
  input_context jsonb NOT NULL DEFAULT '{}',
  output_decision jsonb NOT NULL DEFAULT '{}',
  agents_involved text[] DEFAULT ARRAY[]::text[],
  execution_time_ms integer,
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_executions_customer_id ON task_executions(customer_id);
CREATE INDEX IF NOT EXISTS idx_task_executions_status ON task_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_task_executions_created_at ON task_executions(created_at);
CREATE INDEX IF NOT EXISTS idx_task_executions_task_type ON task_executions(task_type);

CREATE INDEX IF NOT EXISTS idx_agent_task_logs_task_execution_id ON agent_task_logs(task_execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_task_logs_agent_name ON agent_task_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_task_logs_execution_start ON agent_task_logs(execution_start);

CREATE INDEX IF NOT EXISTS idx_task_templates_customer_id ON task_templates(customer_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_task_type ON task_templates(task_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_active ON task_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_agent_coordination_logs_task_execution_id ON agent_coordination_logs(task_execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_coordination_logs_coordination_type ON agent_coordination_logs(coordination_type);

-- Enable RLS
ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_coordination_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own task executions"
  ON task_executions
  FOR ALL
  TO authenticated
  USING (customer_id IN (SELECT customers.id FROM customers WHERE customers.id = task_executions.customer_id))
  WITH CHECK (customer_id IN (SELECT customers.id FROM customers WHERE customers.id = task_executions.customer_id));

CREATE POLICY "Users can view agent task logs for their executions"
  ON agent_task_logs
  FOR ALL
  TO authenticated
  USING (task_execution_id IN (
    SELECT task_executions.id FROM task_executions 
    JOIN customers ON customers.id = task_executions.customer_id 
    WHERE customers.id = task_executions.customer_id
  ));

CREATE POLICY "Users can manage their own task templates"
  ON task_templates
  FOR ALL
  TO authenticated
  USING (customer_id IN (SELECT customers.id FROM customers WHERE customers.id = task_templates.customer_id))
  WITH CHECK (customer_id IN (SELECT customers.id FROM customers WHERE customers.id = task_templates.customer_id));

CREATE POLICY "Users can view coordination logs for their tasks"
  ON agent_coordination_logs
  FOR SELECT
  TO authenticated
  USING (task_execution_id IN (
    SELECT task_executions.id FROM task_executions 
    JOIN customers ON customers.id = task_executions.customer_id 
    WHERE customers.id = task_executions.customer_id
  ));