import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          genai: ['@google/genai'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
