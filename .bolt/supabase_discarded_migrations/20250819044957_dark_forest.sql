/*
  # Phase 1 Intelligence Enhancement Tables

  This migration creates tables for enhanced AI intelligence features:
  
  1. New Tables
    - `conversation_contexts` - Session and conversation context storage
    - `conversation_messages` - Messages with embeddings for semantic search
    - `user_business_profiles` - User profiling for personalization
    - `proactive_suggestions` - AI-generated suggestions and insights
    - `personalized_goal_recommendations` - Tailored goal recommendations
    - `ai_insights_enhanced` - Advanced AI insights and analytics
    - `app_settings` - Application settings and preferences

  2. Security
    - Enable RLS on all new tables
    - Add policies for user access control
    - Ensure data isolation between users

  3. Indexes
    - Optimized indexes for query performance
    - Vector indexes for embedding search (where applicable)
*/

-- Conversation context storage for contextual memory
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

-- Messages with embeddings for semantic search
CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id uuid REFERENCES conversation_contexts(id) ON DELETE CASCADE,
  message_type text NOT NULL CHECK (message_type IN ('user', 'ai', 'system')),
  content text NOT NULL,
  agent_name text,
  actions text[],
  crm_entities jsonb DEFAULT '[]',
  embedding vector(768), -- OpenAI embedding dimension
  confidence_score numeric(5,2),
  emotional_tone text,
  audio_url text,
  tools_used text[],
  created_at timestamptz DEFAULT now()
);

-- User business profiles for personalization
CREATE TABLE IF NOT EXISTS user_business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  industry text,
  company_size text CHECK (company_size IN ('startup', 'smb', 'enterprise')),
  sales_process_maturity text CHECK (sales_process_maturity IN ('basic', 'intermediate', 'advanced')),
  current_challenges text[],
  technical_skill text DEFAULT 'intermediate' CHECK (technical_skill IN ('beginner', 'intermediate', 'advanced')),
  business_priorities text[],
  crm_usage jsonb DEFAULT '{}',
  goal_history text[],
  preferred_communication text DEFAULT 'both' CHECK (preferred_communication IN ('text', 'voice', 'both')),
  working_hours jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Proactive suggestions from AI analysis
CREATE TABLE IF NOT EXISTS proactive_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suggestion_type text NOT NULL CHECK (suggestion_type IN ('action', 'insight', 'goal', 'optimization', 'warning')),
  title text NOT NULL,
  description text NOT NULL,
  confidence_score numeric(5,2) NOT NULL,
  category text NOT NULL,
  is_actionable boolean DEFAULT true,
  suggested_command text,
  estimated_value numeric(12,2),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'executed', 'dismissed', 'expired')),
  expires_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Personalized goal recommendations
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
  status text DEFAULT 'recommended' CHECK (status IN ('recommended', 'selected', 'completed', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced AI insights
CREATE TABLE IF NOT EXISTS ai_insights_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('business', 'performance', 'optimization', 'prediction', 'trend')),
  title text NOT NULL,
  content text NOT NULL,
  confidence_score numeric(5,2),
  data_sources text[],
  relevance_score numeric(5,2),
  actionable_recommendations text[],
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Application settings
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_goal_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_user_id ON conversation_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_session_id ON conversation_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_context_id ON conversation_messages(context_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_business_profiles_user_id ON user_business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_user_id ON proactive_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_status ON proactive_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_priority ON proactive_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_personalized_goal_recommendations_user_id ON personalized_goal_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_goal_recommendations_relevance ON personalized_goal_recommendations(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_enhanced_user_id ON ai_insights_enhanced(user_id);

-- Vector index for semantic search (if vector extension is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    CREATE INDEX IF NOT EXISTS idx_conversation_messages_embedding ON conversation_messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- Row Level Security Policies

-- Conversation Contexts: Users can manage their own conversation contexts
CREATE POLICY "Users can manage their own conversation contexts"
  ON conversation_contexts
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Conversation Messages: Users can access messages in their contexts
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

-- User Business Profiles: Users can manage their own business profile
CREATE POLICY "Users can manage their own business profile"
  ON user_business_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Proactive Suggestions: Users can access their own suggestions
CREATE POLICY "Users can access their own suggestions"
  ON proactive_suggestions
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Personalized Goal Recommendations: Users can access their own goal recommendations
CREATE POLICY "Users can access their own goal recommendations"
  ON personalized_goal_recommendations
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- AI Insights Enhanced: Users can access their own AI insights
CREATE POLICY "Users can access their own AI insights"
  ON ai_insights_enhanced
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- App Settings: Users can manage own settings, also allow anonymous for global settings
CREATE POLICY "Users can manage own settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anonymous users can manage global settings"
  ON app_settings
  FOR ALL
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- Unique constraint for app_settings to prevent duplicate keys per user
CREATE UNIQUE INDEX IF NOT EXISTS app_settings_user_key_unique 
  ON app_settings (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), setting_key);

-- Trigger functions for updated_at timestamps
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

CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_conversation_contexts_updated_at_trigger ON conversation_contexts;
CREATE TRIGGER update_conversation_contexts_updated_at_trigger
  BEFORE UPDATE ON conversation_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_contexts_updated_at();

DROP TRIGGER IF EXISTS update_user_business_profiles_updated_at_trigger ON user_business_profiles;
CREATE TRIGGER update_user_business_profiles_updated_at_trigger
  BEFORE UPDATE ON user_business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_business_profiles_updated_at();

DROP TRIGGER IF EXISTS update_personalized_goal_recommendations_updated_at_trigger ON personalized_goal_recommendations;
CREATE TRIGGER update_personalized_goal_recommendations_updated_at_trigger
  BEFORE UPDATE ON personalized_goal_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_personalized_goal_recommendations_updated_at();

DROP TRIGGER IF EXISTS update_app_settings_updated_at_trigger ON app_settings;
CREATE TRIGGER update_app_settings_updated_at_trigger
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();