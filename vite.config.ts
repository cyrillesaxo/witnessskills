import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
        server: {
    port: 5173,
          strictPort: true,
      },
        optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
      },
        build: {
    target: 'esnext',
          minify: 'esbuild',
          cssCodeSplit: true,
          chunkSizeWarningLimit: 600,
          rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
        },
    });
