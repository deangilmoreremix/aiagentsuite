// API Configuration and Validation
export const apiConfig = {
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    isConfigured: !!import.meta.env.VITE_OPENAI_API_KEY && 
                  import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here' &&
                  import.meta.env.VITE_OPENAI_API_KEY.startsWith('sk-')
  },
  elevenlabs: {
    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
    isConfigured: !!import.meta.env.VITE_ELEVENLABS_API_KEY && 
                  import.meta.env.VITE_ELEVENLABS_API_KEY !== 'your_elevenlabs_api_key_here'
  },
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    isConfigured: !!import.meta.env.VITE_GEMINI_API_KEY && 
                  import.meta.env.VITE_GEMINI_API_KEY !== 'your_gemini_api_key_here'
  },
  composio: {
    apiKey: import.meta.env.VITE_COMPOSIO_API_KEY,
    isConfigured: !!import.meta.env.VITE_COMPOSIO_API_KEY && 
                  import.meta.env.VITE_COMPOSIO_API_KEY !== 'your_composio_api_key_here'
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    isConfigured: !!import.meta.env.VITE_SUPABASE_URL && 
                  !!import.meta.env.VITE_SUPABASE_ANON_KEY &&
                  import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url'
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
    console.log('OpenAI:', apiConfig.openai.isConfigured ? '✅ Configured' : '❌ Missing');
    console.log('Gemini:', apiConfig.gemini.isConfigured ? '✅ Configured' : '❌ Missing');
    console.log('ElevenLabs:', apiConfig.elevenlabs.isConfigured ? '✅ Configured' : '⚠️ Missing (optional)');
    console.log('Composio:', apiConfig.composio.isConfigured ? '✅ Configured' : '⚠️ Missing (fallback available)');
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