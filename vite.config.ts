import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process': {}
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Never emit source maps for production builds (avoids shipping any
  // build-time-inlined configuration or code in map files).
  build: {
    sourcemap: false,
  },
});