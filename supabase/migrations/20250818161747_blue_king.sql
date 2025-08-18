/*
  # Enhanced Task Execution System

  1. New Tables
    - `enhanced_task_executions`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `task_title` (text)
      - `task_description` (text)
      - `task_type` (text)
      - `priority` (text)
      - `complexity` (text)
      - `required_agents` (text[])
      - `user_provided_data` (jsonb)
      - `crm_context` (jsonb)
      - `expected_outcome` (text)
      - `success_criteria` (text[])
      - `deadline` (timestamptz)
      - `estimated_duration` (integer)
      - `business_value` (numeric)
      - `tags` (text[])
      - `execution_status` (text)
      - `start_time` (timestamptz)
      - `completion_time` (timestamptz)
      - `actual_duration` (integer)
      - `results` (jsonb)
      - `business_outcome` (jsonb)
      - `gpt5_analysis` (jsonb)
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `agent_coordination_events`
      - `id` (uuid, primary key)
      - `task_execution_id` (uuid, foreign key)
      - `event_type` (text)
      - `agent_name` (text)
      - `event_description` (text)
      - `coordination_data` (jsonb)
      - `gpt5_reasoning` (text)
      - `timestamp` (timestamptz)

    - `task_business_outcomes`
      - `id` (uuid, primary key)
      - `task_execution_id` (uuid, foreign key)
      - `outcome_type` (text)
      - `metric_name` (text)
      - `metric_value` (numeric)
      - `measurement_unit` (text)
      - `impact_description` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for tenant access
    - Add indexes for performance
*/

-- Enhanced Task Executions Table
CREATE TABLE IF NOT EXISTS enhanced_task_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  task_title text NOT NULL,
  task_description text,
  task_type text NOT NULL CHECK (task_type IN ('sales', 'marketing', 'customer_service', 'analytics', 'automation', 'custom')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  complexity text NOT NULL DEFAULT 'intermediate' CHECK (complexity IN ('simple', 'intermediate', 'advanced')),
  required_agents text[] DEFAULT ARRAY[]::text[],
  user_provided_data jsonb DEFAULT '{}'::jsonb,
  crm_context jsonb DEFAULT '{}'::jsonb,
  expected_outcome text,
  success_criteria text[] DEFAULT ARRAY[]::text[],
  deadline timestamptz,
  estimated_duration integer DEFAULT 15,
  business_value numeric(12,2) DEFAULT 0,
  tags text[] DEFAULT ARRAY[]::text[],
  execution_status text DEFAULT 'pending' CHECK (execution_status IN ('pending', 'analyzing', 'executing', 'completed', 'failed', 'cancelled')),
  start_time timestamptz,
  completion_time timestamptz,
  actual_duration integer,
  results jsonb DEFAULT '{}'::jsonb,
  business_outcome jsonb DEFAULT '{}'::jsonb,
  gpt5_analysis jsonb DEFAULT '{}'::jsonb,
  agent_performance jsonb DEFAULT '[]'::jsonb,
  generated_assets jsonb DEFAULT '[]'::jsonb,
  lessons_learned text[] DEFAULT ARRAY[]::text[],
  next_recommended_actions text[] DEFAULT ARRAY[]::text[],
  error_message text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent Coordination Events Table
CREATE TABLE IF NOT EXISTS agent_coordination_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_execution_id uuid REFERENCES enhanced_task_executions(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('coordination', 'execution', 'completion', 'error', 'optimization')),
  agent_name text NOT NULL,
  event_description text NOT NULL,
  coordination_data jsonb DEFAULT '{}'::jsonb,
  gpt5_reasoning text,
  business_impact text,
  tools_involved text[] DEFAULT ARRAY[]::text[],
  execution_time_ms integer,
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  timestamp timestamptz DEFAULT now()
);

-- Task Business Outcomes Table
CREATE TABLE IF NOT EXISTS task_business_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_execution_id uuid REFERENCES enhanced_task_executions(id) ON DELETE CASCADE,
  outcome_type text NOT NULL CHECK (outcome_type IN ('revenue', 'efficiency', 'quality', 'satisfaction', 'cost_saving', 'time_saving')),
  metric_name text NOT NULL,
  metric_value numeric(12,2) NOT NULL,
  measurement_unit text,
  impact_description text,
  confidence_level numeric(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  measurement_method text,
  baseline_value numeric(12,2),
  improvement_percentage numeric(5,2),
  created_at timestamptz DEFAULT now()
);

-- Task Templates Table (for reusable task patterns)
CREATE TABLE IF NOT EXISTS enhanced_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  template_description text,
  task_type text NOT NULL,
  template_data jsonb NOT NULL,
  required_fields jsonb DEFAULT '[]'::jsonb,
  default_values jsonb DEFAULT '{}'::jsonb,
  agent_workflow jsonb DEFAULT '[]'::jsonb,
  business_impact_template text,
  success_metrics_template text[] DEFAULT ARRAY[]::text[],
  usage_count integer DEFAULT 0,
  average_success_rate numeric(5,2) DEFAULT 0,
  average_business_value numeric(12,2) DEFAULT 0,
  last_used timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE enhanced_task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_coordination_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_business_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_task_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Tenant access to enhanced_task_executions"
  ON enhanced_task_executions
  FOR ALL
  TO authenticated
  USING (customer_id IN (
    SELECT customers.id FROM customers WHERE customers.id = enhanced_task_executions.customer_id
  ))
  WITH CHECK (customer_id IN (
    SELECT customers.id FROM customers WHERE customers.id = enhanced_task_executions.customer_id
  ));

CREATE POLICY "Tenant access to agent_coordination_events"
  ON agent_coordination_events
  FOR ALL
  TO authenticated
  USING (task_execution_id IN (
    SELECT enhanced_task_executions.id 
    FROM enhanced_task_executions 
    JOIN customers ON customers.id = enhanced_task_executions.customer_id
    WHERE customers.id = enhanced_task_executions.customer_id
  ));

CREATE POLICY "Tenant access to task_business_outcomes"
  ON task_business_outcomes
  FOR ALL
  TO authenticated
  USING (task_execution_id IN (
    SELECT enhanced_task_executions.id 
    FROM enhanced_task_executions 
    JOIN customers ON customers.id = enhanced_task_executions.customer_id
    WHERE customers.id = enhanced_task_executions.customer_id
  ));

CREATE POLICY "Tenant access to enhanced_task_templates"
  ON enhanced_task_templates
  FOR ALL
  TO authenticated
  USING (customer_id IN (
    SELECT customers.id FROM customers WHERE customers.id = enhanced_task_templates.customer_id
  ))
  WITH CHECK (customer_id IN (
    SELECT customers.id FROM customers WHERE customers.id = enhanced_task_templates.customer_id
  ));

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_enhanced_task_executions_customer_id ON enhanced_task_executions(customer_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_task_executions_status ON enhanced_task_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_enhanced_task_executions_created_at ON enhanced_task_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_task_executions_task_type ON enhanced_task_executions(task_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_task_executions_priority ON enhanced_task_executions(priority);

CREATE INDEX IF NOT EXISTS idx_agent_coordination_events_task_id ON agent_coordination_events(task_execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_coordination_events_timestamp ON agent_coordination_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_coordination_events_agent_name ON agent_coordination_events(agent_name);

CREATE INDEX IF NOT EXISTS idx_task_business_outcomes_task_id ON task_business_outcomes(task_execution_id);
CREATE INDEX IF NOT EXISTS idx_task_business_outcomes_type ON task_business_outcomes(outcome_type);
CREATE INDEX IF NOT EXISTS idx_task_business_outcomes_value ON task_business_outcomes(metric_value DESC);

CREATE INDEX IF NOT EXISTS idx_enhanced_task_templates_customer_id ON enhanced_task_templates(customer_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_task_templates_active ON enhanced_task_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_enhanced_task_templates_usage ON enhanced_task_templates(usage_count DESC);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_enhanced_task_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enhanced_task_executions_updated_at
  BEFORE UPDATE ON enhanced_task_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_enhanced_task_executions_updated_at();

CREATE TRIGGER update_enhanced_task_templates_updated_at
  BEFORE UPDATE ON enhanced_task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();