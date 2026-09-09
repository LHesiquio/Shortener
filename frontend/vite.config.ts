import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
const VENDOR_RULES = [
  { test: (id: string) => id.includes('recharts') || id.includes('d3-'), chunk: 'vendor-charts' },
  { test: (id: string) => id.includes('@tanstack/react-query'), chunk: 'vendor-query' },
  { test: (id: string) => id.includes('morphicons') || id.includes('lucide'), chunk: 'vendor-icons' },
  { test: (id: string) => id.includes('react-router') || id.includes('react-dom') || id.includes('react/'), chunk: 'vendor-react' },
];

function resolveVendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  const rule = VENDOR_RULES.find((r) => r.test(id));
  return rule?.chunk;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: resolveVendorChunk,
      },
    },
  },
  server: {
    host: true,
    allowedHosts: true, // Allow ngrok-free.app and external tunnel domains
    proxy: {
      '/r': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
});
