import { defineConfig } from 'vitest/config';

// Minimal Vitest setup: the agent/tool modules under test are plain TS
// (no DOM required), so the Node environment is enough.
//
// The app reads configuration from `import.meta.env` at module load time
// (see `src/config/apiConfig.ts`), so the OpenAI/Supabase vars are pinned to
// empty strings here. That keeps every test run offline and deterministic:
// no real API key is ever picked up from the ambient environment or a local
// `.env` file.
export default defineConfig({
  test: {
    environment: 'node',
    env: {
      VITE_OPENAI_API_KEY: '',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: ''
    }
  }
});
