/*
  # Contextual Memory and Enhanced AI Features

  1. New Tables
    - `conversation_contexts` - Store user conversation sessions and context
    - `conversation_messages` - Individual messages with embeddings and entities
    - `user_profiles` - Business profiles for personalized recommendations
    - `proactive_suggestions` - AI-generated suggestions and their status
    - `ai_insights` - GPT-5 generated insights and recommendations

  2. Security
    - Enable RLS on all new tables
    - Add policies for user access control
    - Ensure data privacy and isolation

  3. Features
    - Semantic search capabilities with embeddings
    - Conversation context tracking
    - Proactive AI assistance
    - Personalized goal recommendations
*/

-- Conversation Contexts Table
CREATE TABLE IF NOT EXISTS conversation_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  crm_context jsonb DEFAULT '{}',
  user_profile jsonb DEFAULT '{}',
  business_context text,
  current_intent text,
  conversation_summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Conversation Messages Table  
CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id uuid REFERENCES conversation_contexts(id) ON DELETE CASCADE,
  message_type text CHECK (message_type IN ('user', 'ai', 'system')) NOT NULL,
  content text NOT NULL,
  agent_name text,
  actions text[],
  crm_entities jsonb DEFAULT '[]',
  embedding vector(768), -- For semantic search
  confidence_score numeric(5,2),
  emotional_tone text,
  audio_url text,
  tools_used text[],
  created_at timestamptz DEFAULT now()
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  industry text,
  company_size text CHECK (company_size IN ('startup', 'smb', 'enterprise')),
  sales_process_maturity text CHECK (sales_process_maturity IN ('basic', 'intermediate', 'advanced')),
  current_challenges text[],
  technical_skill text CHECK (technical_skill IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
  business_priorities text[],
  crm_usage jsonb DEFAULT '{}',
  goal_history text[],
  preferred_communication text CHECK (preferred_communication IN ('text', 'voice', 'both')) DEFAULT 'both',
  working_hours jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Proactive Suggestions Table
CREATE TABLE IF NOT EXISTS proactive_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suggestion_type text CHECK (suggestion_type IN ('action', 'insight', 'goal', 'optimization', 'warning')) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  confidence_score numeric(5,2) NOT NULL,
  category text NOT NULL,
  is_actionable boolean DEFAULT true,
  suggested_command text,
  estimated_value numeric(12,2),
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status text CHECK (status IN ('active', 'executed', 'dismissed', 'expired')) DEFAULT 'active',
  expires_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  insight_type text CHECK (insight_type IN ('business', 'performance', 'optimization', 'prediction', 'trend')) NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  confidence_score numeric(5,2),
  data_sources text[],
  relevance_score numeric(5,2),
  actionable_recommendations text[],
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Personalized Goal Recommendations Table
CREATE TABLE IF NOT EXISTS personalized_goal_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id text NOT NULL,
  relevance_score numeric(5,2) NOT NULL,
  reasoning text NOT NULL,
  expected_impact text NOT NULL,
  setup_priority integer NOT NULL,
  personalized_description text NOT NULL,
  estimated_roi numeric(12,2),
  time_to_value text,
  prerequisites text[],
  customization_suggestions text[],
  status text CHECK (status IN ('recommended', 'selected', 'completed', 'dismissed')) DEFAULT 'recommended',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_user_id ON conversation_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_session_id ON conversation_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_context_id ON conversation_messages(context_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_embedding ON conversation_messages USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);
CREATE INDEX IF NOT EXISTS idx_user_business_profiles_user_id ON user_business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_user_id ON proactive_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_status ON proactive_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_priority ON proactive_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_ai_insights_enhanced_user_id ON ai_insights_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_goal_recommendations_user_id ON personalized_goal_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_goal_recommendations_relevance ON personalized_goal_recommendations(relevance_score DESC);

-- Enable Row Level Security
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_goal_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_contexts
CREATE POLICY "Users can manage their own conversation contexts"
  ON conversation_contexts
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for conversation_messages
CREATE POLICY "Users can access messages in their contexts"
  ON conversation_messages
  FOR ALL
  TO authenticated
  USING (
    context_id IN (
      SELECT id FROM conversation_contexts 
      WHERE user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    context_id IN (
      SELECT id FROM conversation_contexts 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- RLS Policies for user_business_profiles
CREATE POLICY "Users can manage their own business profile"
  ON user_business_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for proactive_suggestions
CREATE POLICY "Users can access their own suggestions"
  ON proactive_suggestions
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for ai_insights_enhanced
CREATE POLICY "Users can access their own AI insights"
  ON ai_insights_enhanced
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for personalized_goal_recommendations
CREATE POLICY "Users can access their own goal recommendations"
  ON personalized_goal_recommendations
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_conversation_contexts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_personalized_goal_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_conversation_contexts_updated_at_trigger
  BEFORE UPDATE ON conversation_contexts
  FOR EACH ROW EXECUTE FUNCTION update_conversation_contexts_updated_at();

CREATE TRIGGER update_user_business_profiles_updated_at_trigger
  BEFORE UPDATE ON user_business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_business_profiles_updated_at();

CREATE TRIGGER update_personalized_goal_recommendations_updated_at_trigger
  BEFORE UPDATE ON personalized_goal_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_personalized_goal_recommendations_updated_at();