import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Matches modules that belong to the OpenAI Agents SDK (and the `openai` client
 * it is built on), including their nested `node_modules` dependencies.
 *
 * Handles npm/yarn layouts (`node_modules/@openai/agents-core/...`), nested
 * installs (`node_modules/openai/node_modules/...`) and pnpm's flattened store
 * layout (`node_modules/.pnpm/@openai+agents@x.y.z/node_modules/...`).
 */
function isOpenAIAgentsModule(id: string): boolean {
  // Normalize Windows separators so the substring checks below are portable.
  const path = id.split('\\').join('/');

  if (!path.includes('node_modules')) {
    return false;
  }

  return (
    // @openai/agents, @openai/agents-core, @openai/agents-openai, @openai/agents-realtime, ...
    path.includes('node_modules/@openai/agents') ||
    // pnpm store layout: node_modules/.pnpm/@openai+agents-core@0.1.0/node_modules/...
    path.includes('node_modules/.pnpm/@openai+agents') ||
    // the underlying `openai` client package (trailing slash avoids matching e.g. `openai-edge`)
    path.includes('node_modules/openai/') ||
    path.includes('node_modules/.pnpm/openai@')
  );
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process': {}
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        // Split the (large) OpenAI Agents SDK out of the main entry chunk so the
        // app shell stays well under the 500 kB chunk-size warning threshold.
        manualChunks(id: string) {
          if (isOpenAIAgentsModule(id)) {
            return 'openai-agents';
          }
          return undefined;
        },
      },
    },
  },
});
