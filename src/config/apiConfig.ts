// API Configuration and Validation
//
// SECURITY: Private provider credentials (OpenAI, Gemini, ElevenLabs, Composio)
// are NEVER exposed to the browser. They live server-side inside Netlify
// Functions (see netlify/functions) and are read from non-public environment
// variables (OPENAI_API_KEY, GEMINI_API_KEY, ...). The client only learns
// WHETHER a provider is available — booleans fetched from GET /api/status —
// never a key value.
//
// The only intentionally public values here are Supabase's project URL and
// anon key, which are designed to be public and are protected by Row Level
// Security on the Supabase side.

export type ProviderName = 'openai' | 'gemini' | 'elevenlabs' | 'composio';

// Server-reported availability (booleans only — no secrets). Default false so
// the app renders in safe DEMO MODE until the server confirms a provider.
const providerStatus: Record<ProviderName, boolean> = {
  openai: false,
  gemini: false,
  elevenlabs: false,
  composio: false,
};

// Update status from GET /api/status (booleans only). Ignores non-boolean values.
export const setProviderStatus = (status?: Partial<Record<ProviderName, boolean>>) => {
  if (!status) return;
  (Object.keys(providerStatus) as ProviderName[]).forEach((k) => {
    if (typeof status[k] === 'boolean') providerStatus[k] = status[k] as boolean;
  });
};

// Reset to demo mode (used on logout / tests).
export const resetProviderStatus = () => {
  (Object.keys(providerStatus) as ProviderName[]).forEach((k) => (providerStatus[k] = false));
};

// Query the serverless status endpoint. Fails silently (stays in demo mode) when
// running locally or against a preview without functions deployed.
export const refreshProviderStatus = async (): Promise<void> => {
  try {
    const res = await fetch('/api/status', { headers: { Accept: 'application/json' } });
    if (!res.ok) return;
    const data = await res.json();
    setProviderStatus({
      openai: !!data?.openai,
      gemini: !!data?.gemini,
      elevenlabs: !!data?.elevenlabs,
      composio: !!data?.composio,
    });
  } catch {
    // No serverless endpoint reachable (local dev) → remain in demo mode.
  }
};

const isSet = (v: unknown, placeholder: string) =>
  typeof v === 'string' && v.length > 0 && v !== placeholder;

export const apiConfig = {
  openai: {
    defaultModel: 'gpt-5-main', // Updated for GPT-5
    reasoningModel: 'gpt-5-thinking', // For complex reasoning tasks
    get isConfigured() {
      return providerStatus.openai;
    }
  },
  elevenlabs: {
    get isConfigured() {
      return providerStatus.elevenlabs;
    }
  },
  gemini: {
    get isConfigured() {
      return providerStatus.gemini;
    }
  },
  composio: {
    get isConfigured() {
      return providerStatus.composio;
    }
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    get isConfigured() {
      return isSet(apiConfig.supabase.url, 'your_supabase_project_url') && isSet(apiConfig.supabase.anonKey, 'your_supabase_anon_key');
    }
  },
  isDevelopmentMode: import.meta.env.VITE_DEVELOPMENT_MODE === 'true',
  isProduction: import.meta.env.NODE_ENV === 'production'
};

// Validate API configuration
export const validateApiSetup = () => {
  const issues = [];
  const warnings = [];

  if (!apiConfig.openai.isConfigured && !apiConfig.gemini.isConfigured) {
    issues.push('No LLM provider configured. Please set up either OpenAI or Gemini API key');
  }

  if (!apiConfig.elevenlabs.isConfigured) {
    warnings.push('ElevenLabs API key not configured (voice features will be unavailable)');
  }

  if (!apiConfig.composio.isConfigured) {
    warnings.push('Composio API key not configured (tool integrations will use mock data)');
  }

  if (!apiConfig.supabase.isConfigured) {
    warnings.push('Supabase not configured (CRM data will be temporary)');
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    // At least one LLM provider is required for real mode
    canUseRealMode: apiConfig.openai.isConfigured || apiConfig.gemini.isConfigured,
    hasOpenAI: apiConfig.openai.isConfigured,
    hasGemini: apiConfig.gemini.isConfigured,
    hasVoice: apiConfig.elevenlabs.isConfigured,
    hasToolIntegration: apiConfig.composio.isConfigured,
    hasPersistence: apiConfig.supabase.isConfigured
  };
};

// Get default mode based on API configuration
export const getDefaultMode = (): boolean => {
  try {
    const validation = validateApiSetup();

    // Default to real mode if any LLM is configured and not in development
    return validation.canUseRealMode && !apiConfig.isDevelopmentMode;
  } catch (error) {
    console.error('Failed to get default mode:', error);
    return false; // Default to demo mode on error
  }
};

// Log configuration status
export const logApiStatus = () => {
  try {
    const validation = validateApiSetup();

    console.log('🔧 API Configuration Status:');
    console.log('OpenAI:', apiConfig.openai.isConfigured ? '✅ Configured (server-side)' : '❌ Missing');
    console.log('Gemini:', apiConfig.gemini.isConfigured ? '✅ Configured (server-side)' : '❌ Missing');
    console.log('ElevenLabs:', apiConfig.elevenlabs.isConfigured ? '✅ Configured (server-side)' : '⚠️ Missing (optional)');
    console.log('Composio:', apiConfig.composio.isConfigured ? '✅ Configured (server-side)' : '⚠️ Missing (fallback available)');
    console.log('Supabase:', apiConfig.supabase.isConfigured ? '✅ Configured' : '⚠️ Missing (temporary data)');
    console.log('Default Mode:', validation.canUseRealMode ? '🔴 Real Mode' : '🔵 Demo Mode');
    console.log('Available LLMs:', [
      validation.hasOpenAI ? 'OpenAI' : null,
      validation.hasGemini ? 'Gemini' : null
    ].filter(Boolean).join(', ') || 'None');

    if (validation.issues.length > 0) {
      console.warn('⚠️ Configuration Issues:', validation.issues);
    }

    if (validation.warnings.length > 0) {
      console.warn('💡 Configuration Warnings:', validation.warnings);
    }

    if (validation.canUseRealMode) {
      console.log('🚀 Ready for Real AI Execution!');
    } else {
      console.log('🔵 Demo Mode Active - Configure APIs for real execution');
    }
  } catch (error) {
    console.error('❌ Failed to log API status:', error);
  }
};
